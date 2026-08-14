import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/lib/query/client';
import { DataSessionProvider } from '@/components/data-session-provider';
import { colors } from '@/constants/theme';

function AuthenticatedApp() {
  const bootstrap = useAuthStore((state) => state.bootstrap); const initialized = useAuthStore((state) => state.initialized); const session = useAuthStore((state) => state.session); const segments = useSegments();
  useEffect(() => { let cleanup: (() => void) | undefined; let mounted = true; void bootstrap().then((value) => { if (mounted) cleanup = value; else value(); }); return () => { mounted = false; cleanup?.(); }; }, [bootstrap]);
  useEffect(() => { if (!initialized) return; const onLogin = segments[0] === 'login'; if (!session && !onLogin) router.replace('/login'); else if (session && onLogin) router.replace('/(tabs)'); }, [initialized, session, segments]);
  if (!initialized) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  return <DataSessionProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F6F7FA' } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} /><Stack.Screen name="login" options={{ animation: 'fade' }} /></Stack></DataSessionProvider>;
}
export default function RootLayout() { return <SafeAreaProvider><QueryClientProvider client={queryClient}><AuthenticatedApp /></QueryClientProvider></SafeAreaProvider>; }
