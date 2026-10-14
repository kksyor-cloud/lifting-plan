import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuButton } from '@/components/AppMenu';
import { CraneMark } from '@/components/CraneMark';
import { HeroScene } from '@/components/HeroScene';
import { Icon, IconName } from '@/components/Icon';
import { T } from '@/components/ui';
import { DEFAULT_INPUT } from '@/lib/calc';
import { CATALOG } from '@/lib/catalog';
import { CRANES } from '@/lib/cranes';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space } from '@/theme';

const MENU: { label: string; icon: IconName; href: '/about' | '/equipment' | '/history' }[] = [
  { label: '앱 소개', icon: 'info', href: '/about' },
  { label: '장비 제원표', icon: 'sheet', href: '/equipment' },
  { label: '계산 기록', icon: 'history', href: '/history' },
];

export default function Home() {
  const { reset } = useReview();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [notice, setNotice] = useState(false);
  const heroH = Math.max(500, Math.min(height * 0.7, 680));

  const start = () => {
    reset(DEFAULT_INPUT);
    router.push('/review/input');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.paper }} contentContainerStyle={{ paddingBottom: space.xl }}>
      <View style={{ height: heroH }}>
        <View style={StyleSheet.absoluteFill}>
          <HeroScene width={width} height={heroH} />
        </View>
        <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
          <MenuButton round />
          <Pressable accessibilityRole="button" onPress={() => setNotice(!notice)} style={styles.notice}>
            <Icon name="megaphone" size={16} color="#C0392B" />
            <Text style={{ fontFamily: font.bold, fontSize: 13, color: color.charcoal }}>공지사항</Text>
          </Pressable>
          <View style={{ width: 40 }} />
        </View>
        {notice ? (
          <View style={styles.noticeBox}>
            <T style={{ fontFamily: font.bold }}>하중표 {CRANES.length}개 기종 등록</T>
            <T variant="caption">
              TADANO·KATO 러프터레인 {CRANES.length}종으로 검토할 수 있습니다. 하중표는 제조사 PDF 추출본이라 원본 대조 전이며, 장비 제원표에는 {CATALOG.length}개 기종이 있습니다.
            </T>
          </View>
        ) : null}
        <View style={styles.titleBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <CraneMark size={34} />
            <Text style={styles.small}>LIFTING PLAN</Text>
          </View>
          <Text style={styles.title}>리프팅 플랜</Text>
          <Text style={styles.sub}>조건만 입력하면 적합한 크레인을 즉시 검토</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="검토 시작" onPress={start} style={({ pressed }) => [styles.start, pressed && { transform: [{ scale: 0.98 }] }]}>
          <Text style={styles.startText}>START</Text>
        </Pressable>
      </View>

      <View style={styles.menu}>
        {MENU.map((m) => (
          <Pressable key={m.label} accessibilityRole="link" onPress={() => router.push(m.href)} style={({ pressed }) => [styles.item, pressed && { backgroundColor: color.yellowSoft }]}>
            <Icon name={m.icon} color={color.charcoal} />
            <Text style={{ flex: 1, fontFamily: font.bold, fontSize: 17, color: color.charcoal }}>{m.label}</Text>
            <Icon name="chevron" size={20} color={color.warm} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 14, height: 34, borderWidth: 1.5, borderColor: color.yellow },
  noticeBox: { marginHorizontal: space.lg, marginTop: space.sm, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.md, padding: space.md, gap: 2, borderWidth: 1, borderColor: color.line },
  titleBox: { alignItems: 'center', marginTop: space.xl, gap: 4 },
  small: { fontFamily: font.mono, fontSize: 12, letterSpacing: 3, color: '#5A4500' },
  title: { fontFamily: font.display, fontSize: 52, lineHeight: 60, color: color.charcoal, textShadowColor: 'rgba(255,255,255,0.8)', textShadowRadius: 8 },
  sub: { fontFamily: font.bold, fontSize: 15, color: '#5A4500', backgroundColor: 'rgba(255,248,224,0.92)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 3, overflow: 'hidden' },
  start: { position: 'absolute', left: space.xl * 1.5, right: space.xl * 1.5, bottom: 28, height: 64, borderRadius: 16, backgroundColor: color.yellow, borderWidth: 2, borderColor: color.charcoal, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  startText: { fontFamily: font.display, fontSize: 30, letterSpacing: 4, color: color.charcoal },
  menu: { padding: space.lg, gap: space.sm, marginTop: -space.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, height: 60, paddingHorizontal: space.lg, backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line },
});
