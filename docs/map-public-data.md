# 지도·GPS·공공데이터 구현

## Kakao Map

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
