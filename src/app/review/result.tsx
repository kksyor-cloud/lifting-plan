import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Diagram } from '@/components/Diagram';
import { Button, Card, Footer, KV, Section, StepBar, T, VerdictBadge, fmt } from '@/components/ui';
import { DEFAULT_INPUT, FAIL_LABEL, HOOK_ALLOWANCE, MIN_WALL_CLEARANCE, ROOF_MARGIN, WARN_RATIO } from '@/lib/calc';
import { saveReview } from '@/lib/history';
import { useReview } from '@/lib/review-context';
import { color, font, space } from '@/theme';

export default function ResultScreen() {
  const { input, result, craneId, reset } = useReview();
  const ev = result.evals.find((e) => e.crane.id === craneId) ?? result.evals[0];
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  const save = async () => {
    await saveReview(input, ev.crane.id);
    setSaved(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.body}>
        <StepBar step={2} />

        <View style={styles.header}>
          <T variant="label" tone="#5A4500">
            검토서 · {today}
          </T>
          <T variant="title">{input.siteName || '이름 없는 현장'}</T>
        </View>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{ev.crane.name}</T>
            <VerdictBadge verdict={ev.verdict} size="lg" />
          </View>
          {ev.reason ? <T tone={color.no}>{FAIL_LABEL[ev.reason]}</T> : null}
          <Diagram input={input} ev={ev} />
        </Card>

        <Section label="검토 값">
          <Card style={{ gap: 0 }}>
            <KV k="건물 높이" v={fmt.m(input.buildingHeight)} />
            <KV k="작업반경 (이격 + 도달)" v={`${fmt.m(result.radius)}`} />
            <KV k="  건물 이격거리" v={fmt.m(input.setback)} />
            <KV k="  도달거리" v={fmt.m(input.reach)} />
            <KV k="붐 길이 / 각도" v={ev.boomAngle > 0 ? `${fmt.m(ev.boomLength)} / ${fmt.deg(ev.boomAngle)}` : '—'} />
            <KV k="붐 끝(Tip) 높이" v={ev.boomAngle > 0 ? fmt.m(ev.tipHeight) : '—'} />
            <KV k="필요 Tip 높이" v={fmt.m(result.requiredTipHeight)} />
            <KV k="상부 여유 (Tip − 건물)" v={ev.boomAngle > 0 ? fmt.m(ev.topClearance) : '—'} />
            <KV k="외벽 여유 (모서리 ~ 붐)" v={ev.boomAngle > 0 ? fmt.m(ev.wallClearance) : '—'} />
          </Card>
        </Section>

        <Section label="하중">
          <Card style={{ gap: 0 }}>
            <KV k="자재 중량" v={fmt.t(input.loadWeight)} />
            <KV k="줄걸이 용구" v={fmt.t(input.riggingWeight)} />
            <KV k="훅 블록" v={fmt.t(ev.crane.hookBlockWeight)} />
            <KV k="합계" v={fmt.t(ev.totalLoad)} strong />
            <KV k={`정격하중 (붐 ${ev.chartBoomLength || '—'}m, 반경 ${ev.chartRadius || '—'}m 칸)`} v={ev.feasible ? fmt.t(ev.capacity) : '—'} />
            <KV k="하중률" v={ev.feasible ? fmt.pct(ev.ratio) : '—'} strong />
          </Card>
        </Section>

        {result.sling ? (
          <Section label="줄걸이 (2가닥 기준)">
            <Card style={{ gap: 0 }}>
              <KV k="각도 (수평 기준)" v={`${input.slingAngle}°`} />
              <KV k="1가닥 길이" v={fmt.m(result.sling.legLength)} />
              <KV k="줄걸이 높이" v={fmt.m(result.sling.height)} />
              <KV k="1가닥 장력" v={fmt.t(result.sling.tension)} strong />
            </Card>
          </Section>
        ) : null}

        <Section label="장비 기본 제원">
          <Card style={{ gap: 0 }}>
            <KV k="등급" v={`${ev.crane.classTon} t`} />
            <KV k="붐 길이" v={`${ev.crane.boomMin} ~ ${ev.crane.boomMax} m`} />
            <KV k="아웃리거 폭" v={fmt.m(ev.crane.outriggerSpan)} />
            <KV k="자체 중량" v={`${ev.crane.selfWeight} t`} />
          </Card>
        </Section>

        <View style={styles.source}>
          <T variant="caption">하중표: {ev.crane.source}</T>
          <T variant="caption">
            판정 기준: 하중률 {Math.round(WARN_RATIO * 100)}% 이하 가능, 100% 이하 주의, 초과 불가. 하중표는 같거나 긴 붐, 같거나 먼 반경 칸을 적용(보수적).
          </T>
          <T variant="caption">
            높이 가정: 건물 위 여유 {ROOF_MARGIN}m + 자재·줄걸이 높이 + 훅 블록·권상 여유 {HOOK_ALLOWANCE}m. 외벽 최소 여유 {MIN_WALL_CLEARANCE}m.
          </T>
          <T variant="caption" tone={color.charcoal} style={{ marginTop: space.sm }}>
            이 결과는 사전 검토용입니다. 작업 전에 제조사 공인 하중표, 지반 지지력, 풍속, 신호수 배치를 반드시 확인하세요.
          </T>
        </View>
      </ScrollView>
      <Footer>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="이전으로" kind="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button label={saved ? '저장됨' : '검토 저장'} disabled={saved} onPress={save} style={{ flex: 2 }} />
        </View>
        <Button
          label="새 검토"
          kind="yellow"
          onPress={() => {
            reset(DEFAULT_INPUT);
            router.dismissTo('/review/input');
          }}
        />
      </Footer>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: space.xl, paddingBottom: 190 },
  header: { backgroundColor: color.yellow, borderRadius: 10, padding: space.lg, gap: 2 },
  source: { borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: color.warm, paddingTop: space.md, gap: 4 },
});
