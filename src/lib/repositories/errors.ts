export type DataErrorKind = 'permission_denied' | 'network_error' | 'unauthenticated' | 'unknown';

export class DataError extends Error {
  constructor(public readonly kind: DataErrorKind, message: string, options?: { cause?: unknown }) { super(message, options); this.name = 'DataError'; }
}

export function mapSupabaseError(error: { code?: string; message?: string } | null): DataError {
  if (!error) return new DataError('unknown', '데이터를 불러오지 못했습니다.');
  if (error.code === '42501' || /permission|row-level security|not allowed/i.test(error.message ?? '')) return new DataError('permission_denied', '이 데이터에 접근할 권한이 없습니다.');
  if (/network|fetch|timeout|offline/i.test(error.message ?? '')) return new DataError('network_error', '네트워크 연결을 확인해 주세요.');
  if (/jwt|auth|session/i.test(error.message ?? '')) return new DataError('unauthenticated', '로그인이 필요합니다.');
  return new DataError('unknown', '데이터를 불러오지 못했습니다.');
}

export type DataState<T> = { status: 'loading'; data: undefined; error: null } | { status: 'empty'; data: T; error: null } | { status: 'permission_denied' | 'network_error' | 'error'; data: T | undefined; error: Error } | { status: 'success'; data: T; error: null };

export function toDataState<T>(input: { data: T | undefined; isLoading: boolean; error: Error | null }, isEmpty: (data: T) => boolean): DataState<T> {
  if (input.isLoading) return { status: 'loading', data: undefined, error: null };
  if (input.error) { const kind = input.error instanceof DataError ? input.error.kind : 'unknown'; return { status: kind === 'permission_denied' ? 'permission_denied' : kind === 'network_error' ? 'network_error' : 'error', data: input.data, error: input.error }; }
  if (input.data !== undefined && isEmpty(input.data)) return { status: 'empty', data: input.data, error: null };
  return { status: 'success', data: input.data as T, error: null };
}
