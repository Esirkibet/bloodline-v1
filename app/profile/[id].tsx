import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mockNodes } from '@/data/mockFamily';
import { mockGraph } from '@/data/mockGraph';
import { calculateRelationship } from '@/utils/relationshipCalculator';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = (params.id ?? '').toString();
  const youId = 'me';
  const node = mockNodes.find((n) => n.id === id);

  const rel = useMemo(() => {
    if (!id || id === youId) return null;
    return calculateRelationship(mockGraph, youId, id);
  }, [id]);

  const [tab, setTab] = useState<'about' | 'family' | 'photos'>('about');

  if (!node) {
    return (
      <ThemedView style={styles.container}> 
        <ThemedText type="title">Profile</ThemedText>
        <ThemedText>Unknown user.</ThemedText>
      </ThemedView>
    );
  }

  const family = computeImmediateFamily(id);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <ThemedText type="title">{node.name}</ThemedText>
            {rel ? (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{rel.label}</ThemedText>
              </View>
            ) : (
              <View style={styles.badge}><ThemedText style={styles.badgeText}>You</ThemedText></View>
            )}
          </View>
        </View>

        <View style={styles.tabsRow}>
          <TabButton title="About" active={tab === 'about'} onPress={() => setTab('about')} />
          <TabButton title="Family" active={tab === 'family'} onPress={() => setTab('family')} />
          <TabButton title="Photos" active={tab === 'photos'} onPress={() => setTab('photos')} />
        </View>

        {tab === 'about' && (
          <View style={styles.card}>
            <ThemedText type="subtitle">About</ThemedText>
            <ThemedText>Bio: Not provided</ThemedText>
            <ThemedText>Location: Not provided</ThemedText>
            <ThemedText>Occupation: Not provided</ThemedText>
          </View>
        )}

        {tab === 'family' && (
          <View style={styles.card}>
            <ThemedText type="subtitle">Immediate Family</ThemedText>
            <Group
              title="Parents"
              items={family.parents}
              onOpen={(pid) => router.push({ pathname: '/profile/[id]', params: { id: pid } })}
            />
            <Group
              title="Siblings"
              items={family.siblings}
              onOpen={(pid) => router.push({ pathname: '/profile/[id]', params: { id: pid } })}
            />
            <Group
              title="Spouse"
              items={family.spouse}
              onOpen={(pid) => router.push({ pathname: '/profile/[id]', params: { id: pid } })}
            />
            <Group
              title="Children"
              items={family.children}
              onOpen={(pid) => router.push({ pathname: '/profile/[id]', params: { id: pid } })}
            />
            <View style={{ height: 8 }} />
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push({ pathname: '/tree', params: { centerId: id } })}
            >
              <ThemedText style={styles.primaryBtnText}>View {node.name}'s Tree</ThemedText>
            </Pressable>
          </View>
        )}

        {tab === 'photos' && (
          <View style={styles.card}>
            <ThemedText type="subtitle">Photos</ThemedText>
            <ThemedText>Google Drive integration coming soon.</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function Group({ title, items, onOpen }: { title: string; items: { id: string; name: string }[]; onOpen: (id: string) => void }) {
  if (items.length === 0) return (
    <View style={{ marginTop: 8 }}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      <ThemedText style={{ color: '#666' }}>None</ThemedText>
    </View>
  );
  return (
    <View style={{ marginTop: 8, gap: 6 }}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      {items.map((it) => (
        <Pressable key={it.id} onPress={() => onOpen(it.id)} style={styles.row}>
          <View style={styles.smallAvatar} />
          <ThemedText>{it.name}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function TabButton({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <ThemedText style={[styles.tabText, active && styles.tabTextActive]}>{title}</ThemedText>
    </Pressable>
  );
}

function computeImmediateFamily(id: string) {
  const nameOf = (pid: string) => mockNodes.find((n) => n.id === pid)?.name || pid;
  const parents = new Set<string>();
  const children = new Set<string>();
  const siblings = new Set<string>();
  const spouse = new Set<string>();

  for (const e of mockGraph.edges) {
    if (e.kind === 'parent_child') {
      if (e.child === id) parents.add(e.parent);
      if (e.parent === id) children.add(e.child);
    } else if (e.kind === 'sibling') {
      if (e.a === id) siblings.add(e.b);
      if (e.b === id) siblings.add(e.a);
    } else if (e.kind === 'spouse') {
      if (e.a === id) spouse.add(e.b);
      if (e.b === id) spouse.add(e.a);
    }
  }

  const toList = (s: Set<string>) => Array.from(s).map((pid) => ({ id: pid, name: nameOf(pid) }));
  return {
    parents: toList(parents),
    siblings: toList(siblings),
    spouse: toList(spouse),
    children: toList(children),
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 72, backgroundColor: '#F5F5DC' },
  smallAvatar: { width: 36, height: 36, borderRadius: 36, backgroundColor: '#F5F5DC', marginRight: 8 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#8B0000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 4 },
  badgeText: { color: '#fff' },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#8B0000' },
  tabActive: { backgroundColor: '#8B0000' },
  tabText: { color: '#8B0000' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 12, marginTop: 8 },
  primaryBtn: { backgroundColor: '#8B0000', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
});
