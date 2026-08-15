import type { MonitoringSubject } from '@/types/database';
import type { EnvironmentLayer, MapMarker, RiskZone } from '@/types/domain';

/** DB 위험구역 테이블 도입 전까지 앱에서 관리하는 사전 지정 작업주의구역. */
export const designatedRiskZones: RiskZone[] = [{
  id: 'seogwipo-work-caution-1',
  name: '서귀포 작업주의구역',
  status: 'warning',
  coordinates: [
    { latitude: 33.215, longitude: 126.58 },
    { latitude: 33.226, longitude: 126.61 },
    { latitude: 33.204, longitude: 126.625 },
  ],
}];

export function monitoringSubjectsToMarkers(subjects: MonitoringSubject[]): MapMarker[] {
  return subjects.flatMap(({ haenyeo, device, latestLocation, latestRisk, batteryLevel, connectionStatus, lastCommunicatedAt }) => {
    if (!device || !latestLocation || !Number.isFinite(latestLocation.latitude) || !Number.isFinite(latestLocation.longitude)) return [];
    const disconnected = connectionStatus === 'offline';
    return [{
      id: haenyeo.id,
      kind: disconnected ? 'disconnected' : 'user',
      subject: 'haenyeo',
      status: disconnected ? 'disconnected' : (latestRisk?.level ?? 'safe'),
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      label: haenyeo.display_name || haenyeo.user_code,
      userName: haenyeo.display_name,
      userCode: haenyeo.user_code,
      deviceCode: device.device_code,
      region: haenyeo.activity_region,
      batteryPercent: batteryLevel ?? undefined,
      lastCommunication: lastCommunicatedAt ? new Date(lastCommunicatedAt).toLocaleString('ko-KR') : '통신 기록 없음',
      source: 'supabase',
    }];
  });
}

export function markersForLayer(markers: MapMarker[], layer: EnvironmentLayer) {
  if (layer === 'haenyeo') return markers;
  if (layer === 'taewak') return markers.filter((marker) => Boolean(marker.deviceCode));
  if (layer === 'all') return markers;
  return [];
}

export function searchMarkers(markers: MapMarker[], query: string) {
  const term = query.trim().toLocaleLowerCase('ko-KR');
  if (!term) return [];
  return markers.filter((marker) => [marker.userName, marker.userCode, marker.deviceCode, marker.region, marker.label]
    .some((value) => value?.toLocaleLowerCase('ko-KR').includes(term)));
}
