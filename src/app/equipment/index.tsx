import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Badge, T } from '@/components/ui';
import { BANDS, boomText, CATALOG, CatalogEntry, CatalogFilter, countWith, DEFAULT_FILTER, filterCatalog, MAKERS, makerLabel, tonLabel, TYPES } from '@/lib/catalog';
import { color, font, radius, space } from '@/theme';

export default function EquipmentList() {
  const [f, setF] = useState<CatalogFilter>(DEFAULT_FILTER);
  const set = (patch: Partial<CatalogFilter>) => setF((p) => ({ ...p, ...patch }));
  const list = useMemo(() => filterCatalog(CATALOG, f), [f]);
  const { width } = useWindowDimensions();
  const cols = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const header = (
    <View style={{ gap: space.sm, paddingBottom: space.md }}>
      <TextInput
        accessibilityLabel="모델명 검색"
        placeholder="모델명 검색 (예: GR-700, LTM, 3055)"
        placeholderTextColor={color.warm}
        value={f.query}
        onChangeText={(query) => set({ query })}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <ChipRow label="제조사">
        {[{ key: 'all' as const, label: '전체' }, ...MAKERS].map((m) => (
          <FChip key={m.key} label={m.label} n={countWith(CATALOG, f, 'maker', m.key)} active={f.maker === m.key} yellow onPress={() => set({ maker: m.key })} />
        ))}
      </ChipRow>
      <ChipRow label="형식">
        {TYPES.map((t) => (
          <FChip key={t.key} label={t.label} n={countWith(CATALOG, f, 'type', t.key)} active={f.type === t.key} onPress={() => set({ type: t.key })} />
        ))}
      </ChipRow>
      <ChipRow label="톤수">
        {BANDS.map((b) => (
          <FChip key={b.key} label={b.label} n={countWith(CATALOG, f, 'band', b.key)} active={f.band === b.key} onPress={() => set({ band: b.key })} />
        ))}
      </ChipRow>
      <View style={styles.toggles}>
        <Toggle label="단종 기종 포함" value={f.includeDiscontinued} onChange={(v) => set({ includeDiscontinued: v })} />
        <Toggle label="하중표 있음" value={f.chartOnly} onChange={(v) => set({ chartOnly: v })} />
        <T variant="mono" tone={color.muted} style={{ marginLeft: 'auto', fontSize: 12 }}>
          {list.length} / {CATALOG.length} 기종
        </T>
      </View>
    </View>
  );

  return (
    <FlatList
      key={cols}
      data={list}
      numColumns={cols}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={header}
      ListEmptyComponent={<T variant="caption" style={{ textAlign: 'center', padding: space.xxl }}>조건에 맞는 기종이 없습니다.</T>}
      columnWrapperStyle={{ gap: space.sm }}
      contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: space.xxl }}
      renderItem={({ item }) => <Tile e={item} />}
      initialNumToRender={24}
    />
  );
}

function Tile({ e }: { e: CatalogEntry }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${makerLabel(e.maker)} ${e.model} 상세`}
      onPress={() => router.push({ pathname: '/equipment/[id]', params: { id: e.id } })}
      style={({ pressed }) => [styles.tile, !e.current && styles.tileOld, pressed && { borderColor: color.yellow }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 }}>
        <T variant="display" style={[styles.ton, !e.current && { opacity: 0.55 }]}>{tonLabel(e.classTon)}</T>
        <T variant="label" tone={color.yellowDeep} style={{ fontSize: 10, letterSpacing: 1 }} numberOfLines={1}>
          {makerLabel(e.maker)}
        </T>
      </View>
      <T style={{ fontFamily: font.bold, fontSize: 15 }} numberOfLines={2}>
        {e.model}
      </T>
      <T variant="caption" numberOfLines={1}>
        {e.type} · {boomText(e.boom) ? `붐 ${boomText(e.boom)}` : '붐 미확인'}
      </T>
      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
        <Badge label={e.confidence} kind={e.confidence === '공식' ? 'yellow' : 'outline'} />
        {!e.current ? <Badge label="단종" kind="grey" /> : null}
        {e.chart ? <Badge label="하중표" kind="green" /> : null}
      </View>
    </Pressable>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <T variant="label" style={{ fontSize: 11 }}>
        {label}
      </T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {children}
      </ScrollView>
    </View>
  );
}

function FChip({ label, n, active, yellow, onPress }: { label: string; n: number; active: boolean; yellow?: boolean; onPress: () => void }) {
  const bg = active ? (yellow ? color.yellow : color.charcoal) : color.surface;
  const fg = active ? (yellow ? color.charcoal : color.yellow) : color.charcoal;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, { backgroundColor: bg, borderColor: active ? bg : color.line }]}>
      <T style={{ fontFamily: active ? font.bold : font.medium, fontSize: 13.5, color: fg }}>{label}</T>
      <T variant="mono" style={{ fontSize: 11, color: fg, opacity: 0.6 }}>
        {n}
      </T>
    </Pressable>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[styles.track, value && { backgroundColor: color.charcoal }]}>
        <View style={[styles.thumb, value && { transform: [{ translateX: 16 }], backgroundColor: color.yellow }]} />
      </View>
      <T style={{ fontSize: 14 }}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { fontFamily: font.body, fontSize: 15, color: color.charcoal, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingHorizontal: space.md, height: 44 },
  toggles: { flexDirection: 'row', alignItems: 'center', gap: space.lg, flexWrap: 'wrap', marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1 },
  tile: { flex: 1, minWidth: 0, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.md, gap: 3 },
  track: { width: 38, height: 22, borderRadius: 11, backgroundColor: color.line, padding: 3 },
  thumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: color.surface },
  tileOld: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  ton: { fontSize: 28, lineHeight: 32 },
});
