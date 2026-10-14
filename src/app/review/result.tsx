import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Diagram } from '@/components/Diagram';
import { Button, Card, Footer, KV, Section, StepBar, T, VerdictBadge, fmt } from '@/components/ui';
import { DEFAULT_INPUT, FAIL_LABEL, HOOK_ALLOWANCE, maxChartRadius, MIN_WALL_CLEARANCE, ROOF_MARGIN, WARN_RATIO } from '@/lib/calc';
import { exportReport } from '@/lib/export-report';
import { REACTION_SHARE } from '@/lib/ground';
import { reportHtml } from '@/lib/report';
import { saveReview } from '@/lib/history';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space } from '@/theme';

export default function ResultScreen() {
  const { input, setInput, result, craneId, reset } = useReview();
  const ev = result.evals.find((e) => e.crane.id === craneId) ?? result.evals[0];
  const c = ev.crane;
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const geo = ev.boomAngle > 0;

  const [exporting, setExporting] = useState(false);
  const exportPdf = async () => {
    setExporting(true);
    try {
      await exportReport(reportHtml(input, result, ev, today.replace(/-/g, '.')), `${input.siteName || '양중'} 검토서`);
    } finally {
      setExporting(false);
    }
  };

  const save = async () => {
    await saveReview(input, c.id);
    setSaved(true);
  };

  const specs: [string, string][] = [
    ['최대 정격 하중', c.maxCap?.split('@')[0].trim() || `${c.classTon}t`],
    ['최대 작업 반경', `${maxChartRadius(c)}m`],
    ['붐 길이', `${c.boomMin}~${c.boomMax}m`],
    ...sizeParts(c.size),
    ['아웃리거 폭', `${c.outriggerSpan}m`],
    ['자체 중량', c.selfWeight ? `${c.selfWeight}t` : '—'],
    ['훅 블록', `${c.hookBlockWeight}t`],
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.body}>
        <StepBar step={2} />

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.headTitle}>■ 리프팅 플랜 검토서</Text>
            <Text style={styles.headDate}>{today}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            {editing ? (
              <TextInput
                autoFocus
                accessibilityLabel="현장명"
                placeholder="현장명 (예: ○○ 물류센터)"
                placeholderTextColor="#9A958C"
                value={input.siteName}
                onChangeText={(siteName) => {
                  setInput({ siteName });
                  setSaved(false);
                }}
                onBlur={() => setEditing(false)}
                onSubmitEditing={() => setEditing(false)}
                style={styles.siteInput}
              />
            ) : (
              <Text style={styles.site}>{input.siteName || '현장명을 입력하세요'}</Text>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel="현장명 편집" hitSlop={10} onPress={() => setEditing(!editing)}>
              <Text style={{ color: color.yellow, fontSize: 18 }}>{editing ? '✓' : '✎'}</Text>
            </Pressable>
          </View>
        </View>

        <Card style={{ padding: space.sm, gap: 0 }}>
          <T style={{ fontFamily: font.bold, paddingHorizontal: space.sm, paddingTop: space.xs }}>{c.name}</T>
          <Diagram input={input} ev={ev} height={280} />
        </Card>

        <Card style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs }}>
            <VerdictBadge verdict={ev.verdict} size="lg" />
            {ev.feasible && !ev.chartVerified ? <T variant="caption" tone={color.warn}>하중표 칸 원본 대조 필요</T> : null}
          </View>
          {ev.reason ? <T tone={color.no}>{FAIL_LABEL[ev.reason]}</T> : null}
          <Line k="건물 높이" v={fmt.m(input.buildingHeight)} />
          <Line k="자재 중량" v={ev.feasible ? `${input.loadWeight}t (최대대비 ${fmt.pct(ev.ratio)} / 최대 ${ev.capacity}t)` : `${input.loadWeight}t`} />
          <Line k="작업반경" v={fmt.m(result.radius)} />
          <Line k="건물 이격" v={fmt.m(input.setback)} />
          <Line k="도달거리" v={fmt.m(result.reach)} />
          <Line k="하중표 조건" v={c.rating ?? '아웃리거 최대'} />
          <Line k="붐 길이" v={geo ? fmt.m(ev.boomLength) : '—'} />
          <Line k="붐 각도" v={geo ? fmt.deg(ev.boomAngle) : '—'} />
          <Line k="Tip 높이" v={geo ? fmt.m(ev.tipHeight) : '—'} />
          <Line k="외벽 여유" v={geo ? fmt.m(ev.wallClearance) : '—'} />
          <Line k="상부 여유" v={geo ? fmt.m(ev.topClearance) : '—'} />
        </Card>

        <View style={{ gap: space.sm }}>
          <T style={{ fontFamily: font.bold, fontSize: 16 }}>[ {c.name} ] 기본제원</T>
          <View style={styles.specGrid}>
            {specs.map(([k, v]) => (
              <View key={k} style={styles.spec}>
                <T variant="caption">{k}</T>
                <T style={{ fontFamily: font.bold }}>{v}</T>
              </View>
            ))}
          </View>
        </View>

        <Section label="하중 상세">
          <Card style={{ gap: 0 }}>
            <KV k="자재 중량" v={fmt.t(input.loadWeight)} />
            <KV k="줄걸이 용구" v={fmt.t(input.riggingWeight)} />
            <KV k="훅 블록" v={fmt.t(c.hookBlockWeight)} />
            <KV k="합계" v={fmt.t(ev.totalLoad)} strong />
            <KV k={`정격하중 (붐 ${ev.chartBoomLength || '—'}m, 반경 ${ev.chartRadius || '—'}m 칸)`} v={ev.feasible ? fmt.t(ev.capacity) : '—'} />
            <KV k="하중률 (합계 ÷ 정격)" v={ev.feasible ? fmt.pct(ev.ratio) : '—'} strong />
          </Card>
        </Section>

        {result.sling ? (
          <Section label="줄걸이 (2가닥, 긴 변 기준)">
            <Card style={{ gap: 0 }}>
              <KV k="각도 (수평 기준)" v={`${input.slingAngle}°`} />
              <KV k="1가닥 길이" v={fmt.m(result.sling.legLength)} />
              <KV k="줄걸이 높이" v={fmt.m(result.sling.height)} />
              <KV k="1가닥 장력" v={fmt.t(result.sling.tension)} strong />
            </Card>
          </Section>
        ) : null}

        {ev.ground ? (
          <Section label="아웃리거 반력·지반 (간이)" right={<VerdictBadge verdict={ev.ground.verdict} />}>
            <Card style={{ gap: 0 }}>
              <KV k="추정 최대 반력" v={`${fmt.t(ev.ground.reaction)} (${ev.ground.reactionKN.toFixed(0)} kN)`} />
              <KV k="받침판" v={`${input.padSize} × ${input.padSize} m`} />
              <KV k="접지압 / 허용 지지력" v={`${ev.ground.pressure.toFixed(0)} / ${ev.ground.bearing} kN/m²`} strong />
              <KV k="필요 받침판 (최소)" v={`${ev.ground.requiredPad.toFixed(2)} m 각`} />
            </Card>
            <T variant="caption">최대 반력 = {REACTION_SHARE * 100}% × (장비 중량 + 인양 하중) 간이 추정. 지지력·받침판은 장비 설정의 추가 조건에서 바꿀 수 있습니다.</T>
          </Section>
        ) : null}

        <View style={styles.source}>
          <T variant="caption">하중표: {c.source}</T>
          {c.chartDoc ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(c.chartDoc!)}>
              <T variant="caption" tone={color.yellowDeep} style={{ fontFamily: font.medium }}>
                하중표 원본 PDF 열기 ↗
              </T>
            </Pressable>
          ) : null}
          <T variant="caption">
            판정: 하중률 {Math.round(WARN_RATIO * 100)}% 이하 가능, 100% 이하 주의, 초과 불가. 높이: 건물 위 {ROOF_MARGIN}m + 자재·줄걸이 높이 + 훅·권상 여유 {HOOK_ALLOWANCE}m, 외벽 최소 여유 {MIN_WALL_CLEARANCE}m. 가정값: {c.assumed.join(', ')}.
          </T>
        </View>

        <View style={styles.warn}>
          <T style={{ fontFamily: font.bold }} tone={color.no}>
            ⚠ 주의사항
          </T>
          <T variant="caption" tone="#8E1F1F">
            이 검토 결과는 입력값을 바탕으로 한 참고용 계산값입니다. 실제 작업 전 반드시 다음을 확인하세요.{'\n'}• 해당 크레인 제조사의 공인 하중표(Load Chart){'\n'}• 안전율 적용 및 작업계획서 작성{'\n'}• 자격을 갖춘 신호수와 작업지휘자 배치{'\n'}• 지반 조건, 풍속, 주변 장애물 등 현장 조건 별도 검토
          </T>
        </View>
      </ScrollView>
      <Footer>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label={exporting ? 'PDF 만드는 중' : 'PDF 내보내기'} kind="secondary" disabled={exporting} onPress={exportPdf} style={{ flex: 1 }} />
          <Button label={saved ? '저장됨' : '검토 저장'} disabled={saved} onPress={save} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="← 이전으로" kind="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button
            label="↻ 새로 검토"
            kind="yellow"
            onPress={() => {
              reset(DEFAULT_INPUT);
              router.dismissTo('/review/input');
            }}
            style={{ flex: 1 }}
          />
        </View>
      </Footer>
    </View>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <T style={{ width: 84, textAlign: 'right', color: color.muted }}>{k}:</T>
      <T style={{ flex: 1, fontFamily: font.medium }}>{v}</T>
    </View>
  );
}

/** "11.53 × 2.62 × 3.475 m" → overall length·width·height */
function sizeParts(size?: string): [string, string][] {
  const n = size?.match(/\d+(?:\.\d+)?/g);
  if (!n || n.length < 3) return [];
  return [
    ['장비 전장', `${n[0]}m`],
    ['장비 전폭', `${n[1]}m`],
    ['장비 전고', `${n[2]}m`],
  ];
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: space.xl, paddingBottom: 200 },
  header: { backgroundColor: color.charcoal, borderRadius: radius.sm, padding: space.lg, gap: space.sm },
  headTitle: { fontFamily: font.bold, fontSize: 18, color: '#FFFFFF' },
  headDate: { fontFamily: font.mono, fontSize: 14, color: '#D8D3C8' },
  site: { flex: 1, fontFamily: font.medium, fontSize: 16, color: '#FFFFFF' },
  siteInput: { flex: 1, fontFamily: font.medium, fontSize: 16, color: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: color.yellow, paddingVertical: 2 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  spec: { flexBasis: '31%', flexGrow: 1, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, padding: space.md, gap: 2 },
  source: { borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: color.warm, paddingTop: space.md, gap: 4 },
  warn: { backgroundColor: '#FDECEC', borderRadius: radius.sm, padding: space.md, gap: 4 },
});
