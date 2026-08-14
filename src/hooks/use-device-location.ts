import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { MapCamera } from '@/types/domain';
export function useDeviceLocation() {
  const [camera, setCamera] = useState<MapCamera>(); const [address, setAddress] = useState<string>();
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const locate = useCallback(async () => {
    try {
      setStatus('requesting'); const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { setStatus('denied'); return; }
      setStatus('granted'); const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCamera({ latitude: current.coords.latitude, longitude: current.coords.longitude, zoom: 4 });
      const places = await Location.reverseGeocodeAsync(current.coords).catch(() => []);
      const place = places[0]; if (place) setAddress([place.region, place.city, place.district, place.street].filter(Boolean).join(' '));
      subscription.current?.remove();
      subscription.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: Platform.OS === 'web' ? 10000 : 5000, distanceInterval: 10 }, ({ coords }) => setCamera((old) => ({ latitude: coords.latitude, longitude: coords.longitude, zoom: old?.zoom ?? 4 })));
    } catch { setStatus('error'); }
  }, []);
  useEffect(() => () => subscription.current?.remove(), []);
  return { camera, address, status, locate, setCamera };
}
