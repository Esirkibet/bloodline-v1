import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { SentInvite } from '../utils/inviteStore';
import { enqueueRelationshipByCode, getSentInviteByCode } from '../utils/inviteStore';

export default function InviteAcceptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = (params.code ?? '').toString();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<SentInvite | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!code) return;
        const found = await getSentInviteByCode(code);
        if (mounted) setInvite(found);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [code]);

  async function onAccept() {
    if (!code) return;
    await enqueueRelationshipByCode(code);
    Alert.alert('Invitation accepted', 'We will connect you as soon as sync is available.');
    router.replace('/');
  }

  function onDecline() {
    router.back();
  }

  if (!code) {
    return (
      <ThemedView style={styles.container}> 
        <ThemedText type="title">Invalid Invite</ThemedText>
        <ThemedText>No code was provided in the link.</ThemedText>
        <View style={styles.row}>
          <PrimaryButton title="Go Home" onPress={() => router.replace('/')} />
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.containerCenter}>
        <ActivityIndicator />
        <ThemedText style={{ marginTop: 8 }}>Loading invite…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}> 
      <ThemedText type="title">Join Your Family</ThemedText>
      <View style={styles.card}>
        <Row label="Code" value={code} />
        {invite?.fullName ? <Row label="From" value={invite.fullName} /> : null}
        {invite?.relationship ? <Row label="Relationship" value={invite.relationship} /> : null}
      </View>
      <View style={styles.row}>
        <SecondaryButton title="Decline" onPress={onDecline} />
        <PrimaryButton title="Accept" onPress={onAccept} />
      </View>
      {!invite && (
        <ThemedText style={{ marginTop: 12 }}>
          We couldn't find details for this code on this device, but you can still accept.
        </ThemedText>
      )}
    </ThemedView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryBtn}>
      <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>{title}</ThemedText>
    </Pressable>
  );
}

function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryBtn}>
      <ThemedText type="defaultSemiBold" style={styles.secondaryBtnText}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  containerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  card: { gap: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginTop: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', flex: 1 },
  primaryBtnText: { color: '#fff' },
  secondaryBtn: { backgroundColor: '#F5F5DC', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', flex: 1 },
  secondaryBtnText: { color: '#8B0000' },
});
