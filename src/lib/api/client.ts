import type { NormalizedPublicDataResponse, PublicDataHealth, PublicDataParams, PublicDataResult, PublicDataService } from '@/types/public-data';
const API_BASE_URL = (process.env.EXPO_PUBLIC_HAEON_API_BASE_URL ?? '').replace(/\/$/, '');
export class ApiError extends Error { constructor(message: string, readonly status: number, readonly code?: string) { super(message); } }
async function request(path: string, params: PublicDataParams = {}) {
  if (!API_BASE_URL) throw new ApiError('EXPO_PUBLIC_HAEON_API_BASE_URL이 설정되지 않았습니다.', 0, 'CONFIGURATION');
  const query = Object.entries(params).filter((e): e is [string, string | number | boolean] => e[1] !== undefined).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
  const response = await fetch(`${API_BASE_URL}${path}${query ? `?${query}` : ''}`, { headers: { Accept: 'application/json' } });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body && typeof body === 'object' && 'error' in body ? (body as { error?: { message?: string; code?: string } }).error : undefined;
    throw new ApiError(error?.message ?? '공공데이터를 조회하지 못했습니다.', response.status, error?.code);
  }
  return body;
}
function latest(data: NormalizedPublicDataResponse) {
  return data.items.reduce<(typeof data.items)[number] | null>((chosen, item) => {
    if (!chosen) return item;
    return Date.parse(item.observedAt ?? item.forecastAt ?? '') > Date.parse(chosen.observedAt ?? chosen.forecastAt ?? '') ? item : chosen;
  }, null);
}
export function mapPublicDataResponse(service: PublicDataService, body: unknown): PublicDataResult {
  if (body && typeof body === 'object' && 'status' in body) {
    const envelope = body as { status?: string; data?: NormalizedPublicDataResponse | null; message?: string };
    if (envelope.status === 'no_data') return { status: 'no_data', data: null, latest: null, message: envelope.message ?? '데이터 없음', service };
    if (envelope.status === 'success' && envelope.data) return { status: 'success', data: envelope.data, latest: latest(envelope.data) };
  }
  const data = body as NormalizedPublicDataResponse;
  if (!data?.items?.length) return { status: 'no_data', data: null, latest: null, message: '데이터 없음', service };
  return { status: 'success', data, latest: latest(data) };
}
export async function getPublicData(service: PublicDataService, params: PublicDataParams = {}): Promise<PublicDataResult> {
  try { return mapPublicDataResponse(service, await request(`/api/public-data/${service}`, params)); }
  catch (error) { const e = error as ApiError; return { status: 'error', data: null, latest: null, message: e.message, service, code: e.code }; }
}
export const getPublicDataHealth = async () => await request('/api/public-data/health') as PublicDataHealth;
