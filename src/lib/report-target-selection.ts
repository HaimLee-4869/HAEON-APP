import type { Alert, MonitoringSubject, WorkSession } from '@/types/database';

export interface ReportTargetSelectionData {
  subjects: MonitoringSubject[];
  alerts: Alert[];
  sessions: WorkSession[];
}

const RECENT_DAYS = 30;

function isRecent(value: string | null | undefined, now: Date) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp >= now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000;
}

export function reportTargetCompleteness(
  subject: MonitoringSubject,
  alerts: Alert[],
  sessions: WorkSession[],
  now = new Date(),
) {
  const hasRecentRisk = isRecent(subject.latestRisk?.calculated_at, now);
  const hasRecentAlert = alerts.some((alert) => alert.haenyeo_id === subject.haenyeo.id && isRecent(alert.occurred_at, now));
  const hasRecentActivity = sessions.some((session) => session.haenyeo_id === subject.haenyeo.id && isRecent(session.started_at, now));

  return (subject.latestRisk ? 4 : 0)
    + (subject.latestLocation ? 3 : 0)
    + (hasRecentRisk ? 2 : 0)
    + (hasRecentAlert || hasRecentActivity ? 1 : 0)
    + (subject.device?.status === 'online' ? 1 : 0);
}

export function selectDefaultReportTarget(
  { subjects, alerts, sessions }: ReportTargetSelectionData,
  now = new Date(),
  demoDefaultHaenyeoCode?: string,
) {
  const normalizedDemoCode = demoDefaultHaenyeoCode?.trim();
  if (normalizedDemoCode) {
    const demoTarget = subjects.find((subject) => subject.haenyeo.user_code === normalizedDemoCode);
    if (demoTarget) return demoTarget;
  }

  if (subjects.length <= 1) return subjects[0];

  return subjects.reduce((best, candidate) => {
    const bestScore = reportTargetCompleteness(best, alerts, sessions, now);
    const candidateScore = reportTargetCompleteness(candidate, alerts, sessions, now);
    if (candidateScore !== bestScore) return candidateScore > bestScore ? candidate : best;

    const bestCommunication = Date.parse(best.lastCommunicatedAt ?? '') || 0;
    const candidateCommunication = Date.parse(candidate.lastCommunicatedAt ?? '') || 0;
    return candidateCommunication > bestCommunication ? candidate : best;
  });
}
