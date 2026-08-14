import type { Alert } from '../types/database';
export function selectLatestBy<T>(items: readonly T[], key: (item: T) => string): T[] { const seen = new Set<string>(); return items.filter((item) => !seen.has(key(item)) && Boolean(seen.add(key(item)))); }
export function countAlerts(alerts: readonly Alert[]) { return { unacknowledged: alerts.filter((a) => a.status === 'open').length, unresolved: alerts.filter((a) => a.status !== 'resolved').length }; }
export const realtimeQueryNames = { device_locations: 'locations', risk_scores: 'risks', alerts: 'alerts', devices: 'devices' } as const;
