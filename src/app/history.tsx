import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { RecentRow } from '@/components/RecentRow';
import { Card, T } from '@/components/ui';
import { deleteReview, loadReviews, SavedReview } from '@/lib/history';
import { color, font, space } from '@/theme';

export default function HistoryScreen() {
  const [list, setList] = useState<SavedReview[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const refresh = useCallback(() => {
    loadReviews().then(setList);
  }, []);
  useFocusEffect(refresh);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: space.sm }}>
      {list.length === 0 ? (
        <Card>
          <T variant="caption">저장한 검토가 없습니다.</T>
        </Card>
      ) : (
        <T variant="caption">누르면 다시 열고, 길게 누르면 삭제할 수 있습니다.</T>
      )}
      {list.map((item) => (
        <View key={item.id} style={{ gap: 4 }}>
          <RecentRow item={item} onLongPress={() => setPendingDelete(item.id)} />
          {pendingDelete === item.id ? (
            <View style={{ flexDirection: 'row', gap: space.md, justifyContent: 'flex-end' }}>
              <Pressable accessibilityRole="button" onPress={() => setPendingDelete(null)}>
                <T style={{ fontFamily: font.medium }}>취소</T>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  await deleteReview(item.id);
                  setPendingDelete(null);
                  refresh();
                }}
              >
                <T style={{ fontFamily: font.bold }} tone={color.no}>
                  삭제
                </T>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
