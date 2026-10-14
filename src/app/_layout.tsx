import { BlackHanSans_400Regular } from '@expo-google-fonts/black-han-sans';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { IBMPlexSansKR_400Regular, IBMPlexSansKR_500Medium, IBMPlexSansKR_700Bold } from '@expo-google-fonts/ibm-plex-sans-kr';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ReviewHeader } from '@/components/ReviewHeader';
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="review/input" options={{ header: () => <ReviewHeader step={0} /> }} />
        <Stack.Screen name="review/settings" options={{ header: () => <ReviewHeader step={1} /> }} />
        <Stack.Screen name="review/result" options={{ header: () => <ReviewHeader step={2} /> }} />
        <Stack.Screen name="equipment/[id]" options={{ title: '장비 상세', headerStyle: { backgroundColor: color.surface } }} />
      </Stack>
    </ReviewProvider>
  );
}
