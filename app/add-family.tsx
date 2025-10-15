import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import RelationshipPicker from '@/components/RelationshipPicker';
import { generateInvitationCode, buildInviteLink } from '@/utils/invitationGenerator';
import { shareInvitation } from '../utils/shareInvitation';
import { saveSentInvite } from '../utils/inviteStore';

export default function AddFamilyScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [deathDate, setDeathDate] = useState('');
  const [relationship, setRelationship] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canProceedStep1 = useMemo(() => fullName.trim().length > 1, [fullName]);
  const canProceedStep2 = useMemo(() => {
    if (!relationship) return false;
    if (!isDeceased) return inviteeEmail.trim().length > 5 && inviteeEmail.includes('@');
    return true;
  }, [relationship, inviteeEmail, isDeceased]);

  function nextFromStep1() {
    if (!canProceedStep1) {
      Alert.alert('Incomplete', 'Enter a valid full name.');
      return;
    }
    setStep(2);
  }

  function nextFromStep2() {
    if (!canProceedStep2) {
      Alert.alert('Incomplete', isDeceased ? 'Select a relationship.' : 'Enter a valid email and select a relationship.');
      return;
    }
    const code = generateInvitationCode(6);
    const link = buildInviteLink(code);
    setInviteCode(code);
    setInviteLink(link);
    // Persist locally so accept screen can show some context until backend exists
    saveSentInvite({
      code,
      fullName,
      relationship,
      inviteeEmail: isDeceased ? undefined : inviteeEmail,
      createdAt: new Date().toISOString(),
    }).catch(() => {});
    setStep(3);
  }

  async function onShareInvite() {
    if (!inviteCode || !inviteLink) return;
    setBusy(true);
    try {
      const body = `Join me on Bloodline to connect our family.\n\nName: ${fullName}\nRelationship: ${relationship}\nInvitation Code: ${inviteCode}\n\nOpen this link on your phone: ${inviteLink}`;
      await shareInvitation({
        message: body,
        url: inviteLink,
        subject: 'Bloodline Family Invitation',
      });
    } finally {
      setBusy(false);
    }
  }

  function resetAndExit() {
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title">Add Family Member</ThemedText>
        <View style={styles.stepsRow}>
          <StepPill label="1" active={step === 1} />
          <StepPill label="2" active={step === 2} />
          <StepPill label="3" active={step === 3} />
        </View>

        {step === 1 && (
          <View style={styles.card}>
            <ThemedText type="subtitle">Basic Information</ThemedText>
            <View style={styles.field}>
              <ThemedText>Full Name</ThemedText>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. John Mwangi"
                placeholderTextColor="#999"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <ThemedText>Birth Date (YYYY-MM-DD)</ThemedText>
                <TextInput
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="e.g. 1985-07-12"
                  placeholderTextColor="#999"
                  style={styles.input}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                />
              </View>
            </View>
            <View style={styles.switchRow}>
              <ThemedText>Living</ThemedText>
              <Switch value={!isDeceased} onValueChange={(v) => setIsDeceased(!v)} />
            </View>
            {isDeceased && (
              <View style={styles.field}>
                <ThemedText>Death Date (YYYY-MM-DD)</ThemedText>
                <TextInput
                  value={deathDate}
                  onChangeText={setDeathDate}
                  placeholder="e.g. 2018-03-02"
                  placeholderTextColor="#999"
                  style={styles.input}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                />
              </View>
            )}
            <View style={styles.actionsRow}>
              <SecondaryButton title="Cancel" onPress={resetAndExit} />
              <PrimaryButton title="Next" onPress={nextFromStep1} disabled={!canProceedStep1} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <ThemedText type="subtitle">Relationship</ThemedText>
            <RelationshipPicker value={relationship} onChange={setRelationship} />
            {!isDeceased && (
              <View style={styles.field}>
                <ThemedText>Invitee Email</ThemedText>
                <TextInput
                  value={inviteeEmail}
                  onChangeText={setInviteeEmail}
                  placeholder="e.g. john@example.com"
                  placeholderTextColor="#999"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
            <View style={styles.actionsRow}>
              <SecondaryButton title="Back" onPress={() => setStep(1)} />
              <PrimaryButton title="Generate Invite" onPress={nextFromStep2} disabled={!canProceedStep2} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <ThemedText type="subtitle">Invitation</ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText type="defaultSemiBold">Name</ThemedText>
              <ThemedText>{fullName}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="defaultSemiBold">Relationship</ThemedText>
              <ThemedText>{relationship || 'Not set'}</ThemedText>
            </View>
            {inviteCode && (
              <View style={styles.summaryRow}>
                <ThemedText type="defaultSemiBold">Code</ThemedText>
                <ThemedText>{inviteCode}</ThemedText>
              </View>
            )}
            {inviteLink && (
              <View style={styles.linkBox}>
                <ThemedText>{inviteLink}</ThemedText>
              </View>
            )}
            <View style={styles.actionsRow}>
              <SecondaryButton title="Back" onPress={() => setStep(2)} />
              <PrimaryButton title={busy ? 'Sharing…' : 'Share Invite'} onPress={onShareInvite} disabled={busy || !inviteLink} />
            </View>
            <View style={styles.actionsRow}>
              <PrimaryButton title="Done" onPress={resetAndExit} />
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function StepPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.pill, active ? styles.pillActive : undefined]}>
      <ThemedText type="defaultSemiBold" style={{ color: active ? '#fff' : '#8B0000' }}>{label}</ThemedText>
    </View>
  );
}

function PrimaryButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!!disabled} style={[styles.primaryBtn, disabled ? styles.btnDisabled : undefined]}>
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
  scroll: { paddingBottom: 32, gap: 16 },
  stepsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#8B0000' },
  pillActive: { backgroundColor: '#8B0000' },
  card: { gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  field: { gap: 6 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  linkBox: { padding: 12, borderRadius: 8, backgroundColor: '#F5F5DC' },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', flex: 1 },
  primaryBtnText: { color: '#fff' },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: { backgroundColor: '#F5F5DC', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', flex: 1 },
  secondaryBtnText: { color: '#8B0000' },
});
