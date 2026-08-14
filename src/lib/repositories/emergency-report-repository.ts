import { supabase } from '../supabase/client';
import type { EmergencyReport, EmergencyReportStatus } from '../../types/domain';

export interface EmergencyReportRepository { create(report: EmergencyReport): Promise<EmergencyReport>; list(): Promise<EmergencyReport[]> }
export class EmergencyRepositoryError extends Error { constructor(message: string, public code: 'not_configured' | 'unauthenticated' | 'validation' | 'storage_unavailable' | 'database') { super(message); } }

export function validateEmergencyReport(report: EmergencyReport): string[] {
  const errors: string[] = [];
  if (report.latitude == null || report.longitude == null) errors.push('현재 위치가 필요합니다.');
  if (report.latitude != null && (report.latitude < -90 || report.latitude > 90)) errors.push('위도가 올바르지 않습니다.');
  if (report.longitude != null && (report.longitude < -180 || report.longitude > 180)) errors.push('경도가 올바르지 않습니다.');
  if (report.type === 'detailed' && !report.sharingConsent) errors.push('상세 신고에는 정보 공유 동의가 필요합니다.');
  if (report.description.length > 2000) errors.push('상황 설명은 2,000자 이하여야 합니다.');
  return errors;
}

export class SupabaseEmergencyReportRepository implements EmergencyReportRepository {
  async create(report: EmergencyReport): Promise<EmergencyReport> {
    const errors = validateEmergencyReport(report); if (errors.length) throw new EmergencyRepositoryError(errors[0]!, 'validation');
    if (!supabase) throw new EmergencyRepositoryError('신고 서버가 아직 설정되지 않았습니다.', 'not_configured');
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new EmergencyRepositoryError('로그인 후 신고할 수 있습니다.', 'unauthenticated');
    if (report.media.length) throw new EmergencyRepositoryError('미디어 저장소 정책이 아직 준비되지 않았습니다. 첨부를 삭제하고 다시 시도해 주세요.', 'storage_unavailable');
    const { data, error } = await supabase.from('emergency_reports').insert({
      reporter_id: auth.user.id, report_type: report.type, description: report.description || null,
      latitude: report.latitude, longitude: report.longitude, address: report.address,
      sharing_consent: report.sharingConsent,
    }).select().single();
    if (error) throw new EmergencyRepositoryError(`신고를 저장하지 못했습니다: ${error.message}`, 'database');
    return mapRow(data);
  }
  async list(): Promise<EmergencyReport[]> {
    if (!supabase) return [];
    const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return [];
    const { data, error } = await supabase.from('emergency_reports').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) throw new EmergencyRepositoryError(`신고 내역을 불러오지 못했습니다: ${error.message}`, 'database');
    return (data ?? []).map(mapRow);
  }
}
function mapRow(row: Record<string, unknown>): EmergencyReport { return { id: String(row.id), type: row.report_type as EmergencyReport['type'], description: String(row.description ?? ''), latitude: Number(row.latitude), longitude: Number(row.longitude), address: row.address ? String(row.address) : null, media: [], sharingConsent: Boolean(row.sharing_consent), status: row.status as EmergencyReportStatus, createdAt: String(row.created_at) }; }
export const emergencyReportRepository = new SupabaseEmergencyReportRepository();
