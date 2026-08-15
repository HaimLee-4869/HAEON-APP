import { describe, expect, it } from 'vitest';
import { mapUserDisplayName, markersForLayer, monitoringSubjectsToMarkers, searchMarkers } from './map-data';
import type { MonitoringSubject } from '@/types/database';

const subject = { haenyeo: { id: 'h1', display_name: '해온', user_code: 'AMA-0112', activity_region: '서귀포' }, device: { id: 'd1', device_code: 'TW-1', status: 'online', battery_level: 80 }, latestLocation: { latitude: 33.2, longitude: 126.5 }, latestRisk: { level: 'caution' }, batteryLevel: 80, connectionStatus: 'online', lastCommunicatedAt: '2026-01-01T00:00:00Z' } as MonitoringSubject;
describe('map monitoring data', () => {
  it('maps only subjects with an assigned device and real location', () => { const markers = monitoringSubjectsToMarkers([subject]); expect(markers).toHaveLength(1); expect(markers[0]).toMatchObject({ userCode: 'AMA-0112', deviceCode: 'TW-1', status: 'caution', source: 'supabase' }); });
  it('filters and searches marker fields', () => { const markers = monitoringSubjectsToMarkers([subject]); expect(markersForLayer(markers, 'haenyeo')).toHaveLength(1); expect(markersForLayer(markers, 'wave')).toEqual([]); expect(searchMarkers(markers, 'TW-1')).toHaveLength(1); });
  it('replaces only the development prefix used in map UI', () => { expect(mapUserDisplayName('가상 사용자 AMA-0112')).toBe('사용자 AMA-0112'); expect(mapUserDisplayName('실사용자 AMA-0112')).toBe('실사용자 AMA-0112'); });
});
