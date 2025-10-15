import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getProfile, saveProfile, type Profile } from '@/utils/profileStore';

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<Profile>({ fullName: '' });
  const [loading, setLoading] = useState(true);
  const canSave = (profile.fullName ?? '').trim().length > 0;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = await getProfile();
      if (mounted) {
        setProfile(p);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSave() {
    if (!canSave) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }
    await saveProfile(profile);
    Alert.alert('Saved', 'Your profile was updated.');
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Edit Profile</ThemedText>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        <Field label="Full Name">
          <TextInput
            value={profile.fullName}
            onChangeText={(t) => setProfile({ ...profile, fullName: t })}
            placeholder="e.g. John Mwangi"
            placeholderTextColor="#999"
            style={styles.input}
            autoCapitalize="words"
          />
        </Field>
        <Field label="Birth Date (YYYY-MM-DD)">
          <TextInput
            value={profile.birthDate || ''}
            onChangeText={(t) => setProfile({ ...profile, birthDate: t })}
            placeholder="e.g. 1985-07-12"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </Field>
        <Row>
          <ThemedText>Deceased</ThemedText>
          <Switch
            value={!!profile.isDeceased}
            onValueChange={(v) => setProfile({ ...profile, isDeceased: v })}
          />
        </Row>
        {profile.isDeceased ? (
          <Field label="Death Date (YYYY-MM-DD)">
            <TextInput
              value={profile.deathDate || ''}
              onChangeText={(t) => setProfile({ ...profile, deathDate: t })}
              placeholder="e.g. 2018-03-02"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </Field>
        ) : null}
        <Field label="Location">
          <TextInput
            value={profile.location || ''}
            onChangeText={(t) => setProfile({ ...profile, location: t })}
            placeholder="e.g. Nairobi, Kenya"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </Field>
        <Field label="Occupation">
          <TextInput
            value={profile.occupation || ''}
            onChangeText={(t) => setProfile({ ...profile, occupation: t })}
            placeholder="e.g. Teacher"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </Field>
        <Pressable disabled={!canSave} onPress={onSave} style={[styles.primaryBtn, !canSave && { opacity: 0.6 }]}>
          <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>Save</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <ThemedText>{label}</ThemedText>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff' },
});
