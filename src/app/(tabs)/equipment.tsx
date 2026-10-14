import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CraneMark } from '@/components/CraneMark';
import { Icon } from '@/components/Icon';
import { T } from '@/components/ui';
import { CATALOG, CatalogEntry, Maker, MAKERS, makerLabel, tonLabel } from '@/lib/catalog';
import { color, font, radius, space } from '@/theme';

// Equipment catalog (Crane Fit layout): crane-type tabs, maker chips, one card per model.
type Kind = 'mobile' | 'tower';

export default function EquipmentList() {
  const [kind, setKind] = useState<Kind>('mobile');
  const [maker, setMaker] = useState<Maker | 'all'>('all');
  const [chartOnly, setChartOnly] = useState(false);
  const list = useMemo(
    () =>
      CATALOG.filter((e) => (maker === 'all' || e.maker === maker) && (!chartOnly || e.chart)).sort(
        (a, b) => Number(!!b.chart) - Number(!!a.chart) || a.classTon - b.classTon || a.model.localeCompare(b.model),
      ),
    [maker, chartOnly],
  );

  const header = (
    <View style={{ gap: space.md, paddingBottom: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={styles.seg}>
          {(['mobile', 'tower'] as Kind[]).map((k) => (
            <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: kind === k }} onPress={() => setKind(k)} style={[styles.segItem, kind === k && styles.segOn]}>
              <Text style={{ fontFamily: font.bold, fontSize: 15, color: kind === k ? color.charcoal : color.warm }}>{k === 'mobile' ? '이동식 크레인' : '이동타워크레인'}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: chartOnly }} onPress={() => setChartOnly(!chartOnly)} hitSlop={6}>
          <Text style={{ fontFamily: font.bold, fontSize: 13, color: chartOnly ? color.yellowDeep : color.muted }}>{chartOnly ? '하중표 ✓' : '하중표만'}</Text>
        </Pressable>
      </View>
      {kind === 'mobile' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {[{ key: 'all' as const, label: '전체' }, ...MAKERS].map((m) => {
            const active = maker === m.key;
            return (
              <Pressable key={m.key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setMaker(m.key)} style={[styles.chip, active && styles.chipOn]}>
                <Text style={{ fontFamily: font.bold, fontSize: 15, color: active ? '#FFFFFF' : color.muted }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );

  const notice = (
    <View style={styles.notice}>
      <Icon name="megaphone" size={18} color="#5A4500" />
      <T style={{ flex: 1, fontSize: 14 }} tone="#5A4500">
        필요한 장비 제원이나 오류가 있으면 언제든 말씀해 주세요. <Text style={{ fontFamily: font.bold }}>하중표</Text> 표시가 있는 기종만 검토 계산에 쓸 수 있습니다.
      </T>
    </View>
  );

  if (kind === 'tower') {
    return (
      <View style={styles.body}>
        {header}
        <View style={[styles.card, { justifyContent: 'center' }]}>
          <T tone={color.muted}>이동타워 크레인 제원과 하중표는 준비 중입니다.</T>
        </View>
        {notice}
      </View>
    );
  }

  return (
    <FlatList
      data={list}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={header}
      ListFooterComponent={notice}
      contentContainerStyle={styles.body}
      renderItem={({ item }) => <Card e={item} />}
      initialNumToRender={16}
    />
  );
}

function Card({ e }: { e: CatalogEntry }) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${makerLabel(e.maker)} ${e.model} 상세`}
        onPress={() => router.push({ pathname: '/equipment/[id]', params: { id: e.id } })}
        style={({ pressed }) => [styles.card, pressed && { borderColor: color.yellow }]}
      >
        <View style={[styles.icon, !e.current && { opacity: 0.5 }]}>
          <CraneMark size={52} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: font.bold, fontSize: 19, color: color.charcoal }} numberOfLines={1}>
            {tonLabel(e.classTon)} / {e.model}
          </Text>
          <Text style={{ fontFamily: font.medium, fontSize: 14, color: color.muted }} numberOfLines={1}>
            {makerLabel(e.maker)} · {e.type}
            {e.current ? '' : ' · 단종'}
          </Text>
        </View>
        <Icon name="chevron" size={20} color={color.warm} />
      </Pressable>
      {e.chart ? (
        <View style={styles.badge}>
          <Text style={{ fontFamily: font.bold, fontSize: 11, color: color.charcoal }}>하중표</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  seg: { flex: 1, flexDirection: 'row', backgroundColor: '#EFEAE0', borderRadius: radius.lg, padding: 4 },
  segItem: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  segOn: { backgroundColor: color.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  chip: { height: 44, paddingHorizontal: 20, borderRadius: 22, borderWidth: 1, borderColor: color.line, backgroundColor: '#F4F1EA', justifyContent: 'center' },
  chipOn: { backgroundColor: color.charcoal, borderColor: color.charcoal },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.lg, minHeight: 88, paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line },
  icon: { width: 56, alignItems: 'center' },
  badge: { position: 'absolute', top: -7, left: 10, backgroundColor: color.yellow, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: color.charcoal },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', backgroundColor: '#FFF6D6', borderWidth: 1.5, borderColor: '#F2D46B', borderRadius: radius.lg, padding: space.md, marginTop: space.sm },
});
