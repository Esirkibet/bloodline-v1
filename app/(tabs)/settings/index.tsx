import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function RowLink({ title, href, subtitle }: { title: string; href: Href; subtitle?: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.row}>
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold">{title}</ThemedText>
          {subtitle ? <ThemedText>{subtitle}</ThemedText> : null}
        </View>
        <ThemedText>{'>'}</ThemedText>
      </Pressable>
    </Link>
  );
}

export default function SettingsIndex() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <View style={styles.card}>
        <RowLink title="Account" href={{ pathname: '/(tabs)/settings/account' }} />
        <RowLink title="Edit Profile" href={{ pathname: '/(tabs)/settings/edit-profile' }} />
        <RowLink title="Privacy" href={{ pathname: '/(tabs)/settings/privacy' }} />
        <RowLink title="Notifications" href={{ pathname: '/(tabs)/settings/notifications' }} />
      </View>
      <View style={styles.card}>
        <RowLink title="About" href="/modal" subtitle="Version, Terms & Privacy" />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center', gap: 8 },
});
