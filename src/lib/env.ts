export const publicEnv = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  apiBaseUrl: (process.env.EXPO_PUBLIC_HAEON_API_BASE_URL ?? '').replace(/\/$/, ''),
  kakaoJavaScriptKey: process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY ?? '',
  kakaoBridgeUrl: process.env.EXPO_PUBLIC_KAKAO_MAP_BRIDGE_URL ?? '',
} as const;

export type PublicEnvName = 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY' | 'EXPO_PUBLIC_HAEON_API_BASE_URL' | 'EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY' | 'EXPO_PUBLIC_KAKAO_MAP_BRIDGE_URL';
export interface PublicEnvStatus { requiredMissing: PublicEnvName[]; kakaoMissing: PublicEnvName[]; isCoreConfigured: boolean; isKakaoConfigured: boolean }

export function validatePublicEnv(): PublicEnvStatus {
  const requiredMissing: PublicEnvName[] = [];
  const kakaoMissing: PublicEnvName[] = [];
  if (!publicEnv.supabaseUrl) requiredMissing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!publicEnv.supabasePublishableKey) requiredMissing.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  if (!publicEnv.apiBaseUrl) requiredMissing.push('EXPO_PUBLIC_HAEON_API_BASE_URL');
  if (!publicEnv.kakaoJavaScriptKey) kakaoMissing.push('EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY');
  if (!publicEnv.kakaoBridgeUrl) kakaoMissing.push('EXPO_PUBLIC_KAKAO_MAP_BRIDGE_URL');
  return { requiredMissing, kakaoMissing, isCoreConfigured: requiredMissing.length === 0, isKakaoConfigured: kakaoMissing.length === 0 };
}
