import { supabase } from '../lib/supabase/client';
import type { ReportPeriod, SafetyGuide, SafetyReport } from '../types/domain';

export interface WorkSessionRow { started_at: string; ended_at: string | null }
export interface LocationRow { latitude: number; longitude: number; measured_at: string }
export interface RiskRow { score: number; level: 'safe' | 'caution' | 'warning' | 'danger'; factors?: Record<string, unknown> | null }
export interface SafetyReportDataset { sessions: WorkSessionRow[]; locations: LocationRow[]; risks: RiskRow[]; alerts: { id: string }[] }
export type RiskFactor = 'highWave' | 'lowTemperature' | 'longSession' | 'dangerZone' | 'manyAlerts' | 'risingRisk';
export interface SafetyGuideContext { factors: RiskFactor[]; report: SafetyReport }
export interface SafetyInsightGenerator { generate(report: SafetyReport, factors: RiskFactor[]): { title: string; comment: string } }
export interface SafetyGuideProvider { getSafetyGuide(context: SafetyGuideContext): SafetyGuide[] }
export interface SafetyReportService { getSafetyReport(period: ReportPeriod): Promise<SafetyReport> }

const labels = { safe: '안전', caution: '주의', warning: '경고', danger: '위험' } as const;
export function periodStart(period: ReportPeriod, now = new Date()) { const result = new Date(now); if (period === 'daily') result.setHours(0, 0, 0, 0); else if (period === 'weekly') result.setDate(result.getDate() - 7); else result.setMonth(result.getMonth() - 1); return result; }
const durationText = (minutes: number) => minutes ? `${Math.floor(minutes / 60)}시간 ${Math.round(minutes % 60)}분` : '데이터 없음';
const kmText = (km: number) => km ? `${km.toFixed(1)} km` : '데이터 없음';
function distance(a: LocationRow, b: LocationRow) { const rad = Math.PI / 180; const dLat = (b.latitude - a.latitude) * rad; const dLon = (b.longitude - a.longitude) * rad; const q = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)); }

export function aggregateSafetyReport(period: ReportPeriod, data: SafetyReportDataset, insight = new RuleBasedSafetyInsightGenerator(), guide = new RuleBasedSafetyGuideProvider()): SafetyReport {
  const minutes = data.sessions.reduce((sum, row) => sum + (new Date(row.ended_at ?? Date.now()).getTime() - new Date(row.started_at).getTime()) / 60000, 0);
  const sortedLocations = [...data.locations].sort((a, b) => Date.parse(a.measured_at) - Date.parse(b.measured_at));
  const kilometers = sortedLocations.slice(1).reduce((sum, row, index) => sum + distance(sortedLocations[index]!, row), 0);
  const counts = { safe: 0, caution: 0, warning: 0, danger: 0 }; data.risks.forEach((row) => counts[row.level]++); const total = data.risks.length;
  const percentages = Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, total ? Math.round(value / total * 100) : 0])) as typeof counts;
  const highest = total ? Math.max(...data.risks.map((row) => row.score)) : null; const average = total ? Math.round(data.risks.reduce((sum, row) => sum + row.score, 0) / total) : null;
  const representativeLevel = total ? data.risks.reduce((max, row) => row.score > max.score ? row : max).level : null;
  const factorBag = data.risks.flatMap((row) => Object.entries(row.factors ?? {}).filter(([, value]) => Boolean(value)).map(([key]) => key));
  const factors: RiskFactor[] = [];
  if (factorBag.some((key) => /wave|파고/i.test(key))) factors.push('highWave'); if (factorBag.some((key) => /temperature|수온/i.test(key))) factors.push('lowTemperature'); if (factorBag.some((key) => /zone|구역/i.test(key))) factors.push('dangerZone');
  if (minutes >= 240) factors.push('longSession'); if (data.alerts.length >= 3) factors.push('manyAlerts'); if (data.risks.length >= 2 && data.risks.at(-1)!.score > data.risks[0]!.score + 10) factors.push('risingRisk');
  const report: SafetyReport = { period, hasData: Boolean(data.sessions.length || data.locations.length || data.risks.length || data.alerts.length), risk: { ...percentages, representativeScore: average, representativeLevel: representativeLevel ? labels[representativeLevel] : '데이터 없음' }, activity: { workDuration: durationText(minutes), travelDistance: kmText(kilometers), averageDepth: '데이터 없음', highestRisk: highest == null ? '데이터 없음' : `${highest}점`, averageRisk: average == null ? '데이터 없음' : `${average}점`, alertCount: `${data.alerts.length}건`, locationActivity: `${data.locations.length}건` }, commentTitle: '', comment: '', guides: [] };
  Object.assign(report, insight.generate(report, factors)); report.guides = guide.getSafetyGuide({ report, factors }); return report;
}

export class RuleBasedSafetyInsightGenerator implements SafetyInsightGenerator { generate(report: SafetyReport, factors: RiskFactor[]) { if (!report.hasData) return { title: '분석할 데이터가 없습니다.', comment: '선택한 기간에 작업, 위치, 위험도 또는 알림 데이터가 수집되면 정량 분석이 제공됩니다.' }; const messages: string[] = []; if (factors.includes('risingRisk')) messages.push('위험 점수가 기간 초보다 상승했습니다.'); if (factors.includes('manyAlerts')) messages.push(`경고 알림이 ${report.activity.alertCount} 발생했습니다.`); if (factors.includes('longSession')) messages.push('장시간 작업이 감지되어 충분한 휴식이 필요합니다.'); if (!messages.length) messages.push('수집된 지표에서 급격한 위험 변화는 확인되지 않았습니다.'); return { title: report.risk.representativeScore != null ? `평균 위험도 ${report.risk.representativeScore}점 · ${report.risk.representativeLevel}` : '활동 데이터 요약', comment: messages.join(' ') }; } }
export class RuleBasedSafetyGuideProvider implements SafetyGuideProvider { getSafetyGuide({ factors }: SafetyGuideContext) { const rules: Record<RiskFactor, string> = { highWave: '파고가 높을 때는 입수하지 말고, 이미 작업 중이면 가장 가까운 안전 지점으로 이동하세요.', lowTemperature: '저수온 노출 시간을 줄이고 보온 장비와 저체온 초기 증상을 확인하세요.', longSession: '연속 작업을 중단하고 휴식·수분 보충 후 컨디션을 다시 확인하세요.', dangerZone: '위험구역에서 즉시 이탈하고 보호자 또는 공동 대응 기관에 현재 위치를 공유하세요.', manyAlerts: '반복 경고의 원인을 확인하고 장비 통신·배터리 상태를 점검하세요.', risingRisk: '위험도 상승 추세가 이어지면 작업을 조기 종료하고 안전한 복귀 경로를 선택하세요.' }; const selected = factors.length ? [...new Set(factors)] : []; return selected.slice(0, 4).map((factor, i) => ({ id: `${factor}-${i}`, text: rules[factor], source: 'HAEON deterministic safety rule', reference: factor })); } }

export class SupabaseSafetyReportService implements SafetyReportService { async getSafetyReport(period: ReportPeriod) { if (!supabase) return aggregateSafetyReport(period, { sessions: [], locations: [], risks: [], alerts: [] }); const from = periodStart(period).toISOString(); const [sessions, locations, risks, alerts] = await Promise.all([supabase.from('work_sessions').select('started_at,ended_at').gte('started_at', from), supabase.from('device_locations').select('latitude,longitude,measured_at').gte('measured_at', from).order('measured_at'), supabase.from('risk_scores').select('score,level,factors,calculated_at').gte('calculated_at', from).order('calculated_at'), supabase.from('alerts').select('id').gte('occurred_at', from)]); const error = sessions.error ?? locations.error ?? risks.error ?? alerts.error; if (error) throw new Error(`안전 리포트 데이터를 불러오지 못했습니다: ${error.message}`); return aggregateSafetyReport(period, { sessions: sessions.data ?? [], locations: locations.data ?? [], risks: (risks.data ?? []) as RiskRow[], alerts: alerts.data ?? [] }); } }
export const safetyReportService = new SupabaseSafetyReportService();
