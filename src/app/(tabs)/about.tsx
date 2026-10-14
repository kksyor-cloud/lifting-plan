import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CraneMark } from '@/components/CraneMark';
import { T } from '@/components/ui';
import { CATALOG } from '@/lib/catalog';
import { CRANES } from '@/lib/cranes';
import { color, font, radius, space } from '@/theme';

const STEPS = [
  { tag: 'INPUT', title: '간단한 조건 입력', body: '건물 높이와 자재 중량을 구간 칩과 슬라이더로 고릅니다. 중량물 규격을 넣으면 줄걸이 각도와 슬링 장력까지 계산합니다.' },
  { tag: 'SETTINGS', title: '장비 선택과 자동 계산', body: '종류·제조사·장비명을 고르거나 UP/DN 으로 한 단계씩 바꿉니다. 최대거리 자동계산으로 가장 멀리 인양할 수 있는 위치를 찾고, 이격거리와 작업반경은 자물쇠로 고정할 수 있습니다.' },
  { tag: 'RESULT', title: '검토서와 기록', body: '판정, 붐 길이·각도, Tip 높이, 외벽·상부 여유, 하중률, 아웃리거 반력을 한 장에 정리합니다. PDF로 내보내고 현장별로 저장합니다.' },
];

export default function About() {
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.hero}>
        <CraneMark size={72} />
        <Text style={{ fontFamily: font.display, fontSize: 30, color: color.charcoal }}>리프팅 플랜</Text>
        <T tone="#5A4500">크레인 양중 검토, 현장에서 바로</T>
      </View>
      {STEPS.map((s, i) => (
        <View key={s.tag} style={styles.card}>
          <View style={styles.tag}>
            <Text style={{ fontFamily: font.bold, fontSize: 11, letterSpacing: 1, color: color.yellow }}>
              {i + 1} · {s.tag}
            </Text>
          </View>
          <T style={{ fontFamily: font.bold, fontSize: 17 }}>{s.title}</T>
          <T tone={color.muted}>{s.body}</T>
        </View>
      ))}
      <View style={styles.card}>
        <T style={{ fontFamily: font.bold, fontSize: 17 }}>장비 데이터</T>
        <T tone={color.muted}>
          KATO·LIEBHERR·TADANO·GROVE·KOBELCO 200t 이하 {CATALOG.length}개 기종 제원을 제조사 공식 자료에서 모았습니다. 검토 계산은 하중표가 등록된 {CRANES.length}개 기종으로 하며, 하중표는 PDF 추출본이라 원본 대조 전입니다.
        </T>
      </View>
      <View style={[styles.card, { backgroundColor: '#FDECEC', borderColor: '#F5C6C6' }]}>
        <T style={{ fontFamily: font.bold }} tone={color.no}>
          주의사항
        </T>
        <T variant="caption" tone="#8E1F1F">
          이 앱의 결과는 입력값을 바탕으로 한 참고용 계산값입니다. 실제 작업 전 제조사 공인 하중표, 안전율, 작업계획서, 신호수·작업지휘자 배치, 지반·풍속·장애물을 반드시 확인하세요.
        </T>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  hero: { alignItems: 'center', gap: 4, paddingVertical: space.xl, backgroundColor: color.yellow, borderRadius: radius.lg },
  card: { backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, padding: space.lg, gap: 6 },
  tag: { alignSelf: 'flex-start', backgroundColor: color.charcoal, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
});
