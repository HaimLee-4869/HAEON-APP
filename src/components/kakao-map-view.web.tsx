import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KAKAO_BRIDGE_URL, KAKAO_KEY } from './kakao-map-bridge';
import { FallbackMap, type KakaoMapViewProps } from './kakao-map-view.shared';

type KakaoLatLng = object;
interface KakaoOverlay { setMap(map: KakaoMap | null): void }
interface KakaoMap { setCenter(position: KakaoLatLng): void; setLevel(level: number): void }
interface KakaoMaps {
  load(callback: () => void): void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  Marker: new (options: { map: KakaoMap; position: KakaoLatLng; title: string }) => KakaoOverlay;
  Polygon: new (options: { map: KakaoMap; path: KakaoLatLng[]; strokeWeight: number; strokeColor: string; fillColor: string; fillOpacity: number }) => KakaoOverlay;
  event: { addListener(target: KakaoOverlay, type: 'click', listener: () => void): void };
}
declare global { interface Window { kakao?: { maps: KakaoMaps } } }

let sdkPromise: Promise<KakaoMaps> | null = null;
function loadKakaoSdk() {
  if (window.kakao?.maps) return Promise.resolve(window.kakao.maps);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-haeon-kakao-web]');
    const script = existing ?? document.createElement('script');
    const ready = () => window.kakao?.maps
      ? window.kakao.maps.load(() => resolve(window.kakao!.maps))
      : reject(new Error('KAKAO_MAPS_UNAVAILABLE'));
    script.addEventListener('load', ready, { once: true });
    script.addEventListener('error', () => reject(new Error('KAKAO_SDK_LOAD_FAILED')), { once: true });
    if (!existing) {
      script.async = true;
      script.dataset.haeonKakaoWeb = 'true';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_KEY)}&autoload=false`;
      document.head.appendChild(script);
    }
  });
  return sdkPromise;
}

export function KakaoMapView(props: KakaoMapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const initialCamera = useRef(props.camera);
  const onMapReady = useRef(props.onMapReady);
  const map = useRef<KakaoMap | null>(null);
  const maps = useRef<KakaoMaps | null>(null);
  const overlays = useRef<KakaoOverlay[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(!KAKAO_KEY || !KAKAO_BRIDGE_URL ? 'failed' : 'loading');

  useEffect(() => {
    if (!container.current) return;
    let active = true;
    void loadKakaoSdk().then((sdk) => {
      if (!active || !container.current) return;
      maps.current = sdk;
      const camera = initialCamera.current;
      map.current = new sdk.Map(container.current, { center: new sdk.LatLng(camera?.latitude ?? 33.36, camera?.longitude ?? 126.55), level: camera?.zoom ?? 9 });
      setStatus('ready');
      onMapReady.current?.();
    }).catch(() => { if (active) setStatus('failed'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const sdk = maps.current; const instance = map.current;
    if (status !== 'ready' || !sdk || !instance) return;
    if (props.camera) {
      instance.setCenter(new sdk.LatLng(props.camera.latitude, props.camera.longitude));
      if (props.camera.zoom !== undefined) instance.setLevel(props.camera.zoom);
    }
    overlays.current.forEach((overlay) => overlay.setMap(null));
    overlays.current = props.markers.map((item) => {
      const marker = new sdk.Marker({ map: instance, position: new sdk.LatLng(item.latitude, item.longitude), title: item.label });
      sdk.event.addListener(marker, 'click', () => props.onMarkerPress?.(item));
      return marker;
    });
    if (props.activeLayer === 'danger-zone') {
      for (const zone of props.riskZones ?? []) {
        const polygon = new sdk.Polygon({ map: instance, path: zone.coordinates.map((point) => new sdk.LatLng(point.latitude, point.longitude)), strokeWeight: 2, strokeColor: '#F04444', fillColor: '#F04444', fillOpacity: 0.25 });
        overlays.current.push(polygon);
      }
    }
  }, [props, status]);

  if (status === 'failed') return <FallbackMap {...props} />;
  return <View style={StyleSheet.absoluteFill}>
    <div ref={container} aria-label="실제 Kakao Map" style={styles.map} />
    <Text pointerEvents="none" style={styles.source}>{status === 'ready' ? 'Kakao Map · 실지도' : 'Kakao Map 연결 중…'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  source: { position: 'absolute', right: 10, bottom: 12, fontSize: 9, color: '#59616E', backgroundColor: 'rgba(255,255,255,.9)', padding: 5, borderRadius: 6 },
});
