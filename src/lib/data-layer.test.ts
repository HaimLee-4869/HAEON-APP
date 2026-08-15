import { describe, expect, it, vi } from 'vitest';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createAuthStore } from '../stores/auth-store-core';
import { mapSupabaseError, toDataState } from './repositories/errors';
import { countAlerts, realtimeQueryNames, selectLatestBy } from './data-utils';
import type { Alert } from '../types/database';

describe('auth store', () => {
  it('restores a session and clears it on logout', async () => {
    const session = { access_token: 'redacted', user: { id: 'user-1' } } as Session;
    const unsubscribe = vi.fn();
    const auth = { getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }), onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe } } }), signOut: vi.fn().mockResolvedValue({ error: null }) };
    const store = createAuthStore({ auth } as unknown as SupabaseClient); const dispose = await store.getState().bootstrap();
    expect(store.getState().session).toBe(session); expect(store.getState().initialized).toBe(true);
    await store.getState().signOut(); expect(store.getState().session).toBeNull(); dispose(); expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

describe('repository and state mapping', () => {
  it('keeps the newest pre-sorted row per entity', () => expect(selectLatestBy([{ id: 'new', device: 'a' }, { id: 'old', device: 'a' }, { id: 'b', device: 'b' }], (v) => v.device).map((v) => v.id)).toEqual(['new', 'b']));
  it('maps permission and empty states without leaking backend messages', () => { const error = mapSupabaseError({ code: '42501', message: 'sensitive policy detail' }); expect(error.kind).toBe('permission_denied'); expect(error.message).not.toContain('sensitive'); expect(toDataState({ data: [], isLoading: false, error: null }, (v) => v.length === 0).status).toBe('empty'); });
});

describe('realtime invalidation and alert badge', () => {
  it('maps events to the matching query cache', () => { expect(realtimeQueryNames.device_locations).toBe('locations'); expect(realtimeQueryNames.alerts).toBe('alerts'); });
  it('counts open and unresolved alerts', () => { const alerts = ['open', 'acknowledged', 'responding', 'resolved'].map((status, i) => ({ id: `${i}`, status })) as Alert[]; expect(countAlerts(alerts)).toEqual({ unacknowledged: 1, unresolved: 3 }); });
});
