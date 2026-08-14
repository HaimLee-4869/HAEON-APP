import { describe, expect, it } from 'vitest';
import { mapPublicDataResponse } from './client';
const response = { service: 'tidal-current' as const, items: [{ service: 'tidal-current' as const, observedAt: '2026-08-15T10:00:00+09:00', forecastAt: null, location: { id: 'HF_0041', name: null, coordinate: null }, values: { currentSpeed: 12 }, raw: {} }], page: { number: 1, size: 1, totalCount: 1 }, meta: { resultCode: '00', resultMessage: 'OK', format: 'json' as const } };
describe('public-data response mapping', () => {
  it('maps bare normalized responses and selects the recent value', () => expect(mapPublicDataResponse('tidal-current', response)).toMatchObject({ status: 'success', latest: { values: { currentSpeed: 12 } } }));
  it('maps the tidal-current no_data envelope as a normal result', () => expect(mapPublicDataResponse('tidal-current', { status: 'no_data', data: null, message: '없음' })).toEqual({ status: 'no_data', data: null, latest: null, message: '없음', service: 'tidal-current' }));
});
