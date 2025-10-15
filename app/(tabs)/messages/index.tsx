import { useEffect, useState, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/utils/useAuth';
import { useFocusEffect } from '@react-navigation/native';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_photo?: string;
  relationship: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get all verified relationships
      const { data: relationships } = await supabase
        .from('relationships')
        .select(`
          *,
          profile_a:profiles!relationships_user_a_fkey(id, full_name, profile_photo_url),
          profile_b:profiles!relationships_user_b_fkey(id, full_name, profile_photo_url)
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq('is_verified', true);

      if (!relationships) return;

      // Get messages for each relationship
      const convos: Conversation[] = [];
      
      for (const rel of relationships) {
        const isUserA = rel.user_a === user.id;
        const otherUser = isUserA ? rel.profile_b : rel.profile_a;
        const relationship = isUserA ? rel.relationship_from_a_to_b : rel.relationship_from_b_to_a;
        
        if (!otherUser) continue;

        // Get last message
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1);

        // Count unread messages
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', otherUser.id)
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        convos.push({
          id: rel.id,
          other_user_id: otherUser.id,
          other_user_name: otherUser.full_name,
          other_user_photo: otherUser.profile_photo_url,
          relationship,
          last_message: messages?.[0]?.message_text,
          last_message_time: messages?.[0]?.created_at,
          unread_count: count || 0,
        });
      }

      // Sort by last message time
      convos.sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      });

      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadConversations]);

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
      style={styles.conversationItem}
      onPress={() => router.push({
        pathname: '/(tabs)/messages/chat',
        params: {
          userId: item.other_user_id,
          userName: item.other_user_name,
          relationship: item.relationship,
        },
      })}
    >
      <View style={styles.avatarContainer}>
        {item.other_user_photo ? (
          <Image source={{ uri: item.other_user_photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <ThemedText style={styles.avatarText}>
              {item.other_user_name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <ThemedText style={styles.unreadText}>{item.unread_count}</ThemedText>
          </View>
        )}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <ThemedText type="defaultSemiBold" style={styles.userName}>
            {item.other_user_name}
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {formatTime(item.last_message_time)}
          </ThemedText>
        </View>
        <ThemedText style={styles.relationship}>{item.relationship}</ThemedText>
        {item.last_message && (
          <ThemedText style={styles.lastMessage} numberOfLines={1}>
            {item.last_message}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading conversations...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Messages</ThemedText>
      
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>No conversations yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Connect with family members to start messaging
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    padding: 16,
    paddingBottom: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: '#8B0000',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#8B0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  relationship: {
    fontSize: 12,
    color: '#8B0000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 84,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
