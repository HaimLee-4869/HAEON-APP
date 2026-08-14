import { describe, expect, it } from 'vitest';
import { composeTideDetail, type TideSnapshot } from './compose-tide-detail';
const result = (service: 'tide-forecast' | 'tidal-observation', items: { values: Record<string, string | number>; forecastAt?: string | null; observedAt?: string | null }[]) => ({ status: 'success' as const, latest: null, data: { service, items: items.map((item) => ({ service, forecastAt: item.forecastAt ?? null, observedAt: item.observedAt ?? null, values: item.values, raw: {}, location: { id: null, name: null, coordinate: null } })), page: { number: null, size: null, totalCount: null }, meta: { resultCode: '00', resultMessage: 'OK', format: 'json' as const } } });
describe('tide detail composition', () => it('separates high/low and uses observed tide level', () => {
  const snapshot: TideSnapshot = { 'tide-forecast': result('tide-forecast', [{ forecastAt: '2026-08-15T08:00:00+09:00', values: { tideType: '고조', tideLevel: 245 } }, { forecastAt: '2026-08-15T14:00:00+09:00', values: { tideType: '저조', tideLevel: 53 } }]), 'tidal-observation': result('tidal-observation', [{ observedAt: '2026-08-15T10:00:00+09:00', values: { tideLevel: 132 } }]) };
  expect(composeTideDetail(snapshot)).toMatchObject({ high: [{ levelCm: 245 }], low: [{ levelCm: 53 }], tideLevelCm: 132 });
}));
