import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
interface AuthState { session: Session | null; initialized: boolean; bootstrap: () => Promise<() => void>; signOut: () => Promise<void> }
export const useAuthStore = create<AuthState>((set) => ({ session: null, initialized: false, bootstrap: async () => { if (!supabase) { set({ initialized: true }); return () => undefined; } const { data } = await supabase.auth.getSession(); set({ session: data.session, initialized: true }); const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => set({ session })); return () => subscription.subscription.unsubscribe(); }, signOut: async () => { if (supabase) await supabase.auth.signOut(); set({ session: null }); } }));
