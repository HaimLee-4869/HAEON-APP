import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '../env';

const url = publicEnv.supabaseUrl;
const publishableKey = publicEnv.supabasePublishableKey;

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
