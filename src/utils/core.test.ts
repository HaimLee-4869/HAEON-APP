import { describe, expect, it, vi } from 'vitest';
import { validateEmergencyReport } from '../lib/repositories/emergency-report-repository';
import { cartSubtotal } from '../stores/cart-store';
import { formatCoordinates, formatKoreanAddress } from './location';
import { getSosCountdown, isSosHoldComplete } from './sos-long-press';

vi.mock('../lib/supabase/client', () => ({ supabase: null }));
describe('SOS hold', () => { it('counts down and completes only at 3 seconds', () => { expect(getSosCountdown(0)).toBe(3); expect(getSosCountdown(1100)).toBe(2); expect(isSosHoldComplete(2999)).toBe(false); expect(isSosHoldComplete(3000)).toBe(true); }); it('cancels an early release', () => expect(isSosHoldComplete(1200)).toBe(false)); });
describe('location formatter', () => { it('combines divisions', () => expect(formatKoreanAddress({ region: '제주특별자치도', city: '서귀포시', subregion: null, district: '성산읍', name: null })).toBe('제주특별자치도 서귀포시 성산읍')); it('formats fallback', () => expect(formatCoordinates(33.12, 126.5)).toBe('33.12000, 126.50000')); });
describe('report validation', () => { it('requires location and consent', () => expect(validateEmergencyReport({ type: 'detailed', description: '', latitude: null, longitude: null, address: null, media: [], sharingConsent: false })).toHaveLength(2)); });
describe('cart', () => { it('calculates subtotal', () => expect(cartSubtotal({ a: 2 }, [{ id: 'a', name: 'A', price: 1000, category: 'iot' }])).toBe(2000)); });
