import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  phone: string;
  full_name: string;
  profile_photo_url?: string;
  date_of_birth?: string;
  is_deceased: boolean;
  date_of_death?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  visibility: 'public' | 'family' | 'private';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        // Check for mock session first
        const mockProfile = await AsyncStorage.getItem('@bloodline_current_profile');
        const mockUserId = await AsyncStorage.getItem('@bloodline_mock_user_id');
        
        if (mockProfile && mockUserId) {
          // Use mock data for testing
          const profile = JSON.parse(mockProfile);
          if (mounted) {
            setUser({ id: mockUserId } as User);
            setProfile({
              id: mockUserId,
              phone: profile.phone,
              full_name: profile.full_name,
              is_deceased: false,
              visibility: 'family',
            } as Profile);
            setSession({} as Session);
            setLoading(false);
          }
          return;
        }
        
        // Fall back to real Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (mounted && profile) {
            setProfile(profile);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (mounted && profile) {
          setProfile(profile);
        }
      } else {
        setProfile(null);
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Clear mock data
    await AsyncStorage.multiRemove([
      '@bloodline_current_profile',
      '@bloodline_mock_user_id',
      '@bloodline_mock_phone',
      '@bloodline_mock_otp',
    ]);
    // Try to sign out from Supabase too
    await supabase.auth.signOut().catch(() => {});
  };

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}
