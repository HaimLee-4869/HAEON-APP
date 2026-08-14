import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth-store';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  useEffect(() => { let cleanup: (() => void) | undefined; void bootstrap().then((dispose) => { cleanup = dispose; }); return () => cleanup?.(); }, [bootstrap]);
  return <SafeAreaProvider><QueryClientProvider client={queryClient}><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F6F7FA' } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="tide/[region]" options={{ animation: 'slide_from_right' }} /><Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} /><Stack.Screen name="login" options={{ presentation: 'modal' }} /></Stack></QueryClientProvider></SafeAreaProvider>;
}
