import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CraneMark } from '@/components/CraneMark';
import { RecentRow } from '@/components/RecentRow';
import { Button, Card, Section, T } from '@/components/ui';
import { DEFAULT_INPUT } from '@/lib/calc';
import { loadReviews, SavedReview } from '@/lib/history';
import { useReview } from '@/lib/review-context';
import { color, space } from '@/theme';

export default function Home() {
  const { reset } = useReview();
  const [recent, setRecent] = useState<SavedReview[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadReviews().then((l) => setRecent(l.slice(0, 3)));
    }, []),
  );

  const start = () => {
    reset(DEFAULT_INPUT);
    router.push('/review/input');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: color.yellow }}>
        <View style={styles.hero}>
          <CraneMark size={72} />
          <T variant="display" style={{ marginTop: space.lg }}>
            양중노트
          </T>
          <T variant="label" tone="#5A4500" style={{ letterSpacing: 4 }}>
            LIFTNOTE
          </T>
          <T variant="title" style={{ marginTop: space.md }}>
            근거가 남는 양중 검토
          </T>
          <T tone="#4A3A10">후보 장비 비교부터 하중표 출처가 적힌 검토서까지.</T>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.body}>
        <Button label="새 검토 시작" onPress={start} />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="검토 기록" kind="secondary" onPress={() => router.push('/history')} style={{ flex: 1 }} />
          <Button label="장비 제원표" kind="secondary" onPress={() => router.push('/equipment')} style={{ flex: 1 }} />
        </View>

        <Section label="최근 검토">
          {recent.length === 0 ? (
            <Card>
              <T variant="caption">아직 저장한 검토가 없습니다. 검토 결과 화면에서 저장하면 여기에 보입니다.</T>
            </Card>
          ) : (
            recent.map((r) => <RecentRow key={r.id} item={r} />)
          )}
        </Section>

        <T variant="caption">
          현재 장비 데이터는 개발용 샘플입니다. 실제 하중표로 바꾸기 전에는 현장 검토에 쓰지 마세요.
        </T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xl, gap: 2 },
  body: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
});
