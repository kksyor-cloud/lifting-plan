import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { RecentRow } from '@/components/RecentRow';
import { Card, T } from '@/components/ui';
import { clearReviews, deleteReview, loadReviews, SavedReview } from '@/lib/history';
import { color, font, space } from '@/theme';

export default function HistoryScreen() {
  const [list, setList] = useState<SavedReview[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const refresh = useCallback(() => {
    loadReviews().then(setList);
  }, []);
  useFocusEffect(refresh);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: space.sm }}>
      <Stack.Screen
        options={{
          headerRight: () =>
            list.length ? (
              <Pressable accessibilityRole="button" accessibilityLabel="전체 삭제" hitSlop={10} onPress={() => setConfirmAll(true)} style={{ paddingHorizontal: space.md }}>
                <T style={{ fontFamily: font.bold }} tone={color.no}>
                  전체 삭제
                </T>
              </Pressable>
            ) : null,
        }}
      />
      {confirmAll ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T>기록 {list.length}건을 모두 지울까요?</T>
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <Pressable accessibilityRole="button" onPress={() => setConfirmAll(false)}>
              <T style={{ fontFamily: font.medium }}>취소</T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                await clearReviews();
                setConfirmAll(false);
                refresh();
              }}
            >
              <T style={{ fontFamily: font.bold }} tone={color.no}>
                모두 삭제
              </T>
            </Pressable>
          </View>
        </Card>
      ) : null}
      {list.length === 0 ? (
        <Card>
          <T variant="caption">저장한 검토가 없습니다.</T>
        </Card>
      ) : (
        <T variant="caption">누르면 다시 열고, 길게 누르면 삭제할 수 있습니다.</T>
      )}
      {list.map((item, i) => (
        <View key={item.id} style={{ gap: 4 }}>
          <RecentRow item={item} index={i} onLongPress={() => setPendingDelete(item.id)} />
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
