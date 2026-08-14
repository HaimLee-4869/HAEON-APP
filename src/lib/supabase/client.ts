import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);
const serverStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => undefined,
  removeItem: async (_key: string) => undefined,
};
const authStorage = typeof window === 'undefined' ? serverStorage : AsyncStorage;
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, publishableKey!, { auth: { storage: authStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }, realtime: { params: { eventsPerSecond: 10 } } })
  : null;
