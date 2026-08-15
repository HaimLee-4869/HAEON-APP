import type { RiskLevel } from '@/types/database';

export type RiskFactorCode = 'prolonged_inactivity' | 'danger_zone_entry' | 'communication_lost' | 'communication_delayed' | 'emergency_button' | 'low_battery' | 'abnormal_speed' | 'wave_advisory' | 'wave_warning' | 'strong_wind' | 'high_wave' | 'fast_current' | 'low_water_temperature' | 'heavy_precipitation' | 'compound_weather';
export interface RiskFactor { code: RiskFactorCode | string; category: string; score: number; description: string }
export interface RiskInput { assessedAt: string; lastMovementAt?: string | null; weatherAlert?: 'none' | 'wave_advisory' | 'wave_warning' | null; windSpeedMps?: number | null; maxWindSpeedMps?: number | null; waveHeightM?: number | null; maxWaveHeightM?: number | null; currentSpeedCms?: number | null; waterTemperatureC?: number | null; communicationStatus?: 'online' | 'offline' | 'maintenance' | 'unknown' | null; isInDangerZone?: boolean | null; precipitationMm?: number | null; precipitationProbability?: number | null; batteryLevel?: number | null; emergencyButton?: boolean | null; speedKmh?: number | null; communicationDelayMinutes?: number | null }
export interface RiskResult { score: number; level: RiskLevel; factors: RiskFactor[] }

export function getRiskLevel(score: number): RiskLevel { return score >= 70 ? 'danger' : score >= 45 ? 'warning' : score >= 20 ? 'caution' : 'safe'; }
const factor = (code: RiskFactorCode, category: string, score: number, description: string): RiskFactor => ({ code, category, score, description });
const highest = (...values: (number | null | undefined)[]) => { const valid = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)); return valid.length ? Math.max(...valid) : null; };

/** 기존 HAEON 웹 risk-engine의 현재 위험 규칙과 점수를 그대로 사용한다. */
export function calculateRisk(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = [];
  if (input.lastMovementAt) { const minutes = (Date.parse(input.assessedAt) - Date.parse(input.lastMovementAt)) / 60_000; if (Number.isFinite(minutes) && minutes >= 60) factors.push(factor('prolonged_inactivity', 'activity', 35, `마지막 움직임 이후 ${Math.floor(minutes)}분 경과`)); else if (Number.isFinite(minutes) && minutes >= 30) factors.push(factor('prolonged_inactivity', 'activity', 20, `마지막 움직임 이후 ${Math.floor(minutes)}분 경과`)); }
  if (input.isInDangerZone === true) factors.push(factor('danger_zone_entry', 'location', 30, '지정 위험구역 진입'));
  if (input.communicationStatus === 'offline') factors.push(factor('communication_lost', 'device', 20, '장치 통신 끊김'));
  else if (typeof input.communicationDelayMinutes === 'number' && input.communicationDelayMinutes >= 10) factors.push(factor('communication_delayed', 'device', input.communicationDelayMinutes >= 30 ? 20 : 10, `마지막 통신 후 ${Math.floor(input.communicationDelayMinutes)}분 경과`));
  if (input.emergencyButton === true) factors.push(factor('emergency_button', 'device', 60, '긴급 버튼 신호'));
  if (typeof input.batteryLevel === 'number' && input.batteryLevel <= 20) factors.push(factor('low_battery', 'device', input.batteryLevel <= 10 ? 20 : 10, `배터리 ${input.batteryLevel}%`));
  if (typeof input.speedKmh === 'number' && input.speedKmh >= 15) factors.push(factor('abnormal_speed', 'activity', 15, `비정상 이동속도 ${input.speedKmh.toFixed(1)}km/h`));
  const weather: RiskFactor[] = [];
  if (input.weatherAlert === 'wave_warning') weather.push(factor('wave_warning', 'weather', 45, '풍랑경보 발효'));
  else if (input.weatherAlert === 'wave_advisory') weather.push(factor('wave_advisory', 'weather', 25, '풍랑주의보 발효'));
  const wind = highest(input.windSpeedMps, input.maxWindSpeedMps); if (wind !== null && wind >= 10) weather.push(factor('strong_wind', 'weather', 25, `최대 풍속 ${wind.toFixed(1)}m/s`)); else if (wind !== null && wind >= 8) weather.push(factor('strong_wind', 'weather', 15, `최대 풍속 ${wind.toFixed(1)}m/s`));
  const wave = highest(input.waveHeightM, input.maxWaveHeightM); if (wave !== null && wave >= 2) weather.push(factor('high_wave', 'weather', 40, `최대 파고 ${wave.toFixed(1)}m`)); else if (wave !== null && wave >= 1.5) weather.push(factor('high_wave', 'weather', 25, `최대 파고 ${wave.toFixed(1)}m`));
  factors.push(...weather);
  if (typeof input.currentSpeedCms === 'number' && input.currentSpeedCms >= 50) factors.push(factor('fast_current', 'ocean', 20, `유속 ${input.currentSpeedCms.toFixed(0)}cm/s`));
  if (typeof input.waterTemperatureC === 'number' && input.waterTemperatureC <= 12) factors.push(factor('low_water_temperature', 'ocean', 20, `저수온 ${input.waterTemperatureC.toFixed(1)}℃`));
  if (typeof input.precipitationMm === 'number' && input.precipitationMm > 0) factors.push(factor('heavy_precipitation', 'weather', input.precipitationMm >= 10 ? 20 : input.precipitationMm >= 3 ? 10 : 5, `단기예보 강수 ${input.precipitationMm.toFixed(1)}mm`)); else if (typeof input.precipitationProbability === 'number' && input.precipitationProbability >= 70) factors.push(factor('heavy_precipitation', 'weather', 5, `단기예보 강수확률 ${input.precipitationProbability.toFixed(0)}%`));
  if (weather.length >= 2) factors.push(factor('compound_weather', 'weather', weather.length === 3 ? 25 : 15, `기상특보·풍속·파고 복합위험 ${weather.length}개`));
  const score = Math.min(100, factors.reduce((sum, item) => sum + item.score, 0)); return { score, level: getRiskLevel(score), factors };
}

export function parseStoredRiskFactors(value: unknown): RiskFactor[] {
  if (Array.isArray(value)) return value.flatMap((item) => item && typeof item === 'object' ? [{ code: String((item as Record<string, unknown>).code ?? 'unknown'), category: String((item as Record<string, unknown>).category ?? 'unknown'), score: Number((item as Record<string, unknown>).score ?? 0), description: String((item as Record<string, unknown>).description ?? (item as Record<string, unknown>).code ?? '위험요인') }] : []);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([code, raw]) => { if (!raw) return []; if (typeof raw === 'object' && raw) { const row = raw as Record<string, unknown>; return [{ code, category: String(row.category ?? 'unknown'), score: Number(row.score ?? 0), description: String(row.description ?? code) }]; } return [{ code, category: 'unknown', score: typeof raw === 'number' ? raw : 0, description: code }]; });
}
