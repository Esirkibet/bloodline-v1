import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Pressable, 
  StyleSheet, 
  TextInput, 
  View,
  Image 
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/utils/useAuth';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ 
    userId: string; 
    userName: string; 
    relationship: string;
  }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!user || !params.userId) return;

    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
        
        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', params.userId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user, params.userId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user || !params.userId) return;

    const subscription = supabase
      .channel(`chat-${params.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id}))`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          
          // Mark as read if we received it
          if (payload.new.sender_id === params.userId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, params.userId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: params.userId,
          message_text: messageText,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(messageText); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          <ThemedText style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.message_text}
          </ThemedText>
          <ThemedText style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formatTime(item.created_at)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">{params.userName}</ThemedText>
        <ThemedText style={styles.relationship}>{params.relationship}</ThemedText>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            <ThemedText style={styles.sendButtonText}>Send</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  relationship: {
    fontSize: 12,
    color: '#8B0000',
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageRowOwn: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleOther: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageBubbleOwn: {
    backgroundColor: '#8B0000',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  messageTimeOwn: {
    color: '#ffcccc',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#8B0000',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
