import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { alertRepository, deviceRepository, haenyeoRepository, locationRepository, organizationRepository, profileRepository, riskRepository, workSessionRepository } from '@/lib/repositories/repositories';
import { queryKeys } from '@/lib/query/keys';
import { toDataState } from '@/lib/repositories/errors';
import type { MonitoringSubject } from '@/types/database';
import { countAlerts } from '@/lib/data-utils';
import { blocksSubjectSelection } from '@/lib/report-query-state';

const options = { staleTime: 30_000, retry: 1 } as const;
export function useCurrentProfile() { const user = useAuthStore((s) => s.session?.user); const query = useQuery({ queryKey: queryKeys.access, queryFn: () => profileRepository.getCurrent(user!), enabled: Boolean(user), ...options }); return { ...query, state: toDataState({ data: query.data, isLoading: query.isLoading, error: query.error }, (v) => !v.profile) }; }
export function useCurrentOrganization() { const access = useCurrentProfile(); return { ...access, data: access.data?.primaryOrganization ?? null, role: access.data?.role ?? null, memberships: access.data?.memberships ?? [] }; }
export function useOrganizations() { return useQuery({ queryKey: queryKeys.organizations, queryFn: organizationRepository.list, ...options }); }
export function useHaenyeo() { return useQuery({ queryKey: queryKeys.haenyeo, queryFn: haenyeoRepository.list, ...options }); }
export function useDevices() { return useQuery({ queryKey: queryKeys.devices, queryFn: deviceRepository.list, ...options }); }
export function useLatestLocations() { return useQuery({ queryKey: queryKeys.locations, queryFn: locationRepository.latest, ...options }); }
export function useRiskScores() { return useQuery({ queryKey: queryKeys.risks, queryFn: riskRepository.latest, ...options }); }
export function useAlerts() { return useQuery({ queryKey: queryKeys.alerts, queryFn: alertRepository.list, ...options }); }
export function useWorkSessions() { return useQuery({ queryKey: queryKeys.sessions, queryFn: workSessionRepository.list, ...options }); }
export { countAlerts } from '@/lib/data-utils';
export function useAlertCounts() { const query = useAlerts(); return { ...query, counts: useMemo(() => countAlerts(query.data ?? []), [query.data]) }; }
export function useMonitoringSubjects() {
  const people = useHaenyeo(); const devices = useDevices(); const locations = useLatestLocations(); const risks = useRiskScores(); const alerts = useAlerts(); const sessions = useWorkSessions();
  const data = useMemo<MonitoringSubject[]>(() => (people.data ?? []).map((person) => { const device = (devices.data ?? []).find((v) => v.assigned_haenyeo_id === person.id) ?? null; return { haenyeo: person, device, latestLocation: (locations.data ?? []).find((v) => v.haenyeo_id === person.id) ?? null, latestRisk: (risks.data ?? []).find((v) => v.haenyeo_id === person.id) ?? null, batteryLevel: device?.battery_level ?? null, connectionStatus: device?.status ?? 'unassigned', lastCommunicatedAt: device?.last_communicated_at ?? null }; }), [people.data, devices.data, locations.data, risks.data]);
  // Only the people list is required to choose a subject. Auxiliary snapshot
  // queries must never keep the whole screen in its initial loading state.
  return {
    data,
    isLoading: blocksSubjectSelection(people.isLoading),
    isError: people.isError,
    completeness: { alerts: alerts.data ?? [], sessions: sessions.data ?? [], isPending: devices.isPending || locations.isPending || risks.isPending || alerts.isPending || sessions.isPending },
    auxiliary: { devices, locations, risks, alerts, sessions },
  };
}
