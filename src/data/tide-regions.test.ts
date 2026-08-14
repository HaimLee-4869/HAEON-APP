import { describe, expect, it } from 'vitest';
import { isTideRegion, regionParams } from './tide-regions';
describe('tide region route', () => { it('validates route params', () => { expect(isTideRegion('jeju')).toBe(true); expect(isTideRegion('unknown')).toBe(false); }); it('uses only web-supported codes', () => expect(regionParams('jeju')).toMatchObject({ tide: { station: 'DT_0004' }, ocean: { station: 'TW_0075' } })); });
