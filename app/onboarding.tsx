import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { setOnboardingSeen } from '../utils/onboardingStorage';

const slides = [
  {
    title: 'Build Your Tree',
    text: "Add parents, siblings, children. We'll calculate the rest.",
  },
  {
    title: 'Invite Your Family',
    text: 'Share via WhatsApp or SMS. Deep links connect automatically.',
  },
  {
    title: 'Discover Relatives',
    text: 'See your entire family web: close, extended, and distant.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  function skip() {
    setOnboardingSeen().finally(() => router.replace('/'));
  }

  function next() {
    if (index < slides.length - 1) setIndex(index + 1);
    else skip();
  }

  const s = slides[index];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={skip}>
          <ThemedText type="defaultSemiBold" style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <View style={styles.center}>
        <ThemedText type="title" style={styles.title}>{s.title}</ThemedText>
        <ThemedText style={styles.text}>{s.text}</ThemedText>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index ? styles.dotActive : undefined]} />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title={index < slides.length - 1 ? 'Next' : 'Get Started'} onPress={next} />
      </View>
    </ThemedView>
  );
}

function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryBtn}>
      <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>{title}</ThemedText>
    </Pressable>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  skipText: { color: '#8B0000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  title: { textAlign: 'center', marginBottom: 8 },
  text: { textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#ddd' },
  dotActive: { backgroundColor: '#8B0000' },
  footer: { paddingBottom: 16 },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff' },
});
