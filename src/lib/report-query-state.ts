import type { ReportPeriod } from '@/types/domain';

export function reportQueryEnabled(haenyeoId?: string, deviceId?: string) {
  return Boolean(haenyeoId && deviceId);
}

export function historicalQueryEnabled(period: ReportPeriod, haenyeoId?: string, deviceId?: string) {
  return period !== 'daily' && reportQueryEnabled(haenyeoId, deviceId);
}

export function blocksSubjectSelection(peoplePending: boolean) {
  return peoplePending;
}
