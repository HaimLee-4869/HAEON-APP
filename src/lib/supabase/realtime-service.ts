import type { RealtimeChannel, RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';
import { queryClient } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';

export type RealtimeState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'failed';
export type RealtimeTable = 'device_locations' | 'risk_scores' | 'alerts' | 'devices';
type Change = { table: RealtimeTable; eventType: string; id: string | null };
const invalidations: Record<RealtimeTable, readonly (readonly unknown[])[]> = { device_locations: [queryKeys.locations], risk_scores: [queryKeys.risks], alerts: [queryKeys.alerts], devices: [queryKeys.devices] };
export function queriesForRealtimeChange(table: RealtimeTable) { return invalidations[table]; }

class RealtimeService {
  private channel: RealtimeChannel | null = null; private owners = new Set<symbol>(); private reconnect: ReturnType<typeof setTimeout> | null = null; private seen = new Set<string>();
  state: RealtimeState = 'idle';
  constructor(private readonly client: SupabaseClient | null = supabase, private readonly onChange = (change: Change) => { for (const key of queriesForRealtimeChange(change.table)) void queryClient.invalidateQueries({ queryKey: key }); }) {}
  subscribe() { const owner = Symbol(); this.owners.add(owner); void this.connect(); return () => { this.owners.delete(owner); if (!this.owners.size) void this.stop(); }; }
  private async connect() {
    if (!this.client || this.channel || !this.owners.size) return;
    this.state = 'connecting'; const { data } = await this.client.auth.getSession(); if (!data.session) { this.state = 'failed'; return; }
    await this.client.realtime.setAuth(data.session.access_token);
    const channel = this.client.channel('haeon-mobile:authorized-monitoring');
    const bind = (event: 'INSERT' | 'UPDATE', table: RealtimeTable) => channel.on('postgres_changes', { event, schema: 'public', table }, (payload) => this.handle(table, payload));
    bind('INSERT', 'device_locations'); bind('INSERT', 'risk_scores'); bind('INSERT', 'alerts'); bind('UPDATE', 'alerts'); bind('UPDATE', 'devices');
    this.channel = channel; channel.subscribe((status) => { if (this.channel !== channel) return; if (status === 'SUBSCRIBED') this.state = 'live'; else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') this.scheduleReconnect(channel); });
  }
  private handle(table: RealtimeTable, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) { const row = (Object.keys(payload.new).length ? payload.new : payload.old) as Record<string, unknown>; const id = typeof row.id === 'string' ? row.id : null; const key = `${table}:${payload.eventType}:${id ?? JSON.stringify(row)}`; if (this.seen.has(key)) return; this.seen.add(key); if (this.seen.size > 500) this.seen.clear(); this.onChange({ table, eventType: payload.eventType, id }); }
  private scheduleReconnect(channel: RealtimeChannel) { if (this.reconnect || !this.owners.size) return; this.state = 'reconnecting'; this.reconnect = setTimeout(async () => { this.reconnect = null; if (this.channel === channel && this.client) { this.channel = null; await this.client.removeChannel(channel); await this.connect(); } }, 2000); }
  private async stop() { if (this.reconnect) { clearTimeout(this.reconnect); this.reconnect = null; } const channel = this.channel; this.channel = null; this.state = 'idle'; if (channel && this.client) await this.client.removeChannel(channel); }
}
export const realtimeService = new RealtimeService();
export { RealtimeService };
