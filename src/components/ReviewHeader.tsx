import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { MenuButton } from '@/components/AppMenu';
import { color, font, space } from '@/theme';

// Yellow app bar for the three review steps: menu, app name, INPUT > SETTINGS > RESULT.
const STEPS = ['INPUT', 'SETTINGS', 'RESULT'] as const;
const ROUTES = ['/review/input', '/review/settings', '/review/result'] as const;

export function ReviewHeader({ step }: { step: 0 | 1 | 2 }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <MenuButton round />
      <Text style={styles.brand} numberOfLines={1}>
        리프팅 플랜
      </Text>
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityState={{ selected: i === step, disabled: i >= step }}
            accessibilityLabel={`${i + 1}단계 ${s}`}
            disabled={i >= step}
            // Earlier steps can be revisited; later ones open only through the screen's own button.
            onPress={() => router.dismissTo(ROUTES[i])}
            style={{ marginLeft: i ? -7 : 0 }}
          >
            <Chevron label={s} active={i === step} first={i === 0} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Chevron({ label, active, first }: { label: string; active: boolean; first: boolean }) {
  const w = label.length > 6 ? 82 : 66;
  const h = 30;
  const tip = 9;
  const pts = first ? `0,0 ${w - tip},0 ${w},${h / 2} ${w - tip},${h} 0,${h}` : `0,0 ${w - tip},0 ${w},${h / 2} ${w - tip},${h} 0,${h} ${tip},${h / 2}`;
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Polygon points={pts} fill={active ? color.charcoal : '#F4EFE4'} stroke={active ? color.charcoal : '#D9D1BF'} strokeWidth={1} />
      </Svg>
      <Text style={{ textAlign: 'center', paddingLeft: first ? 0 : tip / 2, paddingRight: tip / 2, fontFamily: font.bold, fontSize: 10, letterSpacing: 0.5, color: active ? color.yellow : color.muted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: color.yellow, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingBottom: 10 },
  brand: { flex: 1, fontFamily: font.display, fontSize: 19, color: color.charcoal },
  steps: { flexDirection: 'row', alignItems: 'center' },
});
