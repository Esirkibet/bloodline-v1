import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'expo-router';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export default function AccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const sub = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    });
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setEmail(data.session?.user?.email ?? null);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign out failed', error.message);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Account</ThemedText>
      {loading ? (
        <ThemedText>Loading…</ThemedText>
      ) : email ? (
        <View style={styles.card}>
          <ThemedText type="subtitle">Signed in</ThemedText>
          <ThemedText>Email: {email}</ThemedText>
          <Pressable onPress={signOut} style={styles.primaryBtn}>
            <ThemedText style={styles.primaryBtnText}>Sign Out</ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <ThemedText>You are not signed in.</ThemedText>
          <Pressable onPress={() => router.push('/sign-in')} style={styles.primaryBtn}>
            <ThemedText style={styles.primaryBtnText}>Go to Sign In</ThemedText>
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 12, marginTop: 8, gap: 8 },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff' },
});
