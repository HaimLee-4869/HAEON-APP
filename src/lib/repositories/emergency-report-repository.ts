import type { EmergencyReport } from '@/types/domain';
export interface EmergencyReportRepository { create(report: EmergencyReport): Promise<EmergencyReport>; list(): Promise<EmergencyReport[]> }
export class PendingEmergencyReportRepository implements EmergencyReportRepository {
  async create(): Promise<EmergencyReport> { throw new Error('신고 서버 연결은 다음 단계에서 활성화됩니다.'); }
  async list(): Promise<EmergencyReport[]> { return []; }
}
