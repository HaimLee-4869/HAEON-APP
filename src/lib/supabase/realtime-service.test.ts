import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { queriesForRealtimeChange, RealtimeService } from './realtime-service';
vi.mock('../query/client', () => ({ queryClient: { invalidateQueries: vi.fn() } }));
vi.mock('./client', () => ({ supabase: null }));

const settle = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };

function fakeClient() {
  const channels: { bindings: number; subscribed: boolean; callback?: (status: string) => void }[] = [];
  const removeChannel = vi.fn(async () => 'ok');
  const setAuth = vi.fn(async () => undefined);
  const channel = vi.fn(() => {
    const state = { bindings: 0, subscribed: false, callback: undefined as ((status: string) => void) | undefined };
    channels.push(state);
    const instance = {
      on: vi.fn(() => { if (state.subscribed) throw new Error('on after subscribe'); state.bindings++; return instance; }),
      subscribe: vi.fn((callback: (status: string) => void) => { state.subscribed = true; state.callback = callback; return instance; }),
    };
    return instance;
  });
  return { client: { channel, removeChannel, realtime: { setAuth } } as unknown as SupabaseClient, channels, channel, removeChannel, setAuth };
}

describe('RealtimeService lifecycle', () => {
  it('invalidates the report once from the matching realtime event path', () => {
    for (const table of ['risk_scores', 'device_locations', 'alerts', 'devices'] as const) {
      const keys = queriesForRealtimeChange(table);
      expect(keys.filter((key) => key[0] === 'safety-report')).toHaveLength(1);
    }
  });
  it('reuses one fully-bound channel for repeated subscriptions', async () => {
    const fake = fakeClient(); const service = new RealtimeService(fake.client, vi.fn());
    const first = service.subscribe('token-a'); const second = service.subscribe('token-a'); await settle();
    expect(fake.channel).toHaveBeenCalledOnce(); expect(fake.channels[0]).toMatchObject({ bindings: 5, subscribed: true });
    first(); await settle(); expect(fake.removeChannel).not.toHaveBeenCalled();
    second(); await settle(); expect(fake.removeChannel).toHaveBeenCalledOnce();
  });

  it('removes and rebuilds the channel when the JWT changes', async () => {
    const fake = fakeClient(); const service = new RealtimeService(fake.client, vi.fn());
    const first = service.subscribe('token-a'); await settle();
    const second = service.subscribe('token-b'); await settle();
    expect(fake.removeChannel).toHaveBeenCalledOnce(); expect(fake.channel).toHaveBeenCalledTimes(2);
    expect(fake.channels.every((item) => item.bindings === 5 && item.subscribed)).toBe(true);
    first(); second(); await settle();
  });

  it('disconnects and reconnects without binding after subscribe', async () => {
    const fake = fakeClient(); const service = new RealtimeService(fake.client, vi.fn());
    const disconnect = service.subscribe('token-a'); await settle(); disconnect(); await settle();
    const disconnectAgain = service.subscribe('token-a'); await settle();
    expect(fake.channel).toHaveBeenCalledTimes(2); expect(fake.channels.every((item) => item.bindings === 5)).toBe(true);
    disconnectAgain(); await settle();
  });
});
