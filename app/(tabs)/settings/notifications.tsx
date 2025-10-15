import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getNotificationPrefs, saveNotificationPrefs, type NotificationPrefs } from '@/utils/profileStore';

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = await getNotificationPrefs();
      if (mounted) setPrefs(p);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSave() {
    if (!prefs) return;
    await saveNotificationPrefs(prefs);
    Alert.alert('Saved', 'Notification preferences updated.');
  }

  if (!prefs) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Notifications</ThemedText>
      <View style={styles.card}>
        <Row title="New family member joins" value={prefs.newFamily} onChange={(v) => setPrefs({ ...prefs, newFamily: v })} />
        <Row title="Connection requests" value={prefs.connectionRequests} onChange={(v) => setPrefs({ ...prefs, connectionRequests: v })} />
        <Row title="Messages" value={prefs.messages} onChange={(v) => setPrefs({ ...prefs, messages: v })} />
        <Row title="Birthdays" value={prefs.birthdays} onChange={(v) => setPrefs({ ...prefs, birthdays: v })} />
        <Row title="Family milestones" value={prefs.milestones} onChange={(v) => setPrefs({ ...prefs, milestones: v })} />
      </View>
      <Pressable onPress={onSave} style={styles.primaryBtn}>
        <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>Save</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function Row({ title, value, onChange }: { title: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <ThemedText>{title}</ThemedText>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 12 },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#fff' },
});
