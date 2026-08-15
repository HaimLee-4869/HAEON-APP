import { useEffect } from 'react';
import { realtimeService } from '@/lib/supabase/realtime-service';
import { useAuthStore } from '@/stores/auth-store';
export function DataSessionProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.session?.access_token ?? null);
  useEffect(() => accessToken ? realtimeService.subscribe(accessToken) : undefined, [accessToken]);
  return children;
}
