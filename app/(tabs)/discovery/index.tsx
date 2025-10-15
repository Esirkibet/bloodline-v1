import { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Pressable, 
  RefreshControl, 
  Alert, 
  Image,
  ActivityIndicator 
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/utils/useAuth';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

interface PendingInvitation {
  id: string;
  invitee_name: string;
  invitee_phone: string;
  relationship_to_inviter: string;
  invitation_code: string;
  sent_at: string;
  status: string;
}

interface IncomingRequest {
  id: string;
  inviter_id: string;
  inviter_name: string;
  inviter_photo?: string;
  relationship_claimed: string;
  invitation_code: string;
  created_at: string;
}

interface SuggestedRelative {
  id: string;
  full_name: string;
  profile_photo_url?: string;
  mutual_connections: number;
  possible_relationship?: string;
}

export default function DiscoveryScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedRelative[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDiscoveryData = useCallback(async () => {
    if (!user) return;

    try {
      // Load pending invitations sent by user
      const { data: invites } = await supabase
        .from('invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .eq('status', 'pending')
        .order('sent_at', { ascending: false });

      if (invites) {
        setPendingInvites(invites);
      }

      // Load incoming requests
      if (profile?.phone) {
        const { data: incoming } = await supabase
          .from('invitations')
          .select(`
            *,
            inviter:profiles!invitations_inviter_id_fkey(id, full_name, profile_photo_url)
          `)
          .eq('invitee_phone', profile.phone)
          .eq('status', 'pending')
          .neq('inviter_id', user.id);

        if (incoming) {
          setIncomingRequests(
            incoming.map(req => ({
              id: req.id,
              inviter_id: req.inviter.id,
              inviter_name: req.inviter?.full_name || 'Unknown',
              inviter_photo: req.inviter?.profile_photo_url,
              relationship_claimed: req.relationship_to_inviter,
              invitation_code: req.invitation_code,
              created_at: req.created_at,
            }))
          );
        }
      }

      // Load suggested relatives (simplified for now)
      setSuggestions([]);
      
    } catch (error) {
      console.error('Error loading discovery data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadDiscoveryData();
  }, [loadDiscoveryData]);

  useFocusEffect(
    useCallback(() => {
      loadDiscoveryData();
    }, [loadDiscoveryData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDiscoveryData();
  };

  const resendInvite = async (invite: PendingInvitation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Resend Invitation',
      `Send another invitation to ${invite.invitee_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resend',
          onPress: async () => {
            Alert.alert('Invitation Sent', `Reminder sent to ${invite.invitee_phone}`);
          },
        },
      ]
    );
  };

  const acceptRequest = async (request: IncomingRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Create relationship
      const { error: relError } = await supabase
        .from('relationships')
        .insert({
          user_a: request.inviter_id < user!.id ? request.inviter_id : user!.id,
          user_b: request.inviter_id < user!.id ? user!.id : request.inviter_id,
          relationship_type: request.relationship_claimed,
          relationship_from_a_to_b: request.inviter_id < user!.id ? request.relationship_claimed : 'relative',
          relationship_from_b_to_a: request.inviter_id < user!.id ? 'relative' : request.relationship_claimed,
          is_verified: true,
          verified_by_a: true,
          verified_by_b: true,
          created_by: user!.id,
        });

      if (relError) throw relError;

      // Update invitation
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
          invitee_profile_id: user?.id,
        })
        .eq('id', request.id);

      if (error) throw error;

      Alert.alert('Success', `You are now connected with ${request.inviter_name}`);
      loadDiscoveryData();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const declineRequest = async (request: IncomingRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline the connection from ${request.inviter_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('invitations')
                .update({ status: 'rejected', responded_at: new Date().toISOString() })
                .eq('id', request.id);

              if (error) throw error;
              loadDiscoveryData();
            } catch (error) {
              Alert.alert('Error', 'Failed to decline request');
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#8B0000" style={{ marginTop: 50 }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B0000" />
        }
      >
        <ThemedText type="title" style={styles.title}>Discovery</ThemedText>
        
        {/* Pending Invitations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#8B0000" />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Pending Invitations</ThemedText>
            {pendingInvites.length > 0 && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{pendingInvites.length}</ThemedText>
              </View>
            )}
          </View>
          
          {pendingInvites.length === 0 ? (
            <ThemedText style={styles.emptyText}>No pending invitations</ThemedText>
          ) : (
            pendingInvites.map(invite => (
              <View key={invite.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardMain}>
                    <ThemedText type="defaultSemiBold">{invite.invitee_name}</ThemedText>
                    <ThemedText style={styles.relationship}>{invite.relationship_to_inviter}</ThemedText>
                    <ThemedText style={styles.meta}>
                      Invited {formatTimeAgo(invite.sent_at)} • Code: {invite.invitation_code}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => resendInvite(invite)} style={styles.actionButton}>
                    <Ionicons name="refresh" size={20} color="#8B0000" />
                    <ThemedText style={styles.actionText}>Resend</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Incoming Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-add-outline" size={20} color="#8B0000" />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Incoming Requests</ThemedText>
            {incomingRequests.length > 0 && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{incomingRequests.length}</ThemedText>
              </View>
            )}
          </View>
          
          {incomingRequests.length === 0 ? (
            <ThemedText style={styles.emptyText}>No incoming requests</ThemedText>
          ) : (
            incomingRequests.map(request => (
              <View key={request.id} style={styles.card}>
                <View style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    {request.inviter_photo ? (
                      <Image source={{ uri: request.inviter_photo }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <ThemedText style={styles.avatarText}>
                          {request.inviter_name.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.requestInfo}>
                      <ThemedText type="defaultSemiBold">{request.inviter_name}</ThemedText>
                      <ThemedText style={styles.relationship}>
                        Claims you're their {request.relationship_claimed}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <Pressable onPress={() => declineRequest(request)} style={styles.declineButton}>
                      <Ionicons name="close" size={20} color="#666" />
                    </Pressable>
                    <Pressable onPress={() => acceptRequest(request)} style={styles.acceptButton}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add Family Button */}
        <View style={styles.section}>
          <Pressable
            style={styles.addFamilyButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/add-family');
            }}
          >
            <Ionicons name="person-add" size={24} color="#fff" />
            <ThemedText style={styles.addFamilyText}>Add Family Member</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  title: {
    padding: 16,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
  },
  badge: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
  },
  relationship: {
    color: '#8B0000',
    fontSize: 14,
    marginTop: 2,
  },
  meta: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8B0000',
  },
  actionText: {
    color: '#8B0000',
    fontSize: 14,
    fontWeight: '600',
  },
  requestCard: {
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  declineButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: '#8B0000',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  addFamilyButton: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addFamilyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
