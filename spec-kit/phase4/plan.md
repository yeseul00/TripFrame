# Implementation Plan: TripFrame Phase 4

**Feature**: `004-tripframe-phase4`
**Plan version**: 1.0
**Created**: 2026-03-29
**Status**: Planning

---

## 1. Tech Stack

Phase 3 스택 유지. 신규 패키지 3개 추가. TF-TECH-001 의사결정 반영.

| 영역 | 기술 | 변경 |
|------|------|------|
| UI | NativeWind v4 + React Native | 기존 유지 |
| 상태 관리 | Zustand | useSettingsStore 신규 추가 |
| 날짜 입력 | `@react-native-community/datetimepicker` | 신규 추가 |
| 사용자 데이터 저장 | `expo-sqlite/kv-store` | **신규 추가** — AsyncStorage 교체, import 1줄 변경 |
| 암호화 | `expo-crypto` (AES-256-GCM) | **신규 추가** — Expo Go/Dev Build 모두 동작 |
| Backend | Supabase (기존) | OAuth Redirect URL 등록만 |
| 날짜 | date-fns | 기존 유지 |
| 테스트 | Playwright | E2E 업데이트 |
| 코드 품질 | ESLint (기존 + 규칙 추가) | no-any, max-lines-per-function |

> **Phase 5에서 추가 예정**: expo-secure-store (마스터 키 하드웨어 보관, Dev Build 전환 후), expo-sqlite Full SQL (참조 데이터 DB), Drizzle ORM (선택)

---

## 2. Architecture

### 2-0. 스토리지 + 암호화 전환 (신규, P0) — TF-TECH-001 결정

**2단계 암호화 전략 (TF-MTG-001 C레벨 결정 #1)**

| 단계 | 암호화 방식 | 키 보관 | 환경 | Phase |
|------|-----------|--------|------|-------|
| Phase 4 | expo-crypto AES-256-GCM | kv-store (약점: 루팅 기기) | Expo Go + Dev Build 모두 동작 | **현재** |
| Phase 5+ | expo-crypto AES-256-GCM | expo-secure-store (하드웨어 보안 모듈) | Dev Build 필수 | 업그레이드 |

**Step 1 — AsyncStorage → expo-sqlite/kv-store (import 교체)**

```typescript
// 기존
import AsyncStorage from '@react-native-async-storage/async-storage'
// 변경 후 — Zustand persist 코드 수정 불필요, API 완전 호환
import AsyncStorage from 'expo-sqlite/kv-store'
```

**Step 2 — 암호화 래퍼 (expo-crypto AES-256-GCM)**

```typescript
// src/storage/encryptedStorage.ts
import * as Crypto from 'expo-crypto'
import AsyncStorage from 'expo-sqlite/kv-store'

const MASTER_KEY_STORAGE = 'tripframe_master_key'

async function getMasterKey(): Promise<string> {
  let key = await AsyncStorage.getItem(MASTER_KEY_STORAGE)
  if (!key) {
    // 최초 실행 시 랜덤 256비트 키 생성
    const bytes = await Crypto.getRandomBytesAsync(32)
    key = Buffer.from(bytes).toString('hex')
    await AsyncStorage.setItem(MASTER_KEY_STORAGE, key)
  }
  return key
}

export const encryptedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const encrypted = await AsyncStorage.getItem(key)
    if (!encrypted) return null
    return decrypt(encrypted, await getMasterKey())
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const masterKey = await getMasterKey()
    await AsyncStorage.setItem(key, encrypt(value, masterKey))
  },
  removeItem: async (key: string): Promise<void> => AsyncStorage.removeItem(key),
}

// useTripStore, useSettingsStore의 AsyncStorage → encryptedStorage로 교체
// Phase 5에서 getMasterKey()의 저장소만 AsyncStorage → expo-secure-store로 교체
//   → 데이터 암호화 로직 전체 유지, 키 보관 위치만 변경
```

**마이그레이션 전략**:
- 앱 시작 시 기존 AsyncStorage 평문 데이터 감지 → 암호화하여 kv-store에 재저장 → 기존 키 삭제
- `@tripframe/core` 변경 없음 (Constitution III-1 준수 — store 계층만 영향)

### 2-0b. 온보딩 플로우 (신규, P0)

```typescript
// src/screens/OnboardingScreen.tsx
// 표시 조건: encryptedStorage에 'onboarding_complete' 키가 없을 때

const SLIDES = [
  { title: '여행의 빈 칸을 찾아드려요', subtitle: '이동수단이 빠진 구간을 자동으로 감지해요', icon: '🔍' },
  { title: '집 출발 시간을 역산해요', subtitle: '항공편 시간에서 거꾸로 계산해 몇 시에 나가야 하는지 알려드려요', icon: '⏱' },
  { title: '지금 시작해볼까요?', subtitle: '첫 여행을 만들어보세요', cta: '시작하기' },
]

// App.tsx에서 onboarding_complete 플래그 확인 → false면 OnboardingScreen 표시
// 완료 또는 건너뛰기 → 플래그 저장 → HomeScreen 진입
```

### 2-1. useSettingsStore (신규)

```typescript
// src/store/useSettingsStore.ts
interface Settings {
  luggageSize: 'carry-on' | 'checked'
  transportPreference: 'transit' | 'taxi' | 'any'
  bufferLevel: 'tight' | 'normal' | 'relaxed'
}

interface SettingsStore {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}

// AsyncStorage persist (useTripStore 패턴 동일)
// 기본값: { luggageSize: 'carry-on', transportPreference: 'any', bufferLevel: 'normal' }
```

### 2-2. 역산 로직 설정 연동

```typescript
// packages/core/logic/applySettings.ts (신규 순수 함수)
export function applyBufferLevel(
  steps: ReverseCalcStep[],
  bufferLevel: Settings['bufferLevel']
): ReverseCalcStep[]

// bufferLevel 매핑
// 'tight'    → factor 0.8 (기본 buffer × 0.8)
// 'normal'   → factor 1.0 (기본값)
// 'relaxed'  → factor 1.2 (기본 buffer × 1.2)
```

### 2-3. 제안 로직 교통 선호도 연동

```typescript
// packages/core/logic/sortOptions.ts (신규 순수 함수)
export function sortByPreference(
  options: TransportOption[],
  preference: Settings['transportPreference']
): TransportOption[]

// preference = 'transit' → 대중교통 타입 옵션을 최상단으로
// preference = 'taxi'    → 택시 타입 옵션을 최상단으로
// preference = 'any'     → 기존 순서 유지 (비용 기준)
```

### 2-4. 교통 데이터 내장 DB 구조

```typescript
// packages/core/data/transport-rules.ts (확장)
interface TransportRoute {
  id: string
  from: string         // 출발지 코드 (예: 'ICN', 'GMP', 'SEOUL')
  to: string           // 도착지 코드
  type: 'airport-bus' | 'ktx' | 'srt' | 'subway'
  durationMin: number  // 소요시간(분)
  firstDeparture: string  // 첫차 HH:MM
  lastDeparture: string   // 막차 HH:MM
  intervalMin: number     // 배차 간격(분)
  isEstimate: boolean     // true면 "추정값" 레이블 표시
}

export const TRANSPORT_ROUTES: TransportRoute[] = [
  // 공항버스 인천 ↔ 서울 주요 구간
  // KTX 서울-부산, 서울-대전 등
]
```

### 2-5. 날짜 Picker 전략

- **iOS/Android**: `@react-native-community/datetimepicker` (네이티브 피커)
- **Web (Expo)**: `Platform.OS === 'web'` → `<input type="date">` HTML 네이티브
- `TripFormModal.tsx`에서 플랫폼 분기 처리

```typescript
// 플랫폼 분기 패턴
const DateInput = Platform.OS === 'web'
  ? WebDateInput      // <TextInput> with type="date" via web props
  : NativeDatePicker  // DateTimePicker
```

---

## 3. 화면별 변경 사항

### SettingsScreen.tsx

- 현재: 라디오 버튼 UI만 (저장 없음)
- Phase 4: useSettingsStore 연결 → 선택값 즉시 저장, 앱 재시작 후 복원

### ReverseCalcDetailScreen.tsx

- 현재: MOCK_REVERSE_CALC 기반 고정 bufferTime
- Phase 4: `applyBufferLevel(steps, settings.bufferLevel)` 적용

### SuggestionScreen.tsx

- 현재: 옵션 목록 비용 기준 정렬
- Phase 4: `sortByPreference(options, settings.transportPreference)` 적용

### GapAnalysisScreen.tsx

- 현재: Gap 목록만 표시
- Phase 4: 하단에 FreeTime 카드 추가 (`calculateFreeTime` 호출)

### TripFormModal.tsx

- 현재: 날짜 TextInput (자유 입력)
- Phase 4: DatePicker 컴포넌트로 교체

---

## 4. 구현 순서

전문가 리뷰(TF-REVIEW-000) 반영하여 P0 보안/온보딩 항목을 최우선으로 재정렬.

```
Phase 4.0 — 스토리지 전환 + 암호화 + 온보딩 [P0, 신규] (2일)
  └─ AsyncStorage → expo-sqlite/kv-store (import 1줄)
  └─ expo-crypto AES-256-GCM 암호화 래퍼 구현 + 마이그레이션
  └─ 온보딩 3장 스와이프, 완료 플래그 저장

Phase 4.1 — 설정 기능 실구현 (3일)
  └─ useSettingsStore, applyBufferLevel, sortByPreference
  └─ SettingsScreen 연동, ReverseCalc + Suggestion 적용

Phase 4.2 — Google OAuth + 클라우드 동기화 (1일)
  └─ Supabase Redirect URLs 등록 (인프라)
  └─ 동기화 동작 검증, 설정 탭 상태 표시

Phase 4.3 — 공백감지 FreeTime UI + 타입 정리 (1일)
  └─ GapAnalysisScreen 하단 FreeTime 카드 추가
  └─ FreeTimeResult 타입 logic/ → types/trip.ts 이동 (TD-07)

Phase 4.4 — UX 개선 + 코드 품질 (2일)
  └─ 메뉴명 결정 + 일괄 변경
  └─ TripFormModal DatePicker
  └─ ESLint 규칙 추가 (no-any, max-lines-per-function, no-restricted-imports)

Phase 4.5 — 교통 데이터 내장 DB (2일)
  └─ transport-rules.ts 구조 확장
  └─ 인천/김포 공항버스 10+ 노선, KTX 10개 노선

Phase 4.6 — 테스트 & 결과서 (2일)
  └─ E2E 업데이트 (목표: 95+ PASS)
  └─ Phase 4 완료보고서, Phase 5 태스크 초안
```

---

## 5. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| expo-crypto AES-GCM 구현 오류로 데이터 복호화 실패 | 높음 | 마이그레이션 전 평문 백업 유지, 암호화/복호화 단위 테스트 필수 |
| AsyncStorage → kv-store 마이그레이션 데이터 손실 | 높음 | 마이그레이션 전 기존 AsyncStorage 백업 읽기 후 검증, 롤백 로직 포함 |
| expo-crypto 웹 환경 미지원 | 중 | Platform.OS === 'web' 시 btoa/SubtleCrypto fallback 적용 |
| DatePicker 웹/모바일 크로스 플랫폼 | 중 | Platform 분기, 웹은 HTML input 우선 |
| 역산 bufferLevel 적용 시 E2E 하드코딩 시각 변경 | 중 | E2E는 'normal' 설정 기준으로 고정 |
| Supabase OAuth 등록 후에도 redirect 오류 | 낮음 | Supabase 문서 기준으로 단계별 검증 |
| 메뉴명 결정 지연 | 낮음 | TASK-078을 Phase 4.4 마지막 순서로 배치 |
| 교통 데이터 정확도 | 낮음 | isEstimate 플래그로 명시, 추후 공공API 보완 |

---

*Phase 4 목표: "암호화된 저장소, 온보딩, 설정 실기능화, 구글 로그인, 공백 옆 여유 시간이 모두 동작하는 앱"*
*TF-REVIEW-000 + TF-TECH-001 + TF-MTG-001 반영 (2026-03-29)*
