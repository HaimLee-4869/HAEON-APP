import type { EnvironmentLayer, MapMarker, RiskZone } from '@/types/domain';
export interface MapDataAdapter { source: 'sample' | 'api'; getMarkers(): Promise<MapMarker[]> }

export const sampleMarkers: MapMarker[] = [
  { id: 'sample-user-1', kind: 'user', status: 'safe', latitude: 33.241, longitude: 126.562, label: '고미자', userName: '고미자', userCode: 'USR-001', region: '서귀포', lastCommunication: '샘플 데이터', source: 'sample' },
  { id: 'sample-user-2', kind: 'user', status: 'caution', latitude: 33.452, longitude: 126.911, label: '강춘자', userName: '강춘자', userCode: 'USR-002', region: '성산포', lastCommunication: '샘플 데이터', source: 'sample' },
  { id: 'sample-device-1', kind: 'device', status: 'warning', latitude: 33.231, longitude: 126.632, label: 'TW-102', deviceCode: 'TW-102', region: '서귀포', batteryPercent: 42, lastCommunication: '샘플 데이터', source: 'sample' },
  { id: 'sample-device-2', kind: 'disconnected', status: 'disconnected', latitude: 33.211, longitude: 126.932, label: 'TW-211', deviceCode: 'TW-211', region: '성산포', batteryPercent: 18, lastCommunication: '연결 끊김 · 샘플 데이터', source: 'sample' },
];
export const sampleRiskZones: RiskZone[] = [{ id: 'sample-risk-1', name: '샘플 위험구역', status: 'warning', coordinates: [
  { latitude: 33.215, longitude: 126.58 }, { latitude: 33.226, longitude: 126.61 }, { latitude: 33.204, longitude: 126.625 },
] }];
export const sampleMapDataAdapter: MapDataAdapter = { source: 'sample', async getMarkers() { return sampleMarkers; } };

export function markersForLayer(markers: MapMarker[], layer: EnvironmentLayer) {
  if (layer === 'haenyeo') return markers.filter((m) => m.kind === 'user');
  if (layer === 'taewak') return markers.filter((m) => m.kind === 'device' || m.kind === 'disconnected');
  if (layer === 'all') return markers;
  return [];
}
export function searchMarkers(markers: MapMarker[], query: string) {
  const term = query.trim().toLocaleLowerCase('ko-KR');
  if (!term) return [];
  return markers.filter((m) => [m.userName, m.userCode, m.deviceCode, m.region, m.label].some((v) => v?.toLocaleLowerCase('ko-KR').includes(term)));
}
