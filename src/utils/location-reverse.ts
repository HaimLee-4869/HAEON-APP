import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { formatKoreanAddress } from './location';

type KakaoAddressResult = { address?: AddressParts; road_address?: AddressParts };
type AddressParts = { region_1depth_name?: string; region_2depth_name?: string; region_3depth_name?: string };

export async function reverseGeocodeKorean(coords: { latitude: number; longitude: number }): Promise<string | null> {
  if (Platform.OS !== 'web') return formatKoreanAddress((await Location.reverseGeocodeAsync(coords))[0]);
  const kakao = (globalThis as unknown as { kakao?: { maps?: { services?: { Geocoder?: new () => { coord2Address(longitude: number, latitude: number, callback: (result: KakaoAddressResult[], status: string) => void): void }; Status?: { OK?: string } } } } }).kakao;
  const Geocoder = kakao?.maps?.services?.Geocoder;
  if (Geocoder) return new Promise((resolve) => new Geocoder().coord2Address(coords.longitude, coords.latitude, (results, status) => { if (status !== (kakao?.maps?.services?.Status?.OK ?? 'OK')) return resolve(null); const place = results[0]?.road_address ?? results[0]?.address; resolve(place ? [place.region_1depth_name, place.region_2depth_name, place.region_3depth_name].filter(Boolean).join(' ') || null : null); }));
  return formatKoreanAddress((await Location.reverseGeocodeAsync(coords).catch(() => []))[0]);
}
