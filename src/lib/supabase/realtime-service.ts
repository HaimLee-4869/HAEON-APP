import type { RealtimeChannel, RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import { queryClient } from '../query/client';
import { queryKeys } from '../query/keys';
import { supabase } from './client';

export type RealtimeState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'failed';
export type RealtimeTable = 'device_locations' | 'risk_scores' | 'alerts' | 'devices';
type Change = { table: RealtimeTable; eventType: string; id: string | null };
type Timer = ReturnType<typeof setTimeout>;
const TOPIC = 'haeon-mobile:authorized-monitoring';
const reportKey = ['safety-report'] as const;
const invalidations: Record<RealtimeTable, readonly (readonly unknown[])[]> = { device_locations: [queryKeys.locations, reportKey], risk_scores: [queryKeys.risks, reportKey], alerts: [queryKeys.alerts, reportKey], devices: [queryKeys.devices, reportKey] };
export function queriesForRealtimeChange(table: RealtimeTable) { return invalidations[table]; }

export class RealtimeService {
  private channel: RealtimeChannel | null = null;
  private owners = new Set<symbol>();
  private reconnect: Timer | null = null;
  private accessToken: string | null = null;
  private generation = 0;
  private operation: Promise<void> = Promise.resolve();
  private seen = new Set<string>();
  state: RealtimeState = 'idle';

  constructor(
    private readonly client: SupabaseClient | null = supabase,
    private readonly onChange = (change: Change) => { for (const key of queriesForRealtimeChange(change.table)) void queryClient.invalidateQueries({ queryKey: key }); },
  ) {}

  subscribe(accessToken: string) {
    const owner = Symbol();
    this.owners.add(owner);
    this.enqueue(() => this.ensureConnected(accessToken));
    return () => {
      if (!this.owners.delete(owner)) return;
      if (!this.owners.size) this.enqueue(() => this.stop());
    };
  }

  private enqueue(task: () => Promise<void>) {
    this.operation = this.operation.then(task, task);
    return this.operation;
  }

  private async ensureConnected(accessToken: string) {
    if (!this.client || !this.owners.size) return;
    if (this.channel && this.accessToken === accessToken) return;
    if (this.channel) await this.removeCurrentChannel();
    if (!this.owners.size) return;

    this.state = 'connecting';
    this.accessToken = accessToken;
    await this.client.realtime.setAuth(accessToken);
    if (!this.owners.size || this.accessToken !== accessToken) return;

    const generation = ++this.generation;
    let channel = this.client.channel(TOPIC);
    const bind = (event: 'INSERT' | 'UPDATE', table: RealtimeTable) => {
      channel = channel.on('postgres_changes', { event, schema: 'public', table }, (payload) => this.handle(table, payload));
    };
    bind('INSERT', 'device_locations');
    bind('INSERT', 'risk_scores');
    bind('INSERT', 'alerts');
    bind('UPDATE', 'alerts');
    bind('UPDATE', 'devices');
    this.channel = channel;
    channel.subscribe((status) => {
      if (this.channel !== channel || this.generation !== generation) return;
      if (status === 'SUBSCRIBED') this.state = 'live';
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') this.scheduleReconnect(channel, accessToken);
    });
  }

  private handle(table: RealtimeTable, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) {
    const row = (Object.keys(payload.new).length ? payload.new : payload.old) as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id : null;
    const key = `${table}:${payload.eventType}:${id ?? JSON.stringify(row)}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    if (this.seen.size > 500) this.seen.clear();
    this.onChange({ table, eventType: payload.eventType, id });
  }

  private scheduleReconnect(channel: RealtimeChannel, accessToken: string) {
    if (this.reconnect || !this.owners.size) return;
    this.state = 'reconnecting';
    this.reconnect = setTimeout(() => {
      this.reconnect = null;
      this.enqueue(async () => {
        if (this.channel !== channel || !this.owners.size) return;
        await this.removeCurrentChannel();
        await this.ensureConnected(accessToken);
      });
    }, 2000);
  }

  private async removeCurrentChannel() {
    const channel = this.channel;
    this.channel = null;
    this.generation++;
    if (channel && this.client) await this.client.removeChannel(channel);
  }

  private async stop() {
    if (this.reconnect) { clearTimeout(this.reconnect); this.reconnect = null; }
    this.accessToken = null;
    this.state = 'idle';
    await this.removeCurrentChannel();
  }
}

export const realtimeService = new RealtimeService();
