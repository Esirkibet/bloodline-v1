import { useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/utils/supabaseClient';

function parseTokensFromUrl(url: string | null) {
  if (!url) return { code: null, access_token: null, refresh_token: null };
  // Prefer hash params (Supabase sends tokens in fragment for magic links)
  const u = url.toString();
  const hashIndex = u.indexOf('#');
  const paramsStr = hashIndex >= 0 ? u.slice(hashIndex + 1) : u.split('?')[1] ?? '';
  const qp = new URLSearchParams(paramsStr);
  const code = qp.get('code');
  const access_token = qp.get('access_token');
  const refresh_token = qp.get('refresh_token');
  return { code, access_token, refresh_token };
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialUrlParam = useMemo(() => params?.url ?? null, [params]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const initialUrl = initialUrlParam || (await Linking.getInitialURL()) || null;
        const { code, access_token, refresh_token } = parseTokensFromUrl(initialUrl);

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else {
          throw new Error('No auth parameters found.');
        }

        if (mounted) router.replace('/');
      } catch (e: any) {
        if (mounted) {
          setError(e?.message ?? 'Authentication failed.');
        }
      } finally {
        if (mounted) setBusy(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialUrlParam]);

  if (busy) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
        <ThemedText style={{ marginTop: 8 }}>Signing you in…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.center}>
      <ThemedText type="title">Auth Callback</ThemedText>
      {error ? <ThemedText style={{ marginTop: 8 }}>{error}</ThemedText> : null}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Pressable style={styles.btn} onPress={() => router.replace('/') }>
          <ThemedText style={styles.btnText}>Go Home</ThemedText>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => router.replace('/sign-in') }>
          <ThemedText style={styles.btnText}>Sign In</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  btn: { backgroundColor: '#8B0000', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnText: { color: '#fff' },
});
