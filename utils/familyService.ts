import { supabase } from '@/utils/supabaseClient';
import type { Profile } from '@/utils/useAuth';

export interface Relationship {
  id: string;
  user_a: string;
  user_b: string;
  relationship_type: string;
  relationship_from_a_to_b: string;
  relationship_from_b_to_a: string;
  is_verified: boolean;
  verified_by_a: boolean;
  verified_by_b: boolean;
  created_by: string;
  created_at: string;
  profile_a?: Profile;
  profile_b?: Profile;
}

export interface Invitation {
  id: string;
  inviter_id: string;
  invitee_name: string;
  invitee_phone: string;
  relationship_to_inviter: string;
  invitation_code: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sent_at: string;
  responded_at?: string;
  expires_at: string;
  invitee_profile_id?: string;
  inviter?: Profile;
}

export interface FamilyMember {
  id: string;
  profile: Profile;
  relationship: string;
  relationshipType: string;
  isVerified: boolean;
  tier: 'SUPERIOR' | 'INTERMEDIATE' | 'DISTANT';
}

// Generate a unique 6-character invitation code
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Add a family member and send invitation
export async function addFamilyMember(
  inviterId: string,
  memberData: {
    full_name: string;
    phone?: string;
    date_of_birth?: string;
    is_deceased: boolean;
    date_of_death?: string;
    relationship: string;
    profile_photo_url?: string;
  }
) {
  try {
    if (memberData.is_deceased) {
      // Create profile for deceased member directly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          phone: memberData.phone || `deceased_${Date.now()}`,
          full_name: memberData.full_name,
          date_of_birth: memberData.date_of_birth,
          is_deceased: true,
          date_of_death: memberData.date_of_death,
          profile_photo_url: memberData.profile_photo_url,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create verified relationship
      const { error: relError } = await createRelationship(
        inviterId,
        profile.id,
        memberData.relationship,
        true
      );

      if (relError) throw relError;

      return { profile, invitation: null };
    } else {
      // Create invitation for living member
      if (!memberData.phone) throw new Error('Phone number required for living members');

      const inviteCode = generateInviteCode();
      
      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert({
          inviter_id: inviterId,
          invitee_name: memberData.full_name,
          invitee_phone: memberData.phone,
          relationship_to_inviter: memberData.relationship,
          invitation_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Send SMS invitation (would integrate with Twilio/Africa's Talking)
      // For now, we'll just return the invitation
      
      return { profile: null, invitation };
    }
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
}

// Create or update a relationship between two users
export async function createRelationship(
  userAId: string,
  userBId: string,
  relationshipType: string,
  isVerified: boolean = false
) {
  // Ensure consistent ordering
  const [user_a, user_b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
  
  // Determine bidirectional relationship labels
  const relationships = getRelationshipPair(relationshipType);
  const [rel_a_to_b, rel_b_to_a] = userAId < userBId 
    ? [relationships.forward, relationships.reverse]
    : [relationships.reverse, relationships.forward];

  const { error } = await supabase
    .from('relationships')
    .upsert({
      user_a,
      user_b,
      relationship_type: relationshipType,
      relationship_from_a_to_b: rel_a_to_b,
      relationship_from_b_to_a: rel_b_to_a,
      is_verified: isVerified,
      verified_by_a: userAId === user_a,
      verified_by_b: userAId === user_b,
      created_by: userAId,
    });

  return { error };
}

// Get the bidirectional relationship labels
function getRelationshipPair(relationship: string): { forward: string; reverse: string } {
  const pairs: Record<string, { forward: string; reverse: string }> = {
    'father': { forward: 'father', reverse: 'child' },
    'mother': { forward: 'mother', reverse: 'child' },
    'son': { forward: 'son', reverse: 'parent' },
    'daughter': { forward: 'daughter', reverse: 'parent' },
    'brother': { forward: 'brother', reverse: 'sibling' },
    'sister': { forward: 'sister', reverse: 'sibling' },
    'husband': { forward: 'husband', reverse: 'wife' },
    'wife': { forward: 'wife', reverse: 'husband' },
    'grandfather': { forward: 'grandfather', reverse: 'grandchild' },
    'grandmother': { forward: 'grandmother', reverse: 'grandchild' },
    'uncle': { forward: 'uncle', reverse: 'nephew/niece' },
    'aunt': { forward: 'aunt', reverse: 'nephew/niece' },
    'cousin': { forward: 'cousin', reverse: 'cousin' },
  };

  return pairs[relationship.toLowerCase()] || { forward: relationship, reverse: 'relative' };
}

// Get all family members for a user
export async function getFamilyMembers(userId: string): Promise<FamilyMember[]> {
  try {
    const { data: relationships, error } = await supabase
      .from('relationships')
      .select(`
        *,
        profile_a:profiles!relationships_user_a_fkey(*),
        profile_b:profiles!relationships_user_b_fkey(*)
      `)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('is_verified', true);

    if (error) throw error;

    const members: FamilyMember[] = [];
    
    for (const rel of relationships || []) {
      const isUserA = rel.user_a === userId;
      const otherProfile = isUserA ? rel.profile_b : rel.profile_a;
      const relationship = isUserA ? rel.relationship_from_a_to_b : rel.relationship_from_b_to_a;
      
      if (otherProfile) {
        members.push({
          id: otherProfile.id,
          profile: otherProfile,
          relationship,
          relationshipType: rel.relationship_type,
          isVerified: rel.is_verified,
          tier: calculateTier(relationship),
        });
      }
    }

    return members;
  } catch (error) {
    console.error('Error fetching family members:', error);
    return [];
  }
}

// Calculate family tier based on relationship
function calculateTier(relationship: string): 'SUPERIOR' | 'INTERMEDIATE' | 'DISTANT' {
  const superior = ['parent', 'father', 'mother', 'child', 'son', 'daughter', 'sibling', 'brother', 'sister', 'spouse', 'husband', 'wife', 'grandparent', 'grandfather', 'grandmother', 'grandchild'];
  const intermediate = ['uncle', 'aunt', 'nephew', 'niece', 'cousin'];
  
  const rel = relationship.toLowerCase();
  if (superior.some(s => rel.includes(s))) return 'SUPERIOR';
  if (intermediate.some(i => rel.includes(i))) return 'INTERMEDIATE';
  return 'DISTANT';
}

// Get pending invitations
export async function getPendingInvitations(userId: string): Promise<Invitation[]> {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        inviter:profiles!invitations_inviter_id_fkey(*)
      `)
      .eq('inviter_id', userId)
      .eq('status', 'pending')
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
}

// Accept an invitation
export async function acceptInvitation(invitationCode: string, userId: string) {
  try {
    // Get the invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_code', invitationCode)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
        invitee_profile_id: userId,
      })
      .eq('id', invitation.id);

    if (updateError) throw updateError;

    // Create the relationship
    await createRelationship(
      invitation.inviter_id,
      userId,
      invitation.relationship_to_inviter,
      true
    );

    return { success: true };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

// Reject an invitation
export async function rejectInvitation(invitationCode: string) {
  try {
    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString(),
      })
      .eq('invitation_code', invitationCode)
      .eq('status', 'pending');

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    throw error;
  }
}

// Subscribe to real-time family updates
export function subscribeFamilyUpdates(userId: string, callback: () => void) {
  const subscription = supabase
    .channel('family-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'relationships',
        filter: `user_a=eq.${userId},user_b=eq.${userId}`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invitations',
        filter: `inviter_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
