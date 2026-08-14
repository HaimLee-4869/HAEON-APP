import { supabase } from '../lib/supabase/client';
import { createAuthStore } from './auth-store-core';
export type { AuthState } from './auth-store-core';
export { createAuthStore } from './auth-store-core';
export const useAuthStore = createAuthStore(supabase);
