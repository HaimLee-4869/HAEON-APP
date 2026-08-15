export const tideRegions = {
  moseulpo: { name: '모슬포', forecastArea: 'daejeong', station: null, oceanStation: null },
  seogwipo: { name: '서귀포', forecastArea: 'seogwipo', station: 'DT_0010', oceanStation: null },
  seongsan: { name: '성산포', forecastArea: 'seongsan', station: 'DT_0022', oceanStation: null },
  jeju: { name: '제주', forecastArea: 'jeju', station: 'DT_0004', oceanStation: 'TW_0075' },
  ieodo: { name: '이어도', forecastArea: null, station: null, oceanStation: 'KG_0021' },
  marado: { name: '마라도', forecastArea: null, station: 'DT_0023', oceanStation: 'KG_0028' },
} as const;
export type TideRegionId = keyof typeof tideRegions;
export function isTideRegion(value: string): value is TideRegionId { return value in tideRegions; }
export function regionParams(region: TideRegionId) {
  const item = tideRegions[region];
  return {
    tide: item.station ? { station: item.station } : undefined,
    ocean: item.oceanStation ? { station: item.oceanStation } : undefined,
    forecast: item.forecastArea ? { area: item.forecastArea } : undefined,
  };
}
