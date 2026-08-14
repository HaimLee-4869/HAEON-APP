import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
export interface AuthState { session: Session | null; initialized: boolean; loading: boolean; error: string | null; bootstrap: () => Promise<() => void>; signIn: (email: string, password: string) => Promise<boolean>; signOut: () => Promise<boolean> }
export function createAuthStore(authClient: SupabaseClient | null): UseBoundStore<StoreApi<AuthState>> {
  let dispose: (() => void) | null = null;
  return create<AuthState>((set) => ({ session: null, initialized: false, loading: false, error: null,
    bootstrap: async () => { if (dispose) return dispose; if (!authClient) { set({ initialized: true, error: 'Supabase 설정이 필요합니다.' }); return () => undefined; } try { const { data, error } = await authClient.auth.getSession(); if (error) throw error; set({ session: data.session, initialized: true, error: null }); } catch { set({ session: null, initialized: true, error: '로그인 상태를 확인하지 못했습니다.' }); } const { data } = authClient.auth.onAuthStateChange((_event: AuthChangeEvent, session) => set({ session, initialized: true, loading: false, error: null })); dispose = () => { data.subscription.unsubscribe(); dispose = null; }; return dispose; },
    signIn: async (email, password) => { if (!authClient) { set({ error: 'Supabase 설정이 필요합니다.' }); return false; } set({ loading: true, error: null }); const { data, error } = await authClient.auth.signInWithPassword({ email: email.trim(), password }); if (error) { set({ loading: false, error: '이메일 또는 비밀번호를 확인해 주세요.' }); return false; } set({ session: data.session, loading: false, error: null }); return true; },
    signOut: async () => { if (!authClient) { set({ session: null }); return true; } set({ loading: true, error: null }); const { error } = await authClient.auth.signOut(); if (error) { set({ loading: false, error: '로그아웃하지 못했습니다. 네트워크 연결을 확인해 주세요.' }); return false; } set({ session: null, loading: false }); return true; },
  }));
}
