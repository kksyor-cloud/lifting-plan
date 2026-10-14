import { ReactNode, useRef, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, Pressable, StyleSheet, Text, TextInput, TextProps, View, ViewStyle } from 'react-native';
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

/** Number input that is easy to use with gloves on: coarse/fine ± buttons plus direct entry */
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
          <T variant="caption" style={{ minWidth: 18, marginRight: 8 }}>
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

const STEPS = ['조건 입력', '장비 설정', '검토 결과'];

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

/** Button area pinned to the bottom of the screen */
export function Footer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: space.lg + insets.bottom }]}>{children}</View>;
}

/** Drag-to-change slider. Uses only touch responders, shared by web and native. */
export function Slider({ value, min, max, step, onChange, disabled }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [width, setWidth] = useState(1);
  const origin = useRef(0);
  const span = Math.max(max - min, 1e-9);
  const frac = Math.min(1, Math.max(0, (value - min) / span));
  const emit = (x: number) => {
    const f = Math.min(1, Math.max(0, x / width));
    const v = Math.round((min + f * span) / step) * step;
    onChange(Number(Math.min(max, Math.max(min, v)).toFixed(4)));
  };
  return (
    <View
      accessibilityRole="adjustable"
      onLayout={(e: LayoutChangeEvent) => setWidth(Math.max(1, e.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e: GestureResponderEvent) => {
        // Anchor the origin in screen coordinates so tracking continues when the finger leaves the slider.
        origin.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
        emit(e.nativeEvent.locationX);
      }}
      onResponderMove={(e: GestureResponderEvent) => emit(e.nativeEvent.pageX - origin.current)}
      style={[styles.slider, disabled && { opacity: 0.4 }]}
    >
      <View pointerEvents="none" style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${frac * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.sliderThumb, { left: frac * width - 13 }]} />
    </View>
  );
}

/** Crane Fit-style input row: title·value(·lock) / coarse−·fine− · slider · fine+·coarse+ */
export function SliderField({
  label,
  value,
  unit,
  min,
  max,
  big,
  small,
  onChange,
  digits = 1,
  locked,
  onToggleLock,
  disabled,
  extra,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  big: number;
  small: number;
  onChange: (v: number) => void;
  digits?: number;
  locked?: boolean;
  onToggleLock?: () => void;
  disabled?: boolean;
  extra?: ReactNode;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Number(round(v, small).toFixed(digits)))));
  const off = disabled || locked;
  return (
    <View style={{ gap: space.sm, opacity: disabled ? 0.45 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <T style={{ fontFamily: font.bold, fontSize: 16 }}>{label}</T>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>{extra}</View>
        <T style={{ fontFamily: font.bold, fontSize: 20 }}>
          {Number(value.toFixed(digits))}
          <T style={{ fontSize: 15, fontFamily: font.medium }}>{unit}</T>
        </T>
        {onToggleLock ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${locked ? '고정 해제' : '고정'}`} onPress={onToggleLock} hitSlop={8} style={[styles.lock, locked && { backgroundColor: color.charcoal }]}>
            <LockIcon locked={!!locked} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <RoundBtn label="−" strong onPress={() => set(value - big)} disabled={off} />
        <RoundBtn label="−" onPress={() => set(value - small)} disabled={off} />
        <View style={{ flex: 1, paddingHorizontal: 6 }}>
          <Slider value={value} min={min} max={max} step={small} onChange={(v) => set(v)} disabled={off} />
        </View>
        <RoundBtn label="+" onPress={() => set(value + small)} disabled={off} />
        <RoundBtn label="+" strong onPress={() => set(value + big)} disabled={off} />
      </View>
    </View>
  );
}

function RoundBtn({ label, onPress, strong, disabled }: { label: string; onPress: () => void; strong?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label === '+' ? '올리기' : '내리기'} ${strong ? '크게' : '조금'}`}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.round, strong ? { backgroundColor: color.line } : null, pressed && { backgroundColor: color.yellow }, disabled && { opacity: 0.4 }]}
    >
      <Text style={{ fontFamily: font.bold, fontSize: strong ? 22 : 18, color: strong ? color.charcoal : color.muted, lineHeight: 24 }}>{label}</Text>
    </Pressable>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  const c = locked ? color.yellow : color.muted;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 10, height: 8, borderWidth: 2, borderBottomWidth: 0, borderColor: c, borderTopLeftRadius: 5, borderTopRightRadius: 5, marginBottom: -1, transform: [{ translateX: locked ? 0 : 3 }] }} />
      <View style={{ width: 14, height: 10, borderRadius: 2, backgroundColor: c }} />
    </View>
  );
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
  slider: { height: 36, justifyContent: 'center' },
  sliderTrack: { height: 8, borderRadius: 4, backgroundColor: color.line, overflow: 'hidden' },
  sliderFill: { height: 8, backgroundColor: color.yellow },
  sliderThumb: { position: 'absolute', top: 5, width: 26, height: 26, borderRadius: 13, backgroundColor: color.surface, borderWidth: 1, borderColor: color.warm, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  lock: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface },
  badge: { paddingHorizontal: 6, borderRadius: 4, alignSelf: 'flex-start' },
  step: { flex: 1, height: 36, borderRadius: radius.sm, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
});
