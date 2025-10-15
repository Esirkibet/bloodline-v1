import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mockGraph } from '@/data/mockGraph';
import { calculateRelationship } from '@/utils/relationshipCalculator';

export default function RelationshipDebugScreen() {
  const you = 'me';
  const others = mockGraph.nodes.filter((n) => n !== you);
  const [selected, setSelected] = useState<string | null>(null);
  const result = selected ? calculateRelationship(mockGraph, you, selected) : null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ marginBottom: 8 }}>Relationship Debug</ThemedText>
      <ThemedText>Select a target to compute your relationship.</ThemedText>
      <FlatList
        data={others}
        keyExtractor={(id) => id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)} style={[styles.chip, selected === item && styles.chipActive]}>
            <ThemedText style={[styles.chipText, selected === item && styles.chipTextActive]}>{item}</ThemedText>
          </Pressable>
        )}
      />

      {result ? (
        <ScrollView contentContainerStyle={{ gap: 8 }}>
          <Row label="Target" value={selected!} />
          <Row label="Label" value={result.label} />
          <Row label="Kind" value={result.kind} />
          <Row label="Tier" value={result.tier} />
          <Row label="Steps Away" value={String(result.stepsAway)} />
          <Row label="In-Law" value={result.inLaw ? 'Yes' : 'No'} />
          {typeof result.degree === 'number' ? <Row label="Degree" value={String(result.degree)} /> : null}
          {typeof result.removed === 'number' ? <Row label="Removed" value={String(result.removed)} /> : null}
          <ThemedText type="subtitle" style={{ marginTop: 8 }}>Path</ThemedText>
          <ThemedText>
            {result.path.nodes.join(' → ')}
          </ThemedText>
          <ThemedText>
            {result.path.edges.join(' → ')}
          </ThemedText>
        </ScrollView>
      ) : (
        <ThemedText style={{ marginTop: 16 }}>Pick a person above.</ThemedText>
      )}
    </ThemedView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#8B0000' },
  chipActive: { backgroundColor: '#8B0000' },
  chipText: { color: '#8B0000' },
  chipTextActive: { color: '#fff' },
});
