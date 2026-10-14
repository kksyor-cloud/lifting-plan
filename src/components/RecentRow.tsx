import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { T, VerdictBadge } from '@/components/ui';
import { reachOf, review } from '@/lib/calc';
import { findCrane } from '@/lib/cranes';
import { SavedReview } from '@/lib/history';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space } from '@/theme';

// One calculation-history row: number · site-name tag · crane · condition summary
export function RecentRow({ item, index, onLongPress }: { item: SavedReview; index?: number; onLongPress?: () => void }) {
  const { reset } = useReview();
  const ev = review(item.input).evals.find((e) => e.crane.id === item.craneId);
  const crane = findCrane(item.craneId);
  const i = item.input;
  return (
    <Pressable
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={() => {
        reset(item.input, item.craneId);
        router.push('/review/result');
      }}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      {index != null ? (
        <View style={styles.num}>
          <Text style={{ fontFamily: font.bold, fontSize: 20, color: color.charcoal }}>{index + 1}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 4, paddingVertical: space.md, paddingLeft: index != null ? 0 : space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <View style={styles.tag}>
            <Text style={{ fontFamily: font.bold, fontSize: 13, color: color.charcoal }}>{i.siteName || '이름 없는 현장'}</Text>
          </View>
          {ev ? <VerdictBadge verdict={ev.verdict} /> : null}
        </View>
        <T style={{ fontFamily: font.bold, fontSize: 16 }}>{crane?.name ?? item.craneId}</T>
        <T variant="caption">
          건물높이 {i.buildingHeight}m, 중량물 {i.loadWeight}t, 도달거리 {reachOf(i).toFixed(1)}m · {item.savedAt.slice(0, 10)}
        </T>
      </View>
      <Text style={{ fontSize: 22, color: color.charcoal, paddingHorizontal: space.md }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.surface, borderRadius: radius.md, borderWidth: 1, borderColor: color.line, overflow: 'hidden' },
  num: { width: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: color.paper },
  tag: { backgroundColor: color.yellow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
});
