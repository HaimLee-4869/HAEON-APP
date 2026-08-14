import type { PublicDataResult, PublicDataService, NormalizedPublicDataRecord } from '@/types/public-data';
export type TideSnapshot = Partial<Record<PublicDataService, PublicDataResult>>;
export interface TideEvent { type: 'high' | 'low'; at: string | null; levelCm: number | null }
export interface TideDetail { high: TideEvent[]; low: TideEvent[]; tideLevelCm: number | null; waterTemperatureC: number | null; waveHeightM: number | null; wavePeriodSeconds: number | null; windSpeedMps: number | null; airTemperatureC: number | null; weather: string | null; weatherAlert: string | null; marineForecast: string | null; observedAt: string | null; hasErrors: boolean }
const num = (value: unknown) => { const n = Number(value); return value === null || value === '' || !Number.isFinite(n) ? null : n; };
const items = (result?: PublicDataResult) => result?.status === 'success' ? result.data.items : [];
const value = (record: NormalizedPublicDataRecord | undefined, ...keys: string[]) => { for (const key of keys) { const found = record?.values[key] ?? record?.raw[key]; if (found !== undefined && found !== null && found !== '') return found; } return null; };
const newest = (records: NormalizedPublicDataRecord[]) => [...records].sort((a, b) => Date.parse(b.observedAt ?? b.forecastAt ?? '') - Date.parse(a.observedAt ?? a.forecastAt ?? ''))[0];
function isLow(record: NormalizedPublicDataRecord) { const type = String(value(record, 'tideType', 'extrSe') ?? '').toLowerCase(); return type === '2' || type === '4' || type.includes('저') || type.includes('low'); }
function forecast(snapshot: TideSnapshot, category: string) { return newest(items(snapshot['short-term-forecast']).filter((r) => r.values.category === category)); }
export function composeTideDetail(snapshot: TideSnapshot): TideDetail {
  const tides = items(snapshot['tide-forecast']); const observation = newest(items(snapshot['tidal-observation']));
  const wave = newest(items(snapshot['wave-observation'])); const buoy = newest(items(snapshot['ocean-buoy']));
  const events = tides.map((r): TideEvent => ({ type: isLow(r) ? 'low' : 'high', at: r.forecastAt, levelCm: num(value(r, 'tideLevel', 'predcTdlvVl')) }));
  const pty = value(forecast(snapshot, 'PTY'), 'value'); const sky = value(forecast(snapshot, 'SKY'), 'value');
  return {
    high: events.filter((e) => e.type === 'high'), low: events.filter((e) => e.type === 'low'),
    tideLevelCm: num(value(observation, 'tideLevel', 'bscTdlvHgt')),
    waterTemperatureC: num(value(observation, 'waterTemperature', 'wtem')) ?? num(value(buoy, 'waterTemperature', 'wtem')),
    waveHeightM: num(value(wave, 'waveHeight', 'wvhgt')) ?? num(value(buoy, 'waveHeight', 'wvhgt')),
    wavePeriodSeconds: num(value(wave, 'wavePeriod', 'wvpd')) ?? num(value(buoy, 'wavePeriod', 'wvpd')),
    windSpeedMps: num(value(buoy, 'windSpeed', 'wspd')) ?? num(value(forecast(snapshot, 'WSD'), 'value')),
    airTemperatureC: num(value(buoy, 'airTemperature', 'artmp')) ?? num(value(forecast(snapshot, 'TMP'), 'value')),
    weather: pty !== null ? `강수형태 ${pty}` : sky !== null ? `하늘상태 ${sky}` : null,
    weatherAlert: String(value(newest(items(snapshot['weather-alert'])), 'title') ?? '') || null,
    marineForecast: String(value(newest(items(snapshot['marine-forecast'])), 'text') ?? '') || null,
    observedAt: buoy?.observedAt ?? observation?.observedAt ?? wave?.observedAt ?? null,
    hasErrors: Object.values(snapshot).some((result) => result?.status === 'error'),
  };
}
