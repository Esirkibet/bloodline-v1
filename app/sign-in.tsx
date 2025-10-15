import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabaseClient';
import { HAS_SUPABASE } from '@/utils/env';

const LAST_EMAIL_KEY = '@bloodline_last_signin_email';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendMagicLink() {
    if (!HAS_SUPABASE) {
      Alert.alert('Missing configuration', 'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your env.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email.');
      return;
    }
    setBusy(true);
    try {
      await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'bloodline://auth-callback',
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      Alert.alert('Check your email', 'We sent you a magic link. Open it on this device.');
    } catch (e: any) {
      Alert.alert('Sign-in failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Sign In</ThemedText>
      <View style={{ gap: 8, marginTop: 12 }}>
        <ThemedText>Email</ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <Pressable onPress={sendMagicLink} disabled={busy} style={[styles.primaryBtn, busy && { opacity: 0.6 }] }>
          <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send Magic Link'}</ThemedText>
        </Pressable>
      </View>
      {!HAS_SUPABASE && (
        <View style={styles.card}>
          <ThemedText type="subtitle">Setup required</ThemedText>
          <ThemedText>Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your app config or .env.* files, then reload.</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 12, marginTop: 16 },
});
