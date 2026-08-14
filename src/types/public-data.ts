export type PublicDataService = 'weather-alert' | 'short-term-forecast' | 'wave-observation' | 'tidal-current' | 'tidal-observation' | 'tide-forecast' | 'ocean-buoy' | 'marine-forecast';
export type QueryValue = string | number | boolean | undefined;
export interface PublicDataParams { [key: string]: QueryValue }
export interface NormalizedPublicDataRecord { service: PublicDataService; observedAt: string | null; forecastAt: string | null; location: { id: string | null; name: string | null; coordinate: { latitude: number; longitude: number } | null }; values: Record<string, string | number | null>; raw: Record<string, unknown> }
export interface NormalizedPublicDataResponse { service: PublicDataService; items: NormalizedPublicDataRecord[]; page: { number: number | null; size: number | null; totalCount: number | null }; meta: { resultCode: string; resultMessage: string; format: 'json' | 'xml' } }
export type PublicDataResult = { status: 'success'; data: NormalizedPublicDataResponse } | { status: 'no_data'; data: null; message: string; service: PublicDataService };
export interface PublicDataHealth { status: string; services?: Record<string, unknown>; checkedAt?: string }
