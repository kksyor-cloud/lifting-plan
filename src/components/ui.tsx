import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextProps, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Verdict, VERDICT_LABEL } from '@/lib/calc';
import { color, font, radius, space, verdictColor } from '@/theme';

type TProps = TextProps & { variant?: 'body' | 'label' | 'title' | 'display' | 'mono' | 'caption'; tone?: string };

export function T({ variant = 'body', tone, style, ...rest }: TProps) {
  return <Text {...rest} style={[t[variant], tone ? { color: tone } : null, style]} />;
}

const t = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.charcoal },
  label: { fontFamily: font.mono, fontSize: 12, letterSpacing: 1.5, color: color.muted },
  title: { fontFamily: font.bold, fontSize: 20, lineHeight: 28, color: color.charcoal },
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 44, color: color.charcoal },
  mono: { fontFamily: font.mono, fontSize: 14, color: color.charcoal, fontVariant: ['tabular-nums'] },
  caption: { fontFamily: font.body, fontSize: 12, lineHeight: 18, color: color.muted },
});

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'yellow';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg = kind === 'primary' ? color.charcoal : kind === 'yellow' ? color.yellow : color.surface;
  const fg = kind === 'primary' ? color.yellow : color.charcoal;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        kind === 'secondary' && { borderWidth: 1, borderColor: color.line },
        style,
      ]}
    >
      <Text style={{ fontFamily: font.bold, fontSize: 16, color: fg }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Section({ label, children, right }: { label: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T variant="label">{label}</T>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: color.yellow, borderColor: color.yellow }]}
    >
      <Text style={{ fontFamily: active ? font.bold : font.medium, fontSize: 14, color: color.charcoal }}>{label}</Text>
    </Pressable>
  );
}

const round = (v: number, step: number) => Math.round(v / step) * step;

/** 장갑 낀 손으로도 쓰기 쉬운 숫자 입력: 큰 단위/작은 단위 ± 버튼 + 직접 입력 */
export function NumberField({
  label,
  unit,
  value,
  onChange,
  big,
  small,
  min = 0,
  max = 999,
  digits = 1,
  hint,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  big: number;
  small: number;
  min?: number;
  max?: number;
  digits?: number;
  hint?: string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Number(round(v, small).toFixed(digits)))));
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T style={{ fontFamily: font.medium }}>{label}</T>
        {hint ? <T variant="caption">{hint}</T> : null}
      </View>
      <View style={styles.numberRow}>
        <StepBtn label={`−${big}`} onPress={() => set(value - big)} />
        <StepBtn label={`−${small}`} onPress={() => set(value - small)} />
        <View style={styles.numberBox}>
          <TextInput
            accessibilityLabel={label}
            keyboardType="decimal-pad"
            value={String(value)}
            onChangeText={(s) => {
              const n = Number(s.replace(',', '.'));
              if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
            style={styles.numberInput}
          />
          <T variant="caption" style={{ width: 18, marginRight: 8 }}>
            {unit}
          </T>
        </View>
        <StepBtn label={`+${small}`} onPress={() => set(value + small)} />
        <StepBtn label={`+${big}`} onPress={() => set(value + big)} />
      </View>
    </View>
  );
}

function StepBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.stepBtn, pressed && { backgroundColor: color.yellowSoft }]}>
      <Text style={{ fontFamily: font.mono, fontSize: 13, color: color.charcoal }}>{label}</Text>
    </Pressable>
  );
}

export function VerdictBadge({ verdict, size = 'md' }: { verdict: Verdict; size?: 'md' | 'lg' }) {
  const c = verdictColor[verdict];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: size === 'lg' ? 12 : 9, height: size === 'lg' ? 12 : 9, borderRadius: 6, backgroundColor: c }} />
      <Text style={{ fontFamily: font.bold, fontSize: size === 'lg' ? 20 : 14, color: c }}>{VERDICT_LABEL[verdict]}</Text>
    </View>
  );
}

export function KV({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={styles.kv}>
      <T style={{ color: color.muted, flexShrink: 1, minWidth: '28%' }}>{k}</T>
      <T variant="mono" style={[{ flexShrink: 1, textAlign: 'right' }, strong ? { fontSize: 16 } : null]}>
        {v}
      </T>
    </View>
  );
}

const STEPS = ['조건 입력', '장비 선택', '검토 결과'];

export function StepBar({ step }: { step: 0 | 1 | 2 }) {
  return (
    <View style={styles.stepBar}>
      {STEPS.map((s, i) => (
        <View key={s} style={[styles.step, i === step && { backgroundColor: color.yellow }, i < step && { backgroundColor: color.yellowSoft }]}>
          <Text style={{ fontFamily: i === step ? font.bold : font.medium, fontSize: 13, color: i <= step ? color.charcoal : color.muted }}>
            {i + 1}. {s}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function Badge({ label, kind }: { label: string; kind: 'yellow' | 'outline' | 'grey' | 'green' }) {
  const bg = { yellow: color.yellow, outline: 'transparent', grey: color.line, green: color.ok }[kind];
  const fg = { yellow: color.charcoal, outline: color.muted, grey: color.muted, green: '#FFFFFF' }[kind];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, kind === 'outline' && { borderWidth: 1, borderColor: color.warm }]}>
      <T style={{ fontFamily: font.bold, fontSize: 11, lineHeight: 16, color: fg }}>{label}</T>
    </View>
  );
}

/** 화면 아래 고정 버튼 영역 */
export function Footer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: space.lg + insets.bottom }]}>{children}</View>;
}

export const fmt = {
  m: (v: number) => `${v.toFixed(1)} m`,
  t: (v: number) => `${v.toFixed(2)} t`,
  deg: (v: number) => `${v.toFixed(1)}°`,
  pct: (v: number) => (Number.isFinite(v) ? `${Math.round(v * 100)} %` : '—'),
};

const styles = StyleSheet.create({
  button: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  card: { backgroundColor: color.surface, borderRadius: radius.md, borderWidth: 1, borderColor: color.line, padding: space.lg, gap: space.sm },
  chip: { paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, justifyContent: 'center' },
  numberRow: { flexDirection: 'row', gap: 6, alignItems: 'stretch' },
  numberBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: color.charcoal, borderRadius: radius.sm, backgroundColor: color.surface, minHeight: 48 },
  numberInput: { flex: 1, minWidth: 0, fontFamily: font.mono, fontSize: 20, color: color.charcoal, textAlign: 'right', paddingVertical: 6 },
  stepBtn: { width: 48, minHeight: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, gap: space.md },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, gap: space.sm, backgroundColor: color.paper, borderTopWidth: 1, borderTopColor: color.line },
  stepBar: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 6, borderRadius: 4, alignSelf: 'flex-start' },
  step: { flex: 1, height: 36, borderRadius: radius.sm, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
});
