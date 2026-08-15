# HAEON:SAFE Mobile

> 스마트 태왁, 위치·활동 데이터, 기상·해양 공공데이터를 결합해 해녀와 고령 어업인의 작업 안전을 지원하는 모바일 안전관리 앱

**HAEON:SAFE Mobile**은 섬루션의 해양안전 플랫폼 HAEON:SAFE의 모바일 클라이언트입니다.  
스마트 태왁에서 수집되는 위치·장치 상태와 Supabase의 실시간 데이터를 기반으로 사용자의 현재 안전상태를 확인하고, 기상청·국립해양조사원 공공데이터를 함께 활용해 위험요인, 물때, 해양환경, 안전 리포트를 제공합니다.

기존 웹 관제 플랫폼 **HAEON:SAFE Web**과 동일한 Supabase 및 공공데이터 API를 사용하도록 설계되어 웹과 앱이 하나의 데이터 체계를 공유합니다.

---

## 1. 프로젝트 개요

해녀와 고령 어업인의 해상 작업은 다음과 같은 위험에 노출될 수 있습니다.

- 갑작스러운 기상 악화
- 높은 파고와 강한 바람
- 조류·조석 변화
- 저수온
- 장시간 무활동
- 위험구역 접근
- 장치 통신 지연 또는 두절
- 낮은 배터리
- 긴급상황 발생

HAEON:SAFE Mobile은 이러한 정보를 한 화면에서 확인하고, 현재 위험상태를 이해하기 쉬운 형태로 전달하는 것을 목표로 합니다.


> **사고 이후 발견하는 것이 아니라, 위험 발생 이전에 대응하는 것이 핵심 방향성입니다.**

---

## 2. 주요 기능

### 2.1 지도 기반 실시간 안전 모니터링

- Kakao Map 기반 지도
- 해녀 및 배정 스마트 태왁 위치 표시
- Supabase 최신 위치정보 연동
- 배터리·통신 상태·최근 통신시각 표시
- 위험단계별 마커 표시
- 현재 위치 GPS 연동
- 지도 검색
  - 해녀
  - 태왁 ID
  - 지역
- 지도 필터
  - 통합
  - 해녀
  - 태왁
  - 위험구역
  - 풍향·풍속
  - 수온
  - 유향·유속
  - 기온
  - 파고·파주기
  - 조석

공공데이터에 좌표가 명확하게 검증되지 않은 경우 임의의 관측소 마커를 생성하지 않고, 환경정보 레이어 형태로 제공합니다.

---

### 2.2 물때 검색

지원 지역:

- 모슬포
- 서귀포
- 성산포
- 제주
- 이어도
- 마라도

지역 선택 시 상세 화면에서 가능한 범위의 데이터를 제공합니다.

- 만조 시각 및 조위
- 간조 시각 및 조위
- 현재 조위
- 수온
- 파고
- 파주기
- 풍속
- 기온
- 날씨
- 기상특보
- 해상예보
- 작업 참고 상태

특정 지역·시점에서 제공되지 않는 데이터는 임의 수치로 대체하지 않고 `데이터 없음`으로 처리합니다.

---

### 2.3 긴급 신고 UI

- SOS 긴급 구조 요청
- 3초 Long Press 방식
- 3 → 2 → 1 Countdown
- 조기 해제 시 신고 취소
- Haptic Feedback
- 현재 GPS 좌표 표시
- 상황 설명
- 사진·영상 선택
- 미디어 미리보기 및 삭제
- 위치정보 및 첨부 공유 동의
- 신고 내역 UI

현재 버전에서는 119 등 외부 구조기관 자동 신고 기능은 연결하지 않았습니다.  
실제 신고 저장용 `emergency_reports` 테이블, Storage Bucket 및 운영기관 연계는 후속 단계에서 연결할 예정입니다.

---

### 2.4 AI 리포트

HAEON:SAFE Mobile의 AI 리포트는 현재 학습형 사고예측 모델이 아니라 **실시간 위험분석 + 규칙 기반 안전 분석**을 중심으로 구성됩니다.

#### 일간

현재 시점의 최신 정보를 중심으로 안전상태를 제공합니다.

- 최신 위험점수
- 현재 위험단계
- 감지된 위험요인
- 장치 배터리
- 장치 연결상태
- 마지막 통신
- 현재 활동상태
- 오늘 알림
- 오늘 이동거리
- 주요 해양환경
- 최근 위험 이벤트
- 분석 코멘트
- 맞춤형 안전 가이드

#### 주간 / 월간

실제 데이터가 존재하는 경우 기간별 통계를 제공합니다.

- 평균 위험도
- 최고 위험도
- 위험단계 분포
- 알림 건수
- 이동거리
- 작업 세션
- 작업시간


---

### 2.5 위험도 Progress Ring

| 점수 | 단계 |
|---:|---|
| 0~19 | 안전 |
| 20~44 | 주의 |
| 45~69 | 경고 |
| 70~100 | 위험 |

- 점수 비율만큼 원형 Ring 표시
- 0 → 현재 점수 애니메이션
- 위험단계별 색상 적용
- 중앙에 현재 점수 및 단계 표시

---

### 2.6 스토어

현재 스토어는 HAEON:SAFE 서비스 확장 구조를 보여주는 UI 중심 기능입니다.

- HAEON TAEWAK Hero Banner
- 상품 Carousel
- 카테고리
  - 전체
  - 스마트 태왁
  - IoT 기기
  - 구독 서비스
  - 액세서리
- 상품 검색
- 장바구니
- 수량 조절
- Subtotal 계산
- 구독형 서비스 UI

---

### 2.7 설정

- 사용자 정보
- 위험도 민감도
- 위험 알림 설정
- 활동 시간
- 야간 알림
- 보호자 관리
- 긴급 연락망
- 공동 대응기관
- 정보 수정
- 로컬 설정 유지

---

## 3. 기술 스택

### Frontend

- **React Native**
- **Expo 54**
- **TypeScript**
- **Expo Router**
- **React Native SVG**
- **Lucide React Native**

### State / Data Fetching

- **Zustand**
- **TanStack Query**

### Backend / Database

- **Supabase**
  - PostgreSQL
  - Auth
  - Realtime
  - Row Level Security
- **기존 HAEON Next.js API**
- **Vercel**

### Device

- **expo-location**
- **expo-image-picker**
- **expo-haptics**

### Map

- **Kakao Maps JavaScript SDK**
- **react-native-webview**
- Web / Native adapter 구조

### Testing / Quality

- **Vitest**
- TypeScript Strict Mode
- ESLint
- Expo Doctor
- Expo Web Export
- EAS Build

---

## 4. 기술 스택 사용 이유

### React Native + Expo

기존 HAEON 웹이 React + TypeScript 기반이기 때문에 모바일 앱에서도 동일한 언어와 개발방식을 유지할 수 있습니다.

장점:

- TypeScript 타입 재사용
- API 계약 재사용
- 위험분석 로직 재사용
- React 개발 경험 재사용
- Android / iOS 단일 코드베이스
- EAS를 이용한 클라우드 빌드

### Supabase

기존 웹 HAEON:SAFE에서 이미 사용 중인 Supabase 프로젝트를 모바일 앱에서도 그대로 공유합니다.

별도 DB를 만들지 않고 다음 데이터를 웹과 앱이 동일하게 사용합니다.

- 사용자
- 조직
- 해녀
- 스마트 태왁
- 위치
- 위험점수
- 알림
- 작업 세션

RLS를 그대로 유지해 로그인 사용자의 권한 범위 내 데이터만 조회합니다.

### TanStack Query

서버 데이터와 UI 상태를 명확히 분리하고 데이터별 로딩·오류·캐시 상태를 관리하기 위해 사용합니다.

특히 공공데이터 또는 Supabase 일부 요청이 지연되더라도 앱 전체 화면을 Blocking하지 않고 각 섹션별로 독립적으로 표시할 수 있습니다.

### Zustand

서버 데이터가 아닌 앱 내부 상태를 간단하게 관리합니다.

예:

- 장바구니
- 설정값
- AI 리포트 선택 대상
- 인증 상태

### Kakao Map

서비스 실증 대상이 제주를 중심으로 하기 때문에 국내 지명·도로·지도 사용성을 고려해 Kakao Map을 사용합니다.

---

## 5. 시스템 구조

```text
┌─────────────────────────────────┐
│        HAEON:SAFE Mobile        │
│ React Native / Expo / TS        │
└───────────────┬─────────────────┘
                │
        ┌───────┴──────────┐
        │                  │
        ▼                  ▼
┌──────────────┐    ┌──────────────────┐
│   Supabase   │    │ HAEON Web API    │
│              │    │ Next.js / Vercel │
│ Auth         │    └────────┬─────────┘
│ PostgreSQL   │             │
│ RLS          │             ▼
│ Realtime     │    ┌──────────────────┐
└──────┬───────┘    │ 기상·해양 공공API │
       │            └──────────────────┘
       │
       ▼
┌──────────────────┐
│ 해녀 / 태왁 / 위치 │
│ 위험점수 / 알림    │
│ 작업 세션          │
└──────────────────┘

                +
                │
                ▼
       ┌────────────────┐
       │   Kakao Map    │
       │ GPS / Markers  │
       │ Risk Zones     │
       └────────────────┘
```

---

## 6. 기존 HAEON Web과의 관계

HAEON:SAFE는 웹과 앱을 분리된 서비스로 개발하지만 데이터는 공유합니다.

```text
HAEON Web
관리자 · 관제자용
      │
      │
      ▼
   Supabase
      ▲
      │
      │
HAEON Mobile
해녀 · 사용자용
```

웹과 모바일이 공유하는 주요 요소:

- Supabase Auth
- DB Schema
- RLS
- Realtime
- 해녀·태왁 데이터
- 위치 데이터
- 위험점수
- 알림
- 작업 세션
- 공공데이터 API
- 위험분석 기준

---

## 7. Supabase 데이터 구조

주요 테이블:

| Table | 역할 |
|---|---|
| `organizations` | 운영 조직 |
| `profiles` | 로그인 사용자 프로필 |
| `organization_memberships` | 사용자-조직-권한 관계 |
| `haenyeo` | 해녀 / 관리 대상 |
| `devices` | 스마트 태왁 장치 |
| `device_locations` | GPS·활동·장치 텔레메트리 |
| `risk_scores` | 위험점수 및 위험요인 |
| `alerts` | 위험 알림 |
| `work_sessions` | 작업 세션 |

관제 데이터 관계:

```text
haenyeo
  ↓
devices
  ↓
device_locations

haenyeo
  ↓
risk_scores

haenyeo / device
  ↓
alerts
```

---

## 8. Supabase Realtime

다음 변경을 실시간으로 구독합니다.

```text
device_locations INSERT
risk_scores      INSERT
alerts           INSERT / UPDATE
devices          UPDATE
```

Realtime 이벤트 발생 시 관련 TanStack Query를 갱신합니다.

구현 특징:

- 로그인 JWT 기반
- RLS 유지
- Callback 등록 후 Subscribe
- 중복 Channel 방지
- Connection 직렬화
- Reconnect
- Reference Count Cleanup
- Query Invalidation

---

## 9. 사용한 공공데이터

HAEON Web API를 통해 총 8종의 기상·해양 데이터를 사용합니다.

| API | 주요 활용 |
|---|---|
| 기상특보 | 특보·위험요인 |
| 단기예보 | 강수·풍속·기온 |
| 파랑관측 | 파고·파주기 |
| 조류관측 | 유향·유속 |
| 조위관측 | 현재 조위·수온 |
| 조석예보 | 만조·간조 |
| 해양관측부이 | 풍속·파고·수온·기온 |
| 해상예보 | 해상 상태 및 작업 참고 |

Endpoint:

```text
/api/public-data/weather-alert
/api/public-data/short-term-forecast
/api/public-data/wave-observation
/api/public-data/tidal-current
/api/public-data/tidal-observation
/api/public-data/tide-forecast
/api/public-data/ocean-buoy
/api/public-data/marine-forecast
/api/public-data/health
```

공공데이터 상태:

```text
success
no_data
error
```

`no_data`는 정상적인 데이터 없음 상태이며 앱 전체 오류로 처리하지 않습니다.

---

## 10. 위험분석 구조

현재 위험점수는 학습형 사고확률이 아니라 **규칙 기반 위험점수**입니다.

입력 예:

- 기상특보
- 풍속
- 파고
- 유속
- 수온
- 강수
- 통신 지연
- 통신 두절
- 저배터리
- 긴급 버튼
- 장시간 무활동
- 위험구역
- 비정상 이동속도

```text
위험요인
   ↓
가중치 합산
   ↓
0~100점
   ↓
안전 / 주의 / 경고 / 위험
```

앱에서는 DB의 최신 `risk_scores`를 우선 사용하고, 위험요인 설명 및 공공데이터 정보와 결합해 안전 리포트를 구성합니다.

---

## 11. AI 분석 코멘트

현재 외부 LLM API는 연결하지 않습니다.

실제 데이터 기반 Deterministic Rule 방식으로:

```ts
type SafetyComment = {
  headline: string;
  details: string[];
};
```

형태의 코멘트를 생성합니다.

활용 데이터:

- 현재 위험점수
- 위험단계
- 위험요인
- 활동상태
- 배터리
- 통신상태
- 최근 알림
- 기상특보
- 풍속
- 파고
- 수온
- 조석

향후 LLM + RAG 구조로 확장 가능합니다.

예:

```text
현재 위험분석 결과
+
사용자 활동 이력
+
해녀 안전 매뉴얼
+
해양사고 대응 매뉴얼
↓
RAG
↓
개인화 안전 가이드
```

---

## 12. Kakao Map 구조

### Web

Expo Web에서는 Kakao Maps JavaScript SDK를 직접 사용합니다.

### Android / iOS

React Native 환경에서는 WebView Bridge 구조를 사용합니다.

Bridge:

```text
https://haeon-safe.vercel.app/mobile-map-bridge
```

앱 → Bridge:

```text
HAEON_MAP_STATE
```

지원 정보:

- Center
- Zoom
- Markers
- Risk Zones
- Selected Marker
- Layer State

Bridge → App:

```text
ready
marker_press
map_error
camera_changed
```

---

## 13. 프로젝트 구조

```text
HAEON-APP/
├─ app/
│  ├─ _layout.tsx
│  ├─ login.tsx
│  ├─ settings.tsx
│  │
│  ├─ (tabs)/
│  │  ├─ _layout.tsx
│  │  ├─ index.tsx
│  │  ├─ tide.tsx
│  │  ├─ sos.tsx
│  │  ├─ report.tsx
│  │  └─ store.tsx
│  │
│  └─ tide/
│     └─ [region].tsx
│
├─ src/
│  ├─ components/
│  ├─ data/
│  ├─ hooks/
│  ├─ lib/
│  │  ├─ api/
│  │  ├─ public-data/
│  │  ├─ query/
│  │  ├─ repositories/
│  │  ├─ risk/
│  │  └─ supabase/
│  ├─ services/
│  ├─ stores/
│  ├─ types/
│  └─ utils/
│
├─ tests/
├─ docs/
│  ├─ map-public-data.md
│  ├─ reference/
│  └─ supabase/
│
├─ assets/
├─ .env.example
├─ app.json
├─ babel.config.js
├─ eas.json
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 14. 환경변수

`.env.example`을 참고해 프로젝트 루트에 `.env.local`을 생성합니다.

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

EXPO_PUBLIC_HAEON_API_BASE_URL=https://haeon-safe.vercel.app

EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY=
EXPO_PUBLIC_KAKAO_MAP_BRIDGE_URL=https://haeon-safe.vercel.app/mobile-map-bridge

# 선택사항: 시연 시 최초 AI 리포트 대상
EXPO_PUBLIC_DEMO_DEFAULT_HAENYEO_CODE=
```

### 앱에 넣으면 안 되는 값

모바일 앱에는 다음 서버용 Secret을 절대 포함하지 않습니다.

```text
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
DATA_GO_KR_SERVICE_KEY
TELEMETRY_INGEST_TOKEN
```

공공데이터 Service Key는 HAEON Web Server에서만 관리합니다.

---

## 15. 설치

### Requirements

- Node.js 20+
- npm
- Expo CLI / EAS CLI
- Android 또는 iOS 테스트 기기

Repository:

```bash
git clone https://github.com/HaimLee-4869/HAEON-APP.git
cd HAEON-APP
```

Dependency 설치:

```bash
npm install
```

---

## 16. 로컬 실행

### Expo 시작

```bash
npx expo start
```

또는:

```bash
npm start
```

### Web

```bash
npm run web
```

또는 Cache 초기화:

```bash
npx expo start --web --clear
```

기본:

```text
http://localhost:8081
```

### Android

Expo Go 또는 Development Build 사용 시:

```bash
npm run android
```

---

## 17. 테스트

### TypeScript

```bash
npm run typecheck
```

### ESLint

```bash
npm run lint
```

### Unit Test

```bash
npm test
```

### Expo Dependency Check

```bash
npx expo install --check
```

### Expo Doctor

```bash
npx expo-doctor
```

### Web Production Export

```bash
npm run build:web
```

---

## 18. Android APK 빌드

본 프로젝트는 Expo EAS Build를 통해 Android APK를 생성할 수 있습니다.

### EAS Login

```bash
eas login
```

### EAS Project 설정

```bash
eas build:configure
```

### Preview Environment 등록

```bash
eas env:push preview --path .env.local
```

확인:

```bash
eas env:list --environment preview
```

### APK Build

`eas.json`의 preview profile은 내부 테스트용 APK로 설정합니다.

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

빌드:

```bash
eas build --platform android --profile preview
```

빌드 완료 후 Expo에서 제공하는 Internal Distribution URL을 Android 기기에서 열면 설치할 수 있습니다.

---

## 19. 화면 구성

하단 탭:

```text
1. 물때
2. 신고
3. 홈
4. AI 리포트
5. 스토어
```

별도:

```text
설정
```

### Routes

| Route | 기능 |
|---|---|
| `/login` | 로그인 |
| `/(tabs)` | 지도 홈 |
| `/(tabs)/tide` | 물때 검색 |
| `/tide/[region]` | 물때 상세 |
| `/(tabs)/sos` | 긴급 신고 |
| `/(tabs)/report` | AI 안전 리포트 |
| `/(tabs)/store` | 스토어 |
| `/settings` | 설정 |

---

## 20. 현재 구현 범위

### 구현 완료

- Expo / React Native 앱 구조
- Supabase Auth
- Session Restore
- RLS 기반 데이터 조회
- Supabase Realtime
- 실제 Kakao Map
- 현재 GPS
- 물때 상세
- 공공데이터 8종
- 위험도 분석
- AI 리포트
- Progress Ring
- 기간별 분석
- 안전 코멘트
- 맞춤형 안전 가이드
- SOS 3초 Long Press
- 이미지·영상 선택
- Store UI
- 장바구니
- Settings
- Android EAS Build

### 후속 개발

- 실제 스마트 태왁 GPS/LoRaWAN 연결
- 긴급 신고 DB 운영 반영
- 신고 미디어 Supabase Storage
- 가족·어촌계·복지사 외부 알림
- 실제 구조기관 연계
- 실결제
- 구독 결제
- LLM/RAG 기반 분석
- iOS TestFlight / App Store 배포

---

## 21. 향후 하드웨어 구조

```text
Smart Taewak
GPS + Sensor + LoRaWAN
          │
          ▼
LoRaWAN Gateway
          │
          ▼
AWS IoT / Network Server
          │
          ▼
HAEON Telemetry API
          │
          ▼
Supabase
      ┌───┴───┐
      ▼       ▼
HAEON Web   HAEON Mobile
```

현재 모바일 앱은 실제 스마트 태왁이 연결되기 전에도 기존 Supabase 데이터와 동일한 데이터 파이프라인을 이용해 기능을 검증할 수 있도록 구성되어 있습니다.

---

## 22. 보안 원칙

- Service Role Key를 앱에 포함하지 않음
- Supabase RLS 유지
- 공공데이터 API Key 서버 관리
- Telemetry Token 서버 관리
- `.env.local` Git 제외
- 사용자별 권한 범위 유지
- Realtime도 로그인 JWT + RLS 적용
- 데이터 없음과 오류 상태 분리
- 가짜 성공 응답 생성 금지

---

## 23. Repository

### Mobile

```text
https://github.com/HaimLee-4869/HAEON-APP
```

### Web

```text
https://github.com/HaimLee-4869/HAEON
```

Web Production:

```text
https://haeon-safe.vercel.app
```

---

## 24. 운영 주체

**섬루션 (SUM:LUTION)**

농어촌·해양 문제를 기술로 해결하고, 해녀와 고령 어업인의 안전한 작업환경을 위한 데이터 기반 해양안전 솔루션을 개발합니다.

---

## 25. Project Vision

HAEON:SAFE는 단순 위치추적 앱이 아닙니다.

스마트 태왁의 현장 데이터와 기상·해양환경 데이터를 하나의 안전정보 체계로 연결하여, 해녀와 고령 어업인의 위험징후를 더 빠르게 발견하고 공동 대응할 수 있는 플랫폼을 지향합니다.
