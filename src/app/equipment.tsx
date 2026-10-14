import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Card, KV, T } from '@/components/ui';
import { CRANES } from '@/lib/cranes';
import { color, font, space } from '@/theme';

export default function EquipmentScreen() {
  const [open, setOpen] = useState<string | null>(CRANES[0]?.id ?? null);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: space.sm }}>
      <T variant="caption">현재 데이터는 개발용 샘플입니다. 실제 제조사 하중표로 교체해야 합니다.</T>
      {CRANES.map((c) => {
        const isOpen = open === c.id;
        return (
          <Card key={c.id}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(isOpen ? null : c.id)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T style={{ fontFamily: font.bold }}>{c.name}</T>
              <T variant="mono" tone={color.muted}>
                최대 {c.classTon}t {isOpen ? '▲' : '▼'}
              </T>
            </Pressable>
            {isOpen ? (
              <View style={{ gap: space.md }}>
                <View>
                  <KV k="붐 길이" v={`${c.boomMin} ~ ${c.boomMax} m`} />
                  <KV k="붐 각도 범위" v={`${c.minAngle} ~ ${c.maxAngle}°`} />
                  <KV k="훅 블록" v={`${c.hookBlockWeight} t`} />
                  <KV k="아웃리거 폭" v={`${c.outriggerSpan} m`} />
                  <KV k="자체 중량" v={`${c.selfWeight} t`} />
                </View>
                <T variant="label">하중표 (반경 m : 정격 t)</T>
                {c.chart.map((row) => (
                  <View key={row.boomLength} style={{ gap: 2 }}>
                    <T style={{ fontFamily: font.medium }}>붐 {row.boomLength} m</T>
                    <T variant="mono" style={{ fontSize: 12, lineHeight: 18 }}>
                      {row.capacities.map(([r, t]) => `${r}:${t}`).join('  ')}
                    </T>
                  </View>
                ))}
                <T variant="caption">출처: {c.source}</T>
              </View>
            ) : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}
