import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getPrivacy, savePrivacy, type Privacy } from '@/utils/profileStore';

export default function PrivacyScreen() {
  const [privacy, setPrivacy] = useState<Privacy | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = await getPrivacy();
      if (mounted) setPrivacy(p);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSave() {
    if (!privacy) return;
    await savePrivacy(privacy);
    Alert.alert('Saved', 'Your privacy settings were updated.');
  }

  if (!privacy) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Privacy</ThemedText>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        <Section title="Profile Visibility">
          <ChoiceRow
            title="Everyone in family tree"
            selected={privacy.profileVisibility === 'everyone'}
            onPress={() => setPrivacy({ ...privacy, profileVisibility: 'everyone' })}
          />
          <ChoiceRow
            title="Only verified connections"
            selected={privacy.profileVisibility === 'verified'}
            onPress={() => setPrivacy({ ...privacy, profileVisibility: 'verified' })}
          />
          <ChoiceRow
            title="Only superior family"
            selected={privacy.profileVisibility === 'superior'}
            onPress={() => setPrivacy({ ...privacy, profileVisibility: 'superior' })}
          />
        </Section>

        <Section title="Who can message me">
          <ChoiceRow
            title="All verified family"
            selected={privacy.messagePermission === 'all'}
            onPress={() => setPrivacy({ ...privacy, messagePermission: 'all' })}
          />
          <ChoiceRow
            title="Only superior family"
            selected={privacy.messagePermission === 'superior'}
            onPress={() => setPrivacy({ ...privacy, messagePermission: 'superior' })}
          />
          <ChoiceRow
            title="Nobody"
            selected={privacy.messagePermission === 'none'}
            onPress={() => setPrivacy({ ...privacy, messagePermission: 'none' })}
          />
        </Section>

        <Row>
          <ThemedText>Show birth date</ThemedText>
          <Switch
            value={privacy.showBirthDate}
            onValueChange={(v) => setPrivacy({ ...privacy, showBirthDate: v })}
          />
        </Row>
        <Row>
          <ThemedText>Show location</ThemedText>
          <Switch
            value={privacy.showLocation}
            onValueChange={(v) => setPrivacy({ ...privacy, showLocation: v })}
          />
        </Row>

        <Pressable onPress={onSave} style={styles.primaryBtn}>
          <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>Save</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <ThemedText type="subtitle" style={{ marginBottom: 8 }}>{title}</ThemedText>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function ChoiceRow({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, styles.choiceRow]}>
      <ThemedText>{title}</ThemedText>
      <View style={[styles.choiceDot, selected && styles.choiceDotSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 12 },
  choiceRow: { paddingVertical: 12 },
  choiceDot: { width: 18, height: 18, borderRadius: 18, borderWidth: 2, borderColor: '#8B0000' },
  choiceDotSelected: { backgroundColor: '#8B0000' },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff' },
})
