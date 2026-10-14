import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '@/components/ui';
import { CATALOG, Maker, MAKERS, tonLabel } from '@/lib/catalog';
import { CRANES, findCrane } from '@/lib/cranes';
import { color, font, radius, space } from '@/theme';

// Crane Fit style picker: type -> maker -> model.
// Only models with a load chart can be picked; the rest of the maker's catalog is listed greyed out.
const CHARTED = new Set(CRANES.map((c) => c.id));
const countFor = (m: Maker) => CRANES.filter((c) => c.maker === m).length;

export function CranePicker({ craneId, onSelect }: { craneId: string; onSelect: (id: string) => void }) {
  const crane = findCrane(craneId);
  const [maker, setMaker] = useState<Maker>((crane?.maker as Maker) ?? 'Tadano');
  const [open, setOpen] = useState(false);

  // Follow the crane when it changes elsewhere (UP/DN, comparison list).
  useEffect(() => {
    if (crane) setMaker(crane.maker as Maker);
  }, [crane?.id]);

  const models = useMemo(() => {
    const all = CATALOG.filter((e) => e.maker === maker).sort((a, b) => a.classTon - b.classTon || a.model.localeCompare(b.model));
    return [...all.filter((e) => CHARTED.has(e.id)), ...all.filter((e) => !CHARTED.has(e.id))];
  }, [maker]);
  const available = countFor(maker);
  const showingCurrent = crane?.maker === maker;

  return (
    <View style={styles.box}>
      <Row label="종류">
        <Seg label="이동식 크레인" active />
        <Seg label="이동타워 크레인" sub="준비 중" disabled />
      </Row>
      <Row label="제조사">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {MAKERS.map((m) => {
            const n = countFor(m.key);
            const active = m.key === maker;
            return (
              <Pressable
                key={m.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setMaker(m.key)}
                style={[styles.maker, active && { backgroundColor: color.charcoal, borderColor: color.charcoal }]}
              >
                <Text style={{ fontFamily: font.bold, fontSize: 13, color: active ? '#FFFFFF' : n ? color.charcoal : color.warm }}>{m.label}</Text>
                <Text style={{ fontFamily: font.mono, fontSize: 11, color: active ? color.yellow : color.muted }}>{n}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Row>
      <Row label="장비명">
        <Pressable accessibilityRole="button" accessibilityLabel="장비명 선택" onPress={() => setOpen(true)} style={styles.select}>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: font.bold, fontSize: 15, color: showingCurrent ? color.charcoal : color.warm }}>
            {showingCurrent && crane ? `${tonLabel(crane.classTon)} / ${crane.model}` : available ? '장비를 고르세요' : '하중표 등록 기종 없음'}
          </Text>
          <Text style={{ color: color.charcoal, fontSize: 14 }}>▼</Text>
        </Pressable>
      </Row>

      <ModelSheet
        open={open}
        title={`${MAKERS.find((m) => m.key === maker)?.label} 장비`}
        models={models}
        currentId={craneId}
        onClose={() => setOpen(false)}
        onPick={(id) => {
          onSelect(id);
          setOpen(false);
        }}
      />
    </View>
  );
}

function ModelSheet({
  open,
  title,
  models,
  currentId,
  onClose,
  onPick,
}: {
  open: boolean;
  title: string;
  models: typeof CATALOG;
  currentId: string;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const charted = models.filter((e) => CHARTED.has(e.id)).length;
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="닫기" style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
        <View style={styles.sheetHead}>
          <T style={{ fontFamily: font.bold, fontSize: 17 }}>{title}</T>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}>
            <T style={{ fontFamily: font.bold }}>닫기</T>
          </Pressable>
        </View>
        <T variant="caption" style={{ paddingHorizontal: space.lg }}>
          하중표가 등록된 {charted}개 기종만 검토에 쓸 수 있습니다. 회색 기종은 제원만 있습니다.
        </T>
        <FlatList
          data={models}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: space.lg, gap: space.sm }}
          renderItem={({ item, index }) => {
            const ok = CHARTED.has(item.id);
            const active = item.id === currentId;
            const header = index === charted && charted < models.length;
            return (
              <View style={{ gap: space.sm }}>
                {header ? <T variant="label" style={{ marginTop: space.md }}>하중표 준비 중</T> : null}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, disabled: !ok }}
                  disabled={!ok}
                  onPress={() => onPick(item.id)}
                  style={[styles.item, active && styles.itemActive, !ok && { opacity: 0.45 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: font.bold, fontSize: 16, color: color.charcoal }}>
                      {tonLabel(item.classTon)} / {item.model}
                    </Text>
                    <Text style={{ fontFamily: font.body, fontSize: 12, color: color.muted }}>
                      {item.type}
                      {item.current ? '' : ' · 단종'}
                    </Text>
                  </View>
                  {active ? <Text style={{ fontFamily: font.bold, color: color.yellowDeep }}>선택됨</Text> : null}
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <T style={{ width: 48, fontFamily: font.bold, color: color.muted }}>{label}</T>
      <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>{children}</View>
    </View>
  );
}

function Seg({ label, sub, active, disabled }: { label: string; sub?: string; active?: boolean; disabled?: boolean }) {
  return (
    <View accessibilityRole="button" accessibilityState={{ selected: !!active, disabled: !!disabled }} style={[styles.seg, active && { backgroundColor: color.yellow, borderColor: color.yellow }, disabled && { opacity: 0.5 }]}>
      <Text style={{ fontFamily: font.bold, fontSize: 13, color: color.charcoal }}>{label}</Text>
      {sub ? <Text style={{ fontFamily: font.body, fontSize: 10, color: color.muted }}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.md, gap: space.md },
  seg: { flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  maker: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  select: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, height: 46, paddingHorizontal: space.md, borderRadius: radius.sm, borderWidth: 1.5, borderColor: color.charcoal, backgroundColor: color.surface },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { maxHeight: '75%', backgroundColor: color.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.lg, paddingBottom: space.sm },
  item: { flexDirection: 'row', alignItems: 'center', padding: space.md, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.md },
  itemActive: { borderColor: color.charcoal, borderLeftWidth: 6, borderLeftColor: color.yellow },
});
