import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Props = {
  value?: string;
  onChange: (v: string) => void;
};

const BASE_OPTIONS = [
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Spouse',
  'Grandfather (Paternal)',
  'Grandfather (Maternal)',
  'Grandmother (Paternal)',
  'Grandmother (Maternal)',
  "Uncle (Father's Brother)",
  "Uncle (Mother's Brother)",
  "Aunt (Father's Sister)",
  "Aunt (Mother's Sister)",
  'Cousin',
  'Other',
];

export default function RelationshipPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const options = useMemo(() => {
    if (!query) return BASE_OPTIONS;
    return BASE_OPTIONS.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <View style={styles.wrapper}>
      <ThemedText>Relationship</ThemedText>
      <Pressable onPress={() => setOpen(true)} style={styles.selector}>
        <ThemedText>{value || 'Select relationship'}</ThemedText>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText type="subtitle">Select Relationship</ThemedText>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search..."
              placeholderTextColor="#999"
              style={styles.search}
            />
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <ThemedText>{item}</ThemedText>
                </Pressable>
              )}
            />
            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  selector: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', padding: 16, justifyContent: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '80%' },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginVertical: 8 },
  option: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  closeBtn: { backgroundColor: '#8B0000', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 12 },
});
