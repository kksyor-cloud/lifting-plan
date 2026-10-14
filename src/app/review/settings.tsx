import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Diagram } from '@/components/Diagram';
import { Badge, Button, Card, Chip, Footer, NumberField, SliderField, StepBar, T, VerdictBadge, fmt } from '@/components/ui';
import { CraneEval, FAIL_LABEL, MAX_SETBACK, maxChartRadius, minSetback, sortCranes } from '@/lib/calc';
import { CRANES } from '@/lib/cranes';
import { BEARING_PRESETS, PAD_PRESETS } from '@/lib/ground';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space, verdictColor } from '@/theme';

const ORDER = sortCranes(CRANES).map((c) => c.id);

export default function SettingsScreen() {
  const { input, setInput, result, craneId, setCraneId, locks, toggleLock, step, auto } = useReview();
  const ev = result.evals.find((e) => e.crane.id === craneId) ?? result.evals[0];
  const crane = ev.crane;
  const [note, setNote] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [compare, setCompare] = useState(false);

  // 이 화면에 들어온 순간의 추천 장비로 고정한다. 이후 장비는 UP/DN 이나 비교 목록으로만 바뀐다.
  useEffect(() => {
    if (craneId) setCraneId(craneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const idx = ORDER.indexOf(crane.id);
  const minS = minSetback(crane);
  const maxR = Math.max(maxChartRadius(crane), input.radius);

  const onStep = (dir: 1 | -1) => {
    setNote(step(dir) ? null : dir === 1 ? '등록된 장비 중 가장 큰 장비입니다.' : '등록된 장비 중 가장 작은 장비입니다.');
  };
  const onAuto = () => {
    setNote(auto() ? null : '이 장비로는 가능한 위치가 없습니다. UP 으로 큰 장비를 골라 보세요.');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.body}>
        <StepBar step={1} />

        <View style={styles.grid}>
          <View style={{ flex: 1.6, gap: space.sm }}>
            <TypeBtn label="이동식 크레인" active />
            <TypeBtn label="이동타워 크레인" sub="하중표 준비 중" />
          </View>
          <View style={{ flex: 1, gap: space.sm }}>
            <StepBtn label="▲ UP" sub="큰 장비" tone={color.ok} disabled={idx === ORDER.length - 1} onPress={() => onStep(1)} />
            <StepBtn label="▼ DN" sub="작은 장비" tone={color.no} disabled={idx === 0} onPress={() => onStep(-1)} />
          </View>
        </View>
        <Button label="✦  최대거리 자동계산" onPress={onAuto} />
        {note ? <T tone={color.no}>{note}</T> : null}

        <Card style={{ padding: space.sm, gap: 0 }}>
          <View style={styles.diagramHead}>
            <T style={{ fontFamily: font.bold }}>{crane.name}</T>
            {ev.feasible && !ev.chartVerified ? <Badge label="원본 대조" kind="outline" /> : null}
          </View>
          <Diagram input={input} ev={ev} height={300} />
          <View style={styles.overlay}>
            <Text style={{ fontFamily: font.bold, fontSize: 16, color: verdictColor[ev.verdict] }}>{verdictText(ev)}</Text>
            <OverlayLine k="자재 중량" v={ev.feasible ? `${input.loadWeight}t (제원의 ${fmt.pct(ev.ratio)} / 최대 ${ev.capacity}t)` : `${input.loadWeight}t`} />
            <OverlayLine k="작업반경" v={fmt.m(result.radius)} />
            <OverlayLine k="건물이격" v={fmt.m(input.setback)} />
            <OverlayLine k="도달거리" v={fmt.m(result.reach)} />
          </View>
        </Card>
        {ev.reason ? <T tone={color.no}>{FAIL_LABEL[ev.reason]}</T> : null}

        <SliderField
          label="건물 이격거리"
          unit="m"
          value={input.setback}
          min={minS}
          max={MAX_SETBACK}
          big={1}
          small={0.5}
          locked={locks.setback}
          onToggleLock={() => toggleLock('setback')}
          onChange={(setback) => setInput({ setback, radius: Math.max(input.radius, setback) })}
        />
        <SliderField
          label="작업반경"
          unit="m"
          value={input.radius}
          min={input.setback}
          max={maxR}
          big={1}
          small={0.5}
          locked={locks.radius}
          onToggleLock={() => toggleLock('radius')}
          onChange={(r) => setInput({ radius: r })}
        />
        <T variant="caption" style={{ marginTop: -space.md }}>
          도달거리(외벽 ~ 인양 지점) = 작업반경 − 이격거리. 자물쇠로 고정한 값은 자동계산에서 바뀌지 않습니다. 이 장비의 최소 이격 {minS}m (아웃리거 폭 기준).
        </T>

        <Fold label="추가 조건 (줄걸이 용구 · 지반)" open={more} onToggle={() => setMore(!more)}>
          <NumberField label="줄걸이 용구 중량" hint="슬링·샤클 등. 하중률에 포함" unit="t" value={input.riggingWeight} onChange={(riggingWeight) => setInput({ riggingWeight })} big={0.1} small={0.01} min={0} max={5} digits={2} />
          <T style={{ fontFamily: font.medium }}>지반 허용 지지력 (kN/m²)</T>
          <View style={styles.chips}>
            {BEARING_PRESETS.map((b) => (
              <Chip key={b.label} label={`${b.label} ${b.value}`} active={input.groundBearing === b.value} onPress={() => setInput({ groundBearing: b.value })} />
            ))}
          </View>
          <T style={{ fontFamily: font.medium }}>아웃리거 받침판</T>
          <View style={styles.chips}>
            {PAD_PRESETS.map((p) => (
              <Chip key={p} label={`${p.toFixed(1)}m 각`} active={input.padSize === p} onPress={() => setInput({ padSize: p })} />
            ))}
          </View>
        </Fold>

        <Fold label={`전체 기종 비교 (${result.evals.length}대)`} open={compare} onToggle={() => setCompare(!compare)}>
          {result.evals.map((e) => (
            <CandidateRow key={e.crane.id} ev={e} active={e.crane.id === crane.id} onPress={() => setCraneId(e.crane.id)} />
          ))}
          <T variant="caption">지금 이격거리·작업반경에서 하중표가 등록된 기종을 모두 계산한 결과입니다. 누르면 그 장비로 바뀝니다.</T>
        </Fold>
      </ScrollView>
      <Footer>
        <Button label="검토 결과 보기" kind="yellow" onPress={() => router.push('/review/result')} />
      </Footer>
    </View>
  );
}

const verdictText = (ev: CraneEval) => ({ ok: '가능', warn: '주의 (하중률 80% 초과)', no: '불가' })[ev.verdict];

function OverlayLine({ k, v }: { k: string; v: string }) {
  return (
    <Text style={{ fontFamily: font.body, fontSize: 13, lineHeight: 19, color: color.charcoal }}>
      {k}: <Text style={{ fontFamily: font.bold }}>{v}</Text>
    </Text>
  );
}

function TypeBtn({ label, sub, active }: { label: string; sub?: string; active?: boolean }) {
  return (
    <View accessibilityRole="button" accessibilityState={{ selected: !!active, disabled: !active }} style={[styles.type, active ? { backgroundColor: color.yellow } : { opacity: 0.55 }]}>
      <Text style={{ fontFamily: font.bold, fontSize: 15, color: color.charcoal }}>{label}</Text>
      {sub ? <Text style={{ fontFamily: font.body, fontSize: 10, color: color.muted }}>{sub}</Text> : null}
    </View>
  );
}

function StepBtn({ label, sub, tone, onPress, disabled }: { label: string; sub: string; tone: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${sub}`} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.type, { borderWidth: 1.5, borderColor: tone, backgroundColor: pressed ? color.yellowSoft : color.surface }, disabled && { opacity: 0.35 }]}>
      <Text style={{ fontFamily: font.bold, fontSize: 16, color: tone }}>{label}</Text>
      <Text style={{ fontFamily: font.body, fontSize: 10, color: color.muted }}>{sub}</Text>
    </Pressable>
  );
}

function Fold({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={styles.fold}>
        <T style={{ fontFamily: font.bold }}>{label}</T>
        <T tone={color.muted}>{open ? '▲' : '▼'}</T>
      </Pressable>
      {open ? <View style={{ gap: space.sm }}>{children}</View> : null}
    </View>
  );
}

function CandidateRow({ ev, active, onPress }: { ev: CraneEval; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.row, active && styles.rowActive]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T style={{ fontFamily: font.bold }}>{ev.crane.name}</T>
        <T variant="caption">{ev.feasible ? `붐 ${fmt.m(ev.boomLength)} · ${fmt.deg(ev.boomAngle)} · 정격 ${fmt.t(ev.capacity)}` : ev.reason ? FAIL_LABEL[ev.reason] : ''}</T>
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
  grid: { flexDirection: 'row', gap: space.sm },
  type: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: color.line },
  diagramHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.xs },
  overlay: { marginHorizontal: space.sm, marginBottom: space.xs, backgroundColor: color.paper, borderRadius: radius.sm, padding: space.sm, gap: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  fold: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.md, borderTopWidth: 1, borderTopColor: color.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.md },
  rowActive: { borderColor: color.charcoal, borderLeftWidth: 6, borderLeftColor: color.yellow },
});
