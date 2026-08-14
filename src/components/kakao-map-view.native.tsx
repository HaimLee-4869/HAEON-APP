import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { bridgeBaseUrl, bridgeHtml, bridgePayload, KAKAO_BRIDGE_URL, KAKAO_KEY } from './kakao-map-bridge';
import { FallbackMap, type KakaoMapViewProps } from './kakao-map-view.shared';
export function KakaoMapView(props: KakaoMapViewProps) {
  const ref = useRef<WebView>(null); const [failed, setFailed] = useState(!KAKAO_KEY || !KAKAO_BRIDGE_URL);
  const payload = JSON.stringify(bridgePayload(props));
  useEffect(() => { ref.current?.postMessage(payload); }, [payload]);
  if (failed) return <FallbackMap {...props} />;
  return <View style={StyleSheet.absoluteFill}><WebView ref={ref} originWhitelist={['https://*']} source={{ html: bridgeHtml(), baseUrl: bridgeBaseUrl }} javaScriptEnabled domStorageEnabled onError={() => setFailed(true)} onHttpError={() => setFailed(true)} onMessage={({ nativeEvent }) => { try { const message = JSON.parse(nativeEvent.data) as { type: string; id?: string }; if (message.type === 'ready') { props.onMapReady?.(); ref.current?.postMessage(payload); } if (message.type === 'marker') { const marker = props.markers.find((m) => m.id === message.id); if (marker) props.onMarkerPress?.(marker); } } catch {} }} /></View>;
}
