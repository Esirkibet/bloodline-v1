import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import FamilyTree from '@/components/FamilyTree';
import { mockLinks, mockNodes } from '@/data/mockFamily';

export default function TreeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ centerId?: string }>();
  const centerId = (params.centerId ?? 'me').toString();
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ padding: 12 }}>Family Tree</ThemedText>
      <View style={{ flex: 1 }}>
        <FamilyTree
          nodes={mockNodes}
          links={mockLinks}
          centerId={centerId}
          onNodePress={(id) =>
            router.push({ pathname: '/profile/[id]', params: { id } })
          }
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
