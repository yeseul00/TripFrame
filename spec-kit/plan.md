# Implementation Plan: TripFrame Phase 4

**Feature**: `004-tripframe-phase4`
**Plan version**: 1.0
**Created**: 2026-03-29
**Status**: Planning

---

## 1. Tech Stack

Phase 3 스택 유지. 신규 패키지 2개 추가.

| 영역 | 기술 | 변경 |
|------|------|------|
| UI | NativeWind v4 + React Native | 기존 유지 |
| 상태 관리 | Zustand | useSettingsStore 신규 추가 |
| 날짜 입력 | `@react-native-community/datetimepicker` | 신규 추가 |
| Backend | Supabase (기존) | OAuth Redirect URL 등록만 |
| 날짜 | date-fns | 기존 유지 |
| 테스트 | Playwright | E2E 업데이트 |

---

## 2. Architecture

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

```
Phase 4.1 — 설정 기능 실구현 (3일)
  └─ useSettingsStore, applyBufferLevel, sortByPreference
  └─ SettingsScreen 연동, ReverseCalc + Suggestion 적용

Phase 4.2 — Google OAuth + 클라우드 동기화 (1일)
  └─ Supabase Redirect URLs 등록 (인프라)
  └─ 동기화 동작 검증, 설정 탭 상태 표시

Phase 4.3 — 공백감지 FreeTime UI (1일)
  └─ GapAnalysisScreen 하단 FreeTime 카드 추가

Phase 4.4 — UX 개선 (2일)
  └─ 메뉴명 결정 + 일괄 변경
  └─ TripFormModal DatePicker

Phase 4.5 — 교통 데이터 내장 DB (2일)
  └─ transport-rules.ts 구조 확장
  └─ 인천/김포 공항버스 10+ 노선, KTX 10개 노선

Phase 4.6 — 테스트 & 결과서 (2일)
  └─ E2E 업데이트, Phase 4 완료보고서
```

---

## 5. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| DatePicker 웹/모바일 크로스 플랫폼 | 중 | Platform 분기, 웹은 HTML input 우선 |
| 역산 bufferLevel 적용 시 E2E 하드코딩 시각 변경 | 중 | E2E는 'normal' 설정 기준으로 고정 |
| Supabase OAuth 등록 후에도 redirect 오류 | 낮음 | Supabase 문서 기준으로 단계별 검증 |
| 메뉴명 결정 지연 | 낮음 | TASK-078을 Phase 4.4 마지막 순서로 배치 |
| 교통 데이터 정확도 | 낮음 | isEstimate 플래그로 명시, 추후 공공API 보완 |

---

*Phase 4 목표: "설정이 실제로 동작하고, 구글 로그인이 되고, 공백 옆에 여유 시간이 보이는" 앱*
