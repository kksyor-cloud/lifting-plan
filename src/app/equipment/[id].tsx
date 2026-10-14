import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, KV, Section, T } from '@/components/ui';
import { boomText, CatalogChart, findEntry, makerLabel, tonLabel } from '@/lib/catalog';
import { findCrane } from '@/lib/cranes';
import { DEFAULT_INPUT } from '@/lib/calc';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space } from '@/theme';

export default function EquipmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = findEntry(String(id));
  const crane = e ? findCrane(e.id) : undefined;
  const { reset } = useReview();
  if (!e) return <T style={{ padding: space.lg }}>장비를 찾을 수 없습니다.</T>;

  const specs: [string, string | undefined][] = [
    ['최대 정격하중', e.maxCap],
    ['주 붐', boomText(e.boom)],
    ['지브', e.jib],
    ['최대 높이', e.hookHeight],
    ['최대 작업반경', e.maxRadius],
    ['아웃리거', e.outrigger],
    ['주행 치수 (L×W×H)', e.size],
    ['중량', e.weight],
    ['훅 블록', e.hookBlock],
    ['축 수', e.axles != null ? `${e.axles}축` : undefined],
    ['엔진', e.engine],
  ];
  const filled = specs.filter(([, v]) => v);
  const links: [string, string | undefined][] = [
    ['제조사 제품 페이지', e.sourceUrl],
    ['공식 제원표 PDF', e.sourceDoc !== e.sourceUrl ? e.sourceDoc : undefined],
    ['하중표 원본 PDF', e.chartDoc !== e.sourceDoc && e.chartDoc !== e.sourceUrl ? e.chartDoc : undefined],
  ];

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: e.model }} />
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="label" tone="#5A4500">
            {makerLabel(e.maker)} · {e.type}
            {e.current ? '' : ' · 단종'}
          </T>
          <T variant="title" style={{ fontSize: 24, lineHeight: 30 }}>
            {e.model}
          </T>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
            <Badge label={e.confidence === '공식' ? '공식 자료' : '2차 자료'} kind={e.confidence === '공식' ? 'outline' : 'grey'} />
            {e.chart ? <Badge label="하중표 있음" kind="green" /> : null}
          </View>
        </View>
        <T variant="display" style={{ fontSize: 44, lineHeight: 48 }}>
          {tonLabel(e.classTon)}
        </T>
      </View>

      <Section label="기본 제원">
        {filled.length ? (
          <Card style={{ gap: 0 }}>
            {specs.map(([k, v]) => (
              <KV key={k} k={k} v={v ?? '미확인'} />
            ))}
          </Card>
        ) : (
          <Card>
            <T variant="caption">단종 기종이라 공식 제원을 찾지 못했습니다. 모델명 기준 톤수만 확인된 상태입니다.</T>
          </Card>
        )}
        {e.note ? <T variant="caption">{e.note}</T> : null}
      </Section>

      {e.chart ? (
        <Section label="주 붐 하중표 (아웃리거 최대 · 360° · t)">
          <ChartTable chart={e.chart} />
          <T variant="caption">공식 PDF에서 뽑은 주요 반경 발췌본입니다. 주황 ? 표시 행은 칸 정렬이 불확실해 원본 대조가 필요합니다.</T>
        </Section>
      ) : (
        <Card>
          <T variant="caption">하중표가 아직 등록되지 않아 검토 계산에는 쓸 수 없습니다. 아래 공식 제원표에서 확인하세요.</T>
        </Card>
      )}

      <Section label="출처">
        <Card style={{ gap: space.sm }}>
          <T variant="caption">{e.source ?? '출처 없음'}</T>
          {links
            .filter((l): l is [string, string] => !!l[1])
            .map(([label, url]) => (
              <Pressable key={label} accessibilityRole="link" onPress={() => Linking.openURL(url)} style={styles.link}>
                <T style={{ fontFamily: font.medium, color: color.yellowDeep }}>{label} 열기 ↗</T>
              </Pressable>
            ))}
        </Card>
      </Section>

      {crane ? (
        <Button
          label="이 장비로 새 검토"
          onPress={() => {
            reset(DEFAULT_INPUT, crane.id);
            router.push('/review/input');
          }}
        />
      ) : null}
    </ScrollView>
  );
}

function ChartTable({ chart }: { chart: CatalogChart }) {
  const max = Math.max(...chart.rows.flatMap((r) => r.t.filter((x): x is number => x != null)));
  return (
    <ScrollView horizontal style={styles.chart}>
      <View>
        <View style={styles.tr}>
          <T style={[styles.th, styles.first]}>반경＼붐</T>
          {chart.boomLengths.map((b) => (
            <T key={b} style={styles.th}>
              {b}m
            </T>
          ))}
        </View>
        {chart.rows.map((r) => (
          <View key={r.radius} style={styles.tr}>
            <T style={[styles.td, styles.first, r.verify && { color: color.warn }]}>
              {r.radius}m{r.verify ? ' ?' : ''}
            </T>
            {r.t.map((v, i) => (
              <T key={i} style={[styles.td, v != null && { backgroundColor: `rgba(255,194,26,${(0.12 + 0.75 * (v / max)).toFixed(2)})` }, r.verify && styles.verify]}>
                {v ?? '·'}
              </T>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  head: { backgroundColor: color.yellow, borderRadius: radius.md, padding: space.lg, flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  link: { paddingVertical: 6 },
  chart: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.md },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: color.line },
  th: { width: 58, paddingVertical: 6, textAlign: 'right', paddingRight: 8, fontFamily: font.mono, fontSize: 11, color: color.muted },
  td: { width: 58, paddingVertical: 5, textAlign: 'right', paddingRight: 8, fontFamily: font.mono, fontSize: 12.5, color: color.charcoal },
  first: { width: 70, textAlign: 'left', paddingLeft: 8 },
  verify: { borderLeftWidth: 0, opacity: 0.75 },
});
