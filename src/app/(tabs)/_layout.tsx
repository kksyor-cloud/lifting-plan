import { ComponentProps } from 'react';
import { router, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuButton } from '@/components/AppMenu';
import { Icon, IconName } from '@/components/Icon';
import { DEFAULT_INPUT } from '@/lib/calc';
import { useReview } from '@/lib/review-context';
import { color, font } from '@/theme';

// Bottom tab bar (Crane Fit layout): 홈 · 앱 소개 · FIT · 장비 제원표 · 계산 기록.
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon?: IconName }> = {
  index: { label: '홈', icon: 'home' },
  about: { label: '앱 소개', icon: 'info' },
  fit: { label: 'FIT' },
  equipment: { label: '장비 제원표', icon: 'sheet' },
  history: { label: '계산 기록', icon: 'history' },
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: color.surface },
        headerShadowVisible: true,
        headerTitleStyle: { fontFamily: font.bold, fontSize: 19, color: color.charcoal },
        headerTitleAlign: 'left',
        headerLeft: () => (
          <View style={{ marginLeft: 8 }}>
            <MenuButton />
          </View>
        ),
        sceneStyle: { backgroundColor: color.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ headerShown: false, title: '홈' }} />
      <Tabs.Screen name="about" options={{ title: '앱 소개' }} />
      <Tabs.Screen name="fit" options={{ title: 'FIT' }} />
      <Tabs.Screen name="equipment" options={{ title: '장비 제원표' }} />
      <Tabs.Screen name="history" options={{ title: '계산 기록' }} />
    </Tabs>
  );
}

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { reset } = useReview();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 6 }]}>
      {state.routes.map((r, i) => {
        const t = TABS[r.name];
        if (!t) return null;
        const active = state.index === i;
        if (r.name === 'fit') {
          return (
            <View key={r.key} style={styles.slot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="새 검토 시작"
                onPress={() => {
                  reset(DEFAULT_INPUT);
                  router.push('/review/input');
                }}
                style={({ pressed }) => [styles.fit, pressed && { transform: [{ scale: 0.96 }] }]}
              >
                <Text style={styles.fitText}>FIT</Text>
              </Pressable>
            </View>
          );
        }
        const tone = active ? color.yellowDeep : color.muted;
        return (
          <Pressable
            key={r.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
              if (!active && !e.defaultPrevented) navigation.navigate(r.name);
            }}
            style={styles.slot}
          >
            <Icon name={t.icon!} color={active ? '#E0A800' : color.muted} />
            <Text style={[styles.label, { color: tone, fontFamily: active ? font.bold : font.medium }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.line, paddingTop: 8 },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 12 },
  fit: { width: 64, height: 64, borderRadius: 32, marginTop: -26, backgroundColor: color.charcoal, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: color.yellow, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  fitText: { fontFamily: font.display, fontSize: 22, color: color.yellow, letterSpacing: 1 },
});
