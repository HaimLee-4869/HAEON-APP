# HAEON SAFE Mobile

기존 HAEON:SAFE 관제 웹의 모바일 사용자용 Expo 앱입니다. `docs/reference/haeon_safe_app_prototype_v4.html`을 UI 기준으로 실제 React Native 컴포넌트로 재구현했습니다.

## 기술 스택

- React Native 0.81, Expo 54, Expo Router, TypeScript strict
- Lucide React Native, React Native SVG
- Zustand, TanStack Query
- Supabase JS/Auth/Realtime 기반 구조
- Expo Location, Expo Image Picker

## 구조

```text
app/                 Expo Router 화면 및 레이아웃
  (tabs)/            물때, 신고, 홈, AI 리포트, 스토어
src/components/      공통 UI, 탭바, 지도 인터페이스
src/constants/       디자인 토큰
src/data/            샘플 리포트·스토어 카탈로그
src/hooks/           공공데이터 TanStack Query 훅
src/lib/             API, Supabase, repository
src/services/        AI 리포트 service interface
src/stores/          auth, cart, app settings Zustand store
src/types/           앱·공공데이터 타입
```

## 환경변수

`.env.example`을 참고해 로컬 `.env`를 생성합니다. 앱에는 publishable key만 사용하며 service role/secret key를 넣지 않습니다.

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_HAEON_API_BASE_URL=https://haeon-safe.vercel.app
```

## 실행 및 검증

```bash
npm install
npm start
npm run android
npm run ios
npm run web
npm run typecheck
npm run lint
npm test
npm run build:web
```

기존 `C:\Users\3425e\HAEON`의 DB 스키마와 공공데이터 정규화 계약을 읽기 전용으로 참고합니다. migration이나 운영 데이터는 변경하지 않습니다. 현재 지도는 교체 가능한 `KakaoMapView` 시각 컨테이너이며, 다음 단계에서 Kakao Native SDK 또는 지도 전용 WebView adapter로 실제 지도를 연결할 예정입니다.
