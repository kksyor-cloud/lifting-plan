import { BlackHanSans_400Regular } from '@expo-google-fonts/black-han-sans';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { IBMPlexSansKR_400Regular, IBMPlexSansKR_500Medium, IBMPlexSansKR_700Bold } from '@expo-google-fonts/ibm-plex-sans-kr';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ReviewProvider } from '@/lib/review-context';
import { color, font } from '@/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    BlackHanSans_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexSansKR_400Regular,
    IBMPlexSansKR_500Medium,
    IBMPlexSansKR_700Bold,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: color.yellow }} />;

  return (
    <ReviewProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.yellow },
          headerTintColor: color.charcoal,
          headerTitleStyle: { fontFamily: font.bold, fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: color.paper },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="review/input" options={{ title: '새 검토' }} />
        <Stack.Screen name="review/select" options={{ title: '장비 선택' }} />
        <Stack.Screen name="review/result" options={{ title: '검토 결과' }} />
        <Stack.Screen name="history" options={{ title: '검토 기록' }} />
        <Stack.Screen name="equipment/index" options={{ title: '장비 제원표' }} />
        <Stack.Screen name="equipment/[id]" options={{ title: '장비 상세' }} />
      </Stack>
    </ReviewProvider>
  );
}
