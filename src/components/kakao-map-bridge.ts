import type { KakaoMapViewProps } from './kakao-map-view.shared';
export const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY ?? '';
export const KAKAO_BRIDGE_URL = process.env.EXPO_PUBLIC_KAKAO_MAP_BRIDGE_URL ?? '';
export function bridgePayload(props: KakaoMapViewProps) { return { type: 'HAEON_MAP_STATE', camera: props.camera, markers: props.markers, riskZones: props.activeLayer === 'danger-zone' ? props.riskZones ?? [] : [] }; }
export function bridgeHtml() {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body,#map{width:100%;height:100%;margin:0}</style><script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_KEY)}&autoload=false"></script></head><body><div id="map"></div><script>
  let map, overlays=[]; function clear(){overlays.forEach(x=>x.setMap(null));overlays=[]} function send(v){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(v))}
  kakao.maps.load(function(){map=new kakao.maps.Map(document.getElementById('map'),{center:new kakao.maps.LatLng(33.36,126.55),level:9});send({type:'ready'})});
  function update(s){if(!map)return;if(s.camera){map.setCenter(new kakao.maps.LatLng(s.camera.latitude,s.camera.longitude));if(s.camera.zoom)map.setLevel(s.camera.zoom)}clear();(s.markers||[]).forEach(function(m){let marker=new kakao.maps.Marker({map:map,position:new kakao.maps.LatLng(m.latitude,m.longitude),title:m.label});kakao.maps.event.addListener(marker,'click',()=>send({type:'marker',id:m.id}));overlays.push(marker)});(s.riskZones||[]).forEach(function(z){let p=new kakao.maps.Polygon({map:map,path:z.coordinates.map(c=>new kakao.maps.LatLng(c.latitude,c.longitude)),strokeWeight:2,strokeColor:'#F04444',fillColor:'#F04444',fillOpacity:.25});overlays.push(p)})}
  document.addEventListener('message',e=>{try{update(JSON.parse(e.data))}catch(_){}});window.addEventListener('message',e=>{try{update(JSON.parse(e.data))}catch(_){}});</script></body></html>`;
}
export const bridgeBaseUrl = KAKAO_BRIDGE_URL || 'https://localhost.invalid';
