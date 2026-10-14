import { Href, router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CraneMark } from '@/components/CraneMark';
import { Icon, IconName } from '@/components/Icon';
import { DEFAULT_INPUT } from '@/lib/calc';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space } from '@/theme';

// Hamburger button that opens the side menu (Crane Fit style).
const ITEMS: { label: string; icon: IconName; href: Href; fresh?: boolean }[] = [
  { label: '홈', icon: 'home', href: '/' },
  { label: '새 검토', icon: 'plus', href: '/review/input', fresh: true },
  { label: '앱 소개', icon: 'info', href: '/about' },
  { label: '장비 제원표', icon: 'sheet', href: '/equipment' },
  { label: '계산 기록', icon: 'history', href: '/history' },
];

export function MenuButton({ tone = color.charcoal, round }: { tone?: string; round?: boolean }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { reset } = useReview();
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="메뉴" hitSlop={8} onPress={() => setOpen(true)} style={[styles.btn, round && styles.round]}>
        <Icon name="menu" color={tone} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={[styles.panel, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}>
            <View style={styles.brand}>
              <CraneMark size={44} />
              <View>
                <Text style={{ fontFamily: font.display, fontSize: 22, color: color.charcoal }}>리프팅 플랜</Text>
                <Text style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: 2, color: color.muted }}>LIFTING PLAN</Text>
              </View>
            </View>
            {ITEMS.map((it) => (
              <Pressable
                key={it.label}
                accessibilityRole="link"
                onPress={() => {
                  setOpen(false);
                  if (it.fresh) reset(DEFAULT_INPUT);
                  if (it.href === '/') router.dismissTo('/');
                  else router.push(it.href);
                }}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: color.yellowSoft }]}
              >
                <Icon name={it.icon} color={color.charcoal} />
                <Text style={{ fontFamily: font.bold, fontSize: 16, color: color.charcoal }}>{it.label}</Text>
              </Pressable>
            ))}
            <Text style={styles.foot}>검토 결과는 참고용입니다. 작업 전 제조사 공인 하중표를 확인하세요.</Text>
          </View>
          <Pressable accessibilityLabel="메뉴 닫기" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  round: { borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.75)' },
  panel: { width: 280, backgroundColor: color.paper, paddingHorizontal: space.lg, gap: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xl },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, height: 52, paddingHorizontal: space.md, borderRadius: radius.md },
  foot: { marginTop: 'auto', fontFamily: font.body, fontSize: 12, lineHeight: 18, color: color.muted },
});
