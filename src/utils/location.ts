import type * as Location from 'expo-location';

type Place = Pick<Location.LocationGeocodedAddress, 'region' | 'subregion' | 'city' | 'district' | 'name'>;

export function formatKoreanAddress(place?: Place | null): string | null {
  if (!place) return null;
  const parts = [place.region, place.city ?? place.subregion, place.district];
  const unique = parts.filter((part, index): part is string => Boolean(part?.trim()) && parts.indexOf(part) === index);
  return unique.length ? unique.join(' ') : place.name?.trim() || null;
}

export function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
