import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Button, Card, Chip, Footer, NumberField, Section, StepBar, T } from '@/components/ui';
import { useReview } from '@/lib/review-context';
import { color, font, radius, space } from '@/theme';

// 구간 칩: 누르면 구간 대표값으로 맞추고, 세부 값은 ± 버튼으로 조정한다.
const HEIGHT_BANDS = [
  { label: '저층 ~20m', value: 15 },
  { label: '중층 20~50m', value: 30 },
  { label: '고층 50m~', value: 60 },
];
const WEIGHT_BANDS = [
  { label: '~5t', value: 1 },
  { label: '5~15t', value: 8 },
  { label: '15~30t', value: 20 },
  { label: '30t~', value: 40 },
];

export default function InputScreen() {
  const { input, setInput } = useReview();
  const dims = input.dims;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <StepBar step={0} />

        <Section label="현장">
          <TextInput
            accessibilityLabel="현장명"
            placeholder="현장명 (예: ○○ 물류센터 신축공사)"
            placeholderTextColor={color.warm}
            value={input.siteName}
            onChangeText={(siteName) => setInput({ siteName })}
            style={styles.text}
          />
        </Section>

        <Section label="건물 높이">
          <View style={styles.chips}>
            {HEIGHT_BANDS.map((b) => (
              <Chip key={b.label} label={b.label} active={bandOf(HEIGHT_BANDS, input.buildingHeight) === b.label} onPress={() => setInput({ buildingHeight: b.value })} />
            ))}
          </View>
          <NumberField label="건물 높이" unit="m" value={input.buildingHeight} onChange={(buildingHeight) => setInput({ buildingHeight })} big={5} small={0.5} min={1} max={150} />
        </Section>

        <Section label="자재 중량">
          <View style={styles.chips}>
            {WEIGHT_BANDS.map((b) => (
              <Chip key={b.label} label={b.label} active={bandOf(WEIGHT_BANDS, input.loadWeight) === b.label} onPress={() => setInput({ loadWeight: b.value })} />
            ))}
          </View>
          <NumberField label="자재 중량" unit="t" value={input.loadWeight} onChange={(loadWeight) => setInput({ loadWeight })} big={1} small={0.1} min={0.1} max={100} />
          <NumberField
            label="줄걸이 용구 중량"
            hint="슬링·샤클 등. 하중률에 포함"
            unit="t"
            value={input.riggingWeight}
            onChange={(riggingWeight) => setInput({ riggingWeight })}
            big={0.1}
            small={0.01}
            min={0}
            max={5}
            digits={2}
          />
        </Section>

        <Section label="배치">
          <NumberField label="건물 이격거리" hint="크레인 중심 ~ 외벽" unit="m" value={input.setback} onChange={(setback) => setInput({ setback })} big={1} small={0.5} min={2} max={60} />
          <NumberField label="도달거리" hint="외벽 ~ 인양 지점" unit="m" value={input.reach} onChange={(reach) => setInput({ reach })} big={1} small={0.5} min={0} max={60} />
          <T variant="caption">작업반경 = 이격거리 + 도달거리 = {(input.setback + input.reach).toFixed(1)} m</T>
        </Section>

        <Section
          label="자재 규격 (선택)"
          right={
            <Switch
              accessibilityLabel="자재 규격 입력"
              value={dims !== null}
              onValueChange={(on) => setInput({ dims: on ? { length: 4, width: 2, height: 1 } : null })}
              trackColor={{ true: color.yellow, false: color.line }}
              thumbColor={color.surface}
            />
          }
        >
          {dims ? (
            <Card>
              <NumberField label="가로 (긴 변)" unit="m" value={dims.length} onChange={(length) => setInput({ dims: { ...dims, length } })} big={1} small={0.1} min={0.1} max={30} />
              <NumberField label="세로" unit="m" value={dims.width} onChange={(width) => setInput({ dims: { ...dims, width } })} big={1} small={0.1} min={0.1} max={30} />
              <NumberField label="높이" unit="m" value={dims.height} onChange={(height) => setInput({ dims: { ...dims, height } })} big={1} small={0.1} min={0.1} max={30} />
              <NumberField label="줄걸이 각도" hint="수평 기준, 60° 권장" unit="°" value={input.slingAngle} onChange={(slingAngle) => setInput({ slingAngle })} big={5} small={1} min={30} max={80} digits={0} />
            </Card>
          ) : (
            <T variant="caption">규격을 넣으면 슬링 길이와 1가닥 장력을 계산하고, 필요한 붐 높이에 반영합니다. 넣지 않으면 자재·줄걸이 높이를 2.5m로 가정합니다.</T>
          )}
        </Section>
      </ScrollView>
      <Footer>
        <Button label="장비 검토하기" onPress={() => router.push('/review/select')} />
      </Footer>
    </View>
  );
}

function bandOf(bands: { label: string; value: number }[], v: number): string {
  // 각 칩의 경계값은 다음 칩 대표값과의 중간이 아니라 라벨 구간을 따른다.
  const edges = bands === HEIGHT_BANDS ? [20, 50] : [5, 15, 30];
  const i = edges.findIndex((e) => v < e);
  return bands[i === -1 ? bands.length - 1 : i].label;
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: space.xl, paddingBottom: 120 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  text: { fontFamily: font.body, fontSize: 16, color: color.charcoal, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, height: 48 },
});
