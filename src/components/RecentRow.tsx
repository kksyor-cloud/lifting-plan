import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, T, VerdictBadge } from '@/components/ui';
import { review } from '@/lib/calc';
import { findCrane } from '@/lib/cranes';
import { SavedReview } from '@/lib/history';
import { useReview } from '@/lib/review-context';
import { font } from '@/theme';

export function RecentRow({ item, onLongPress }: { item: SavedReview; onLongPress?: () => void }) {
  const { reset } = useReview();
  const ev = review(item.input).evals.find((e) => e.crane.id === item.craneId);
  const crane = findCrane(item.craneId);
  return (
    <Pressable
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={() => {
        reset(item.input, item.craneId);
        router.push('/review/result');
      }}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T style={{ fontFamily: font.bold }}>{item.input.siteName || '이름 없는 현장'}</T>
          <T variant="caption">
            {crane?.name ?? item.craneId} · 건물 {item.input.buildingHeight}m · {item.input.loadWeight}t · {item.savedAt.slice(0, 10)}
          </T>
        </View>
        {ev ? <VerdictBadge verdict={ev.verdict} /> : null}
      </Card>
    </Pressable>
  );
}
