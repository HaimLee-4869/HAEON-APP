import type { PublicDataHealth, PublicDataParams, PublicDataResult, PublicDataService } from '@/types/public-data';

const API_BASE_URL = (process.env.EXPO_PUBLIC_HAEON_API_BASE_URL ?? 'https://haeon-safe.vercel.app').replace(/\/$/, '');

export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }

async function request<T>(path: string, params: PublicDataParams = {}): Promise<T> {
  const query = Object.entries(params).filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
  const response = await fetch(`${API_BASE_URL}${path}${query ? `?${query}` : ''}`, { headers: { Accept: 'application/json' } });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'error' in body ? JSON.stringify((body as { error: unknown }).error) : '공공데이터를 조회하지 못했습니다.';
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export async function getPublicData(service: PublicDataService, params: PublicDataParams = {}): Promise<PublicDataResult> {
  const result = await request<PublicDataResult | PublicDataResult['data']>(`/api/public-data/${service}`, params);
  if (result && typeof result === 'object' && 'status' in result) return result as PublicDataResult;
  return { status: 'success', data: result as NonNullable<PublicDataResult['data']> };
}
export const getPublicDataHealth = () => request<PublicDataHealth>('/api/public-data/health');
