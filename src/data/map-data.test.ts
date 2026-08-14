import { describe, expect, it } from 'vitest';
import { markersForLayer, sampleMarkers, searchMarkers } from './map-data';
describe('map data adapters', () => {
  it('filters marker layers', () => { expect(markersForLayer(sampleMarkers, 'haenyeo').every((m) => m.kind === 'user')).toBe(true); expect(markersForLayer(sampleMarkers, 'wave')).toEqual([]); });
  it('searches user, device and region fields', () => { expect(searchMarkers(sampleMarkers, 'TW-102')).toHaveLength(1); expect(searchMarkers(sampleMarkers, '서귀포').length).toBeGreaterThan(0); });
});
