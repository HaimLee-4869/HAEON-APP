# 지도·GPS·공공데이터 구현

## Kakao Map

### 모바일 WebView bridge 배포 사양

현재 HAEON 웹에는 모바일 WebView 전용 bridge route가 없다. 따라서 `EXPO_PUBLIC_KAKAO_MAP_BRIDGE_URL`에 넣을 수 있는 실제 배포 페이지가 마련되기 전까지 모바일 앱은 연동 완료 상태가 아니며 fallback을 표시한다.

필요한 페이지(예: `https://haeon-safe.vercel.app/mobile/kakao-map-bridge`)는 다음을 충족해야 한다.

- Kakao Developers에 등록된 HTTPS origin에서 제공하고 Kakao JavaScript SDK를 `autoload=false`로 로드한다.
- SDK load/error와 `window.kakao.maps` 존재 여부를 확인한 뒤에만 `{ "type": "ready" }`를 전송한다.
- React Native가 보내는 `HAEON_MAP_STATE` 메시지의 camera, markers, riskZones를 지도에 반영한다.
- marker 선택 시 `{ "type": "marker", "id": "..." }`를 `window.ReactNativeWebView.postMessage`로 반환한다.
- SDK, 초기화, payload 오류는 `{ "type": "error", "code": "..." }`로 반환해 앱이 명시적 fallback으로 전환할 수 있게 한다.
- CSP에서 `https://dapi.kakao.com` 및 Kakao 지도 리소스를 허용하고, bridge URL의 실제 GET이 HTTP 200 HTML을 반환해야 한다.

Expo Web은 WebView bridge가 아니라 브라우저용 Kakao SDK loader가 별도로 필요하다. 현재 `kakao-map-view.web.tsx`는 의도적으로 fallback만 렌더링한다.

Expo SDK 54 / React Native 0.81 새 아키텍처에서 Android와 iOS를 함께 보장하는 유지보수된 Kakao Native SDK wrapper/config plugin을 채택하지 않았다. 앱은 `react-native-webview` 안에서 Kakao Maps JavaScript API를 실행하는 bridge adapter를 사용한다. 키나 등록 호스트가 없거나 SDK 로딩이 실패하면 화면은 `대체 지도`라고 명시된 fallback으로 전환한다.

- `EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY`: Kakao JavaScript Key (서버 secret이 아님)
- `EXPO_PUBLIC_KAKAO_MAP_BRIDGE_URL`: Kakao Developers의 JavaScript SDK 도메인에 등록한 HTTPS origin. inline WebView 문서의 `baseUrl`로 사용한다.
- Kakao Developers에서 Kakao Map API 활성화와 JavaScript SDK 도메인 등록이 필요하다.
- native production/dev build는 WebView bridge를 사용한다. 최종 실기기 확인은 development build를 기준으로 한다.
- web export는 가짜 실지도를 표시하지 않고 fallback을 사용한다.

## 공공데이터 지역 범위

| 지역 | 조석 station | 해양 station | 단기예보 area |
|---|---|---|---|
| 모슬포 | 미지원 | 미지원 | daejeong |
| 서귀포 | DT_0010 | 미지원 | seogwipo |
| 성산포 | DT_0022 | 미지원 | seongsan |
| 제주 | DT_0004 | TW_0075 | jeju |
| 이어도 | 미지원 | KG_0021 | 미지원 |
| 마라도 | DT_0023 | KG_0028 | 미지원 |

웹 프로젝트의 allowlist만 재사용하며 station code를 추측하지 않는다. `weather-alert`, `marine-forecast`, `tidal-current`는 현재 웹 API의 제주 기본 station/area를 사용한다. 웹 API가 요청 날짜를 받지 않고 KST 오늘 날짜로 고정하므로 이전/다음 날짜에는 수치를 가장하지 않고 `데이터 없음`을 표시한다.
