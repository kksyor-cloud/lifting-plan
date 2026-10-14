import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Diagram } from '@/components/Diagram';
import { Button, Card, Footer, KV, Section, StepBar, T, VerdictBadge, fmt } from '@/components/ui';
import { CraneEval, FAIL_LABEL } from '@/lib/calc';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space } from '@/theme';

export default function SelectScreen() {
  const { input, result, craneId, setCraneId } = useReview();
  const selected = result.evals.find((e) => e.crane.id === craneId) ?? result.evals[0];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.body}>
        <StepBar step={1} />

        <Card style={{ padding: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T style={{ fontFamily: font.bold }}>{selected.crane.name}</T>
            <VerdictBadge verdict={selected.verdict} size="lg" />
          </View>
          <Diagram input={input} ev={selected} />
          <KV k="하중률 (훅블록·줄걸이 포함)" v={selected.feasible ? `${fmt.pct(selected.ratio)} · ${fmt.t(selected.totalLoad)} / ${fmt.t(selected.capacity)}` : '—'} />
          {selected.reason ? <T tone={color.no}>{FAIL_LABEL[selected.reason]}</T> : null}
        </Card>

        <Section label={`후보 장비 ${result.evals.length}대 비교`}>
          {result.evals.map((e) => (
            <CandidateRow key={e.crane.id} ev={e} active={e.crane.id === selected.crane.id} recommended={e.crane.id === result.recommendedId} onPress={() => setCraneId(e.crane.id)} />
          ))}
          {result.recommendedId === null ? <T tone={color.no}>조건을 만족하는 장비가 없습니다. 이격거리나 도달거리를 줄여 보세요.</T> : null}
        </Section>
      </ScrollView>
      <Footer>
        <Button label="검토 결과 보기" onPress={() => router.push('/review/result')} />
      </Footer>
    </View>
  );
}

function CandidateRow({ ev, active, recommended, onPress }: { ev: CraneEval; active: boolean; recommended: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.row, active && styles.rowActive]}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <T style={{ fontFamily: font.bold }}>{ev.crane.name}</T>
          {recommended ? (
            <View style={styles.tag}>
              <T variant="caption" tone={color.charcoal} style={{ fontFamily: font.bold }}>
                추천
              </T>
            </View>
          ) : null}
        </View>
        <T variant="caption">
          {ev.feasible ? `붐 ${fmt.m(ev.boomLength)} · ${fmt.deg(ev.boomAngle)} · 정격 ${fmt.t(ev.capacity)}` : ev.reason ? FAIL_LABEL[ev.reason] : ''}
        </T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <VerdictBadge verdict={ev.verdict} />
        <T variant="mono">{ev.feasible ? fmt.pct(ev.ratio) : '—'}</T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: space.xl, paddingBottom: 120 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.md },
  rowActive: { borderColor: color.charcoal, borderLeftWidth: 6, borderLeftColor: color.yellow },
  tag: { backgroundColor: color.yellow, paddingHorizontal: 8, borderRadius: 4 },
});
