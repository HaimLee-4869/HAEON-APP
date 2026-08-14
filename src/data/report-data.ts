import type { ReportPeriod, SafetyReport } from '@/types/domain';
const base = { risk: { safe: 18, caution: 64, warning: 14, danger: 4, representativeScore: 64, representativeLevel: '주의' }, activity: { workDuration: '4시간 32분', travelDistance: '12.6 km', averageDepth: '2.8 m', highestRisk: '71점' }, commentTitle: '작업 후반부에 위험도가 상승했습니다.', comment: '파고 상승과 이동속도 감소가 동시에 감지되었습니다. 조석 전환 시각 이전에 휴식을 확보하는 것이 좋습니다.', guides: [{ id: '1', text: '기상 악화 시 작업 시간을 평소보다 20% 단축해 주세요.' }, { id: '2', text: '위험구역 접근 전 태왁 통신 상태와 배터리를 확인해 주세요.' }, { id: '3', text: '장시간 동일 위치가 감지되면 보호자와 어촌계에 상태 확인 알림을 전송합니다.' }] };
export const sampleSafetyReports: Record<ReportPeriod, SafetyReport> = {
  daily: { period: 'daily', ...base }, weekly: { period: 'weekly', ...base, activity: { ...base.activity, workDuration: '24시간 10분', travelDistance: '68.4 km' } }, monthly: { period: 'monthly', ...base, activity: { ...base.activity, workDuration: '96시간 45분', travelDistance: '271.2 km' } },
};
