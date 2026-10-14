import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Footer, SliderField, StepBar, T } from '@/components/ui';
import { LoadDims } from '@/lib/calc';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space } from '@/theme';

// Fixed conditions: pick a rough range with chips, then fine-tune with the slider and ± buttons.
type Band = { key: string; sub: string; min: number; max: number; value: number };
const HEIGHT_BANDS: Band[] = [
  { key: '저', sub: '0-20', min: 0, max: 20, value: 15 },
  { key: '중', sub: '20-50', min: 20, max: 50, value: 30 },
  { key: '고', sub: '50-100', min: 50, max: 100, value: 60 },
];
const WEIGHT_BANDS: Band[] = [
  { key: '저', sub: '0.1-5', min: 0, max: 5, value: 1 },
  { key: '중', sub: '5-15', min: 5, max: 15, value: 8 },
  { key: '고', sub: '15-30', min: 15, max: 30, value: 20 },
  { key: 'S', sub: '30-100', min: 30, max: 100, value: 40 },
];
const bandOf = (bands: Band[], v: number) => bands.find((b) => v < b.max) ?? bands[bands.length - 1];

type DimKey = keyof LoadDims;
const DIM_FIELDS: { key: DimKey; label: string }[] = [
  { key: 'length', label: '가로 (m)' },
  { key: 'width', label: '세로 (m)' },
  { key: 'height', label: '높이 (m)' },
];

export default function InputScreen() {
  const { input, setInput } = useReview();
  // Dimensions are used in the calculation only when all three fields are filled. In-progress text is held separately.
  const [dimText, setDimText] = useState<Record<DimKey, string>>(() => ({
    length: input.dims ? String(input.dims.length) : '',
    width: input.dims ? String(input.dims.width) : '',
    height: input.dims ? String(input.dims.height) : '',
  }));
  const setDim = (k: DimKey, text: string) => {
    const next = { ...dimText, [k]: text };
    setDimText(next);
    const nums = DIM_FIELDS.map((f) => Number(next[f.key].replace(',', '.')));
    const ok = nums.every((n) => Number.isFinite(n) && n > 0) && DIM_FIELDS.every((f) => next[f.key].trim() !== '');
    setInput({ dims: ok ? { length: nums[0], width: nums[1], height: nums[2] } : null });
  };
  const hb = bandOf(HEIGHT_BANDS, input.buildingHeight);
  const wb = bandOf(WEIGHT_BANDS, input.loadWeight);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <StepBar step={0} />

        <T variant="label">고정 조건</T>
        <SliderField
          label="건물 높이"
          unit="m"
          value={input.buildingHeight}
          min={1}
          max={100}
          big={5}
          small={1}
          digits={0}
          onChange={(buildingHeight) => setInput({ buildingHeight })}
          extra={HEIGHT_BANDS.map((b) => (
            <BandChip key={b.key} band={b} active={b === hb} onPress={() => setInput({ buildingHeight: b.value })} />
          ))}
        />
        <SliderField
          label="자재 중량"
          unit="t"
          value={input.loadWeight}
          min={0.1}
          max={100}
          big={1}
          small={0.1}
          onChange={(loadWeight) => setInput({ loadWeight })}
          extra={WEIGHT_BANDS.map((b) => (
            <BandChip key={b.key} band={b} active={b === wb} onPress={() => setInput({ loadWeight: b.value })} />
          ))}
        />

        <View style={{ gap: space.sm, marginTop: space.md }}>
          <T style={{ fontFamily: font.bold, fontSize: 17 }}>중량물 규격 (선택사항)</T>
          <T variant="caption">입력하면 다이어그램에 자재 크기가 그려지고 슬링을 계산합니다 (긴 변 기준).</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {DIM_FIELDS.map((f, i) => (
              <View key={f.key} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  accessibilityLabel={f.label}
                  placeholder={f.label}
                  placeholderTextColor={color.warm}
                  keyboardType="decimal-pad"
                  value={dimText[f.key]}
                  onChangeText={(t) => setDim(f.key, t)}
                  style={styles.dim}
                />
                {i < 2 ? <T tone={color.muted}>×</T> : null}
              </View>
            ))}
          </View>
        </View>

        <SliderField
          label="줄걸이 각도"
          unit="°"
          value={input.slingAngle}
          min={30}
          max={80}
          big={5}
          small={1}
          digits={0}
          disabled={!input.dims}
          onChange={(slingAngle) => setInput({ slingAngle })}
        />
        <T variant="caption" style={{ marginTop: -space.md }}>
          {input.dims ? '수평 기준 각도입니다. 60° 이상을 권장합니다.' : '가로, 세로, 높이를 모두 입력하면 조절할 수 있습니다.'}
        </T>
      </ScrollView>
      <Footer>
        <Button label="▶  검토 시작" kind="yellow" onPress={() => router.push('/review/settings')} />
      </Footer>
    </View>
  );
}

function BandChip({ band, active, onPress }: { band: Band; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${band.key} ${band.sub}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.band, active && { backgroundColor: color.yellow, borderColor: color.yellow }]}
    >
      <Text style={{ fontFamily: font.bold, fontSize: 13, color: color.charcoal }}>{band.key}</Text>
      <Text style={{ fontFamily: font.body, fontSize: 9, color: active ? color.charcoal : color.muted }}>{band.sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: space.xl, paddingBottom: 120 },
  band: { minWidth: 38, paddingHorizontal: 4, height: 38, borderRadius: radius.sm, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  dim: { flex: 1, minWidth: 0, fontFamily: font.body, fontSize: 15, color: color.charcoal, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.sm, height: 48 },
});
