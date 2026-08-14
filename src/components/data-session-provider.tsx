import { useEffect } from 'react';
import { realtimeService } from '@/lib/supabase/realtime-service';
import { useAuthStore } from '@/stores/auth-store';
export function DataSessionProvider({ children }: { children: React.ReactNode }) { const session = useAuthStore((s) => s.session); useEffect(() => session ? realtimeService.subscribe() : undefined, [session]); return children; }
