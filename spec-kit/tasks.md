# Task Breakdown: TripFrame MVP

**Feature**: `001-tripframe`
**Tasks version**: 1.0
**Created**: 2026-03-24

> 의존성 순서를 반드시 지킬 것. [P] 표시는 병렬 실행 가능.
> 각 태스크는 독립적으로 커밋 가능한 단위로 구성.

---

## Phase 0 — 모노레포 설정

### TASK-001: 프로젝트 루트 설정
**파일**: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
**의존**: 없음

```bash
# 실행 명령
mkdir tripframe && cd tripframe
pnpm init
```

```json
// pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "target": "ES2020",
    "lib": ["ES2020"]
  }
}
```

**완료 기준**: `pnpm install` 성공

---

### TASK-002: `packages/core` 초기화
**파일**: `packages/core/package.json`, `packages/core/tsconfig.json`
**의존**: TASK-001

```json
// packages/core/package.json
{
  "name": "@tripframe/core",
  "version": "0.1.0",
  "main": "src/index.ts",
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "jest": "^29.x",
    "ts-jest": "^29.x",
    "typescript": "^5.x"
  }
}
```

**완료 기준**: `pnpm --filter @tripframe/core typecheck` 성공

---

### TASK-003 [P]: Expo 앱 초기화
**파일**: `apps/mobile/`
**의존**: TASK-001

```bash
cd apps
# Expo SDK 54+ 사용 (Constitution Article IV)
npx create-expo-app mobile --template blank-typescript
cd mobile
pnpm add zustand @react-navigation/native @react-navigation/bottom-tabs
pnpm add react-native-safe-area-context react-native-screens
```

**Metro 설정** (Windows pnpm 호환):
```javascript
// apps/mobile/metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@tripframe/core': path.resolve(__dirname, '../../packages/core'),
};

config.watchFolders = [
  path.resolve(__dirname, '../../packages/core'),
];

module.exports = config;
```

**완료 기준**: `npx expo start` 실행 후 시뮬레이터에서 Hello World 확인

---

## Phase 1 — Core 타입 및 엔진

### TASK-004: 타입 정의
**파일**: `packages/core/src/types/event.ts`, `gap.ts`, `reverse-calc.ts`, `index.ts`
**의존**: TASK-002

구현 내용:
- `TripEvent` 인터페이스 (plan.md Data Model 참조)
- `Gap` 인터페이스
- `ReverseCalcResult`, `ReverseCalcStep` 인터페이스
- `TransportOption` 인터페이스
- 모든 enum/union type

**완료 기준**: `tsc --noEmit` 오류 없음

---

### TASK-005: 항공사 규정 DB
**파일**: `packages/core/src/data/airline-rules.ts`
**의존**: TASK-004

```typescript
// 구현할 내용
export interface AirlineRule {
  iataCode: string;
  name: string;
  internationalCheckInDeadlineMinutes: number;
  domesticCheckInDeadlineMinutes: number;
  terminal?: Record<string, string>; // airport → terminal
}

export const AIRLINE_RULES: Record<string, AirlineRule> = {
  'LJ': { iataCode: 'LJ', name: '진에어', internationalCheckInDeadlineMinutes: 50, domesticCheckInDeadlineMinutes: 30 },
  'KE': { iataCode: 'KE', name: '대한항공', internationalCheckInDeadlineMinutes: 60, domesticCheckInDeadlineMinutes: 30 },
  'OZ': { iataCode: 'OZ', name: '아시아나', internationalCheckInDeadlineMinutes: 60, domesticCheckInDeadlineMinutes: 30 },
  '7C': { iataCode: '7C', name: '제주항공', internationalCheckInDeadlineMinutes: 50, domesticCheckInDeadlineMinutes: 30 },
  // ... 추가 항공사
};

export function getAirlineRule(iataCode: string): AirlineRule { ... }
```

**완료 기준**: `getAirlineRule('LJ').internationalCheckInDeadlineMinutes === 50`

---

### TASK-006 [P]: 버스 예약 오픈 규칙 DB
**파일**: `packages/core/src/data/transit-rules.ts`
**의존**: TASK-004

```typescript
export interface TransitBookingRule {
  routeId: string;
  routeName: string;
  bookingOpenDaysBeforeDeparture: number;
  bookingOpenTime: string;   // "HH:MM" local time
  bookingUrl: string;
  notes: string;
}

export const TRANSIT_BOOKING_RULES: TransitBookingRule[] = [
  {
    routeId: 'yufuin-express',
    routeName: '유후인호 (후쿠오카↔유후인)',
    bookingOpenDaysBeforeDeparture: 30,
    bookingOpenTime: '08:00',
    bookingUrl: 'https://www.highwaybus.com',
    notes: '크롬 브라우저 한국어 번역 권장'
  },
  // ...
];

export function calculateBookingOpenDate(departureDate: string, rule: TransitBookingRule): string { ... }
```

**완료 기준**: 6/19 탑승 기준 → 5/20 08:00 반환 확인

---

### TASK-007: 역산 알고리즘 구현
**파일**: `packages/core/src/engine/reverse-calc.ts`
**의존**: TASK-004, TASK-005

구현할 함수:
```typescript
export function calculateReverseTimeline(params: {
  flightDepartureTime: string;
  airlineCode: string;
  isInternational: boolean;
  transitMinutes: number;
  bufferMinutes?: number;      // 기본 40분
}): ReverseCalcResult

// 내부 헬퍼
function subtractMinutes(time: string, minutes: number): string
function formatStep(label: string, time: string, type: StepType, note: string): ReverseCalcStep
```

**테스트 케이스** (`tests/reverse-calc.test.ts`):
```typescript
test('진에어 12:15 출발 → 09:15 집 출발 (버스 75분)', () => {
  const result = calculateReverseTimeline({
    flightDepartureTime: '12:15',
    airlineCode: 'LJ',
    isInternational: true,
    transitMinutes: 75,
  });
  expect(result.homeDepart).toBe('09:15');
  expect(result.steps).toHaveLength(6);
  expect(result.steps[0].type).toBe('ANCHOR');
  expect(result.steps[5].type).toBe('RESULT');
});
```

**완료 기준**: 모든 테스트 통과

---

### TASK-008: 공백 감지 알고리즘 구현
**파일**: `packages/core/src/engine/gap-detector.ts`
**의존**: TASK-004

구현할 함수:
```typescript
export function detectGaps(events: TripEvent[]): Gap[]

// 내부 헬퍼
function sortEventsByTime(events: TripEvent[]): TripEvent[]
function classifyGapSeverity(gapMinutes: number, hasTransport: boolean): GapSeverity
function buildGap(fromEvent: TripEvent, toEvent: TripEvent, options: TransportOption[]): Gap
function detectLastMileGap(arrivalEvent: TripEvent, hotelEvent: TripEvent): Gap | null
```

**테스트 케이스** (`tests/gap-detector.test.ts`):
```typescript
test('하카타 체크아웃 → 유후인 체크인 사이 이동수단 없으면 DANGER', () => {
  const events = [hotelCheckout, hotelCheckin]; // 버스 이벤트 없음
  const gaps = detectGaps(events);
  expect(gaps[0].severity).toBe('DANGER');
  expect(gaps[0].suggestedOptions.length).toBeGreaterThan(0);
});

test('버스센터 → 잇코텐 마지막 구간 자동 감지', () => {
  const events = [busArrival, hotelCheckin]; // 택시 없음
  const gaps = detectGaps(events);
  expect(gaps[0].message).toContain('마지막 구간');
});
```

**완료 기준**: 모든 테스트 통과

---

### TASK-009 [P]: 경제성 분석 구현
**파일**: `packages/core/src/engine/economics.ts`
**의존**: TASK-004

```typescript
export interface PassOption {
  name: string;
  pricePerPerson: number;
  currency: 'JPY' | 'KRW';
  validDays: number;
}

export function comparePassVsIndividual(params: {
  individualTrips: { cost: number; currency: string }[];
  passOption: PassOption;
  people: number;
}): {
  individualTotal: number;
  passTotal: number;
  recommendation: 'PASS' | 'INDIVIDUAL';
  savingAmount: number;
  breakEvenTrips: number;
}
```

**테스트**: 버스 2회(13,000엔) vs 산큐패스(16,000엔) → INDIVIDUAL 반환

---

### TASK-010: 샘플 데이터 정의
**파일**: `packages/core/src/data/sample-trip.ts`
**의존**: TASK-004

후쿠오카 여행 샘플 데이터 전체 정의:
- LJ263 (ICN→FUK 12:15→13:40)
- 오리엔탈 호텔 (체크인 15:00, 체크아웃 11:00)
- 잇코텐 (체크인 15:00, 체크아웃 11:00)
- LJ264 (FUK→ICN 14:40→16:00)
- 미예약 공백 2개 포함

**완료 기준**: `detectGaps(SAMPLE_EVENTS).length === 3` (공백 2개 + 자동삽입 1개)

---

## Phase 2 — Store 및 Hooks

### TASK-011: Zustand Trip Store
**파일**: `apps/mobile/src/store/trip-store.ts`
**의존**: TASK-004, TASK-010

```typescript
interface TripStore {
  // State
  events: TripEvent[];
  selectedDayIndex: number;
  userPreferences: UserPreferences;

  // Actions
  setEvents: (events: TripEvent[]) => void;
  addEvent: (event: TripEvent) => void;
  updateEvent: (id: string, partial: Partial<TripEvent>) => void;
  removeEvent: (id: string) => void;
  setSelectedDay: (index: number) => void;
  setPreference: (key: keyof UserPreferences, value: unknown) => void;
}

interface UserPreferences {
  luggageSize: 'CARRY_ON' | 'LARGE';
  transportPreference: 'PUBLIC' | 'TAXI' | 'ANY';
  bufferPreference: 'TIGHT' | 'RELAXED';
}
```

**완료 기준**: store 단위 테스트 통과

---

### TASK-012 [P]: UI Store
**파일**: `apps/mobile/src/store/ui-store.ts`
**의존**: TASK-011

```typescript
interface UiStore {
  openGapId: string | null;
  activeScreen: string;
  setOpenGap: (id: string | null) => void;
  setActiveScreen: (screen: string) => void;
}
```

---

### TASK-013: useTripTimeline Hook
**파일**: `apps/mobile/src/hooks/useTripTimeline.ts`
**의존**: TASK-011

```typescript
export function useTripTimeline() {
  // tripStore에서 events 가져오기
  // dayGroups: 날짜별 그룹핑
  // reverseCalcResult: calculateReverseTimeline 결과
  return { dayGroups, selectedDay, setSelectedDay, reverseCalcResult }
}
```

---

### TASK-014 [P]: useGapDetection Hook
**파일**: `apps/mobile/src/hooks/useGapDetection.ts`
**의존**: TASK-011, TASK-008

```typescript
export function useGapDetection() {
  // tripStore events 구독
  // detectGaps 실행 (메모이제이션)
  // openGap 상태 관리
  return { gaps, openGapId, toggleGap }
}
```

---

## Phase 3 — 화면 구현

### TASK-015: 공통 컴포넌트
**파일**: `apps/mobile/src/components/common/Badge.tsx`, `SectionHeader.tsx`
**의존**: TASK-011

```typescript
// Badge.tsx: variant ('역산' | '자동삽입' | '미예약' | '추천')
// SectionHeader.tsx: 섹션 헤더 라벨
```

---

### TASK-016: 테마 정의
**파일**: `apps/mobile/src/theme/colors.ts`, `typography.ts`
**의존**: TASK-003

```typescript
// colors.ts: 다크 테마 기준
export const COLORS = {
  background: '#0D0D12',
  surface: '#13131A',
  purple: '#A78BFA',
  purpleDim: '#7C3AED',
  danger: '#EF4444',
  success: '#10B981',
  amber: '#F59E0B',
  // ...
}
```

---

### TASK-017: TimelineItem 컴포넌트
**파일**: `apps/mobile/src/components/timeline/TimelineItem.tsx`
**의존**: TASK-015, TASK-016

```typescript
interface TimelineItemProps {
  event: TripEvent;
  isLast?: boolean;
}
```
- 이벤트 타입별 아이콘, 색상
- `status === 'MISSING'` → 빨간 border + "미예약" 배지
- `status === 'DERIVED'` → "역산" 배지
- `status === 'AUTO'` → "자동삽입" 배지
- alert 메시지 표시

---

### TASK-018 [P]: DaySelector 컴포넌트
**파일**: `apps/mobile/src/components/timeline/DaySelector.tsx`
**의존**: TASK-015

수평 스크롤 탭: D-1, Day1, Day2, Day3

---

### TASK-019: TimelineScreen
**파일**: `apps/mobile/src/screens/TimelineScreen.tsx`
**의존**: TASK-013, TASK-017, TASK-018

```typescript
// useTripTimeline 사용
// DaySelector + TimelineItem 목록
// 헤더: 여행 타이틀 + 공백 경고 뱃지
```

---

### TASK-020: GapCard 컴포넌트
**파일**: `apps/mobile/src/components/gap/GapCard.tsx`
**의존**: TASK-015, TASK-016

```typescript
interface GapCardProps {
  gap: Gap;
  isOpen: boolean;
  onToggle: () => void;
}
```
- 심각도별 색상 (DANGER: 빨강, AUTO: 초록)
- 탭으로 옵션 카드 펼침
- 예약 오픈 날짜 표시

---

### TASK-021 [P]: OptionCard 컴포넌트
**파일**: `apps/mobile/src/components/gap/OptionCard.tsx`
**의존**: TASK-015

```typescript
interface OptionCardProps {
  option: TransportOption;
  people: number;  // 2인 합산 계산용
}
```

---

### TASK-022: GapDetectionScreen
**파일**: `apps/mobile/src/screens/GapDetectionScreen.tsx`
**의존**: TASK-014, TASK-020, TASK-021

`useGapDetection` 훅 사용, GapCard 목록 렌더

---

### TASK-023: ReverseCalcScreen
**파일**: `apps/mobile/src/screens/ReverseCalcScreen.tsx`
**의존**: TASK-013, TASK-015

- Anchor 카드 (항공편 정보)
- 단계별 역산 스텝
- 결과 카드 (집 출발 시간)
- 교통수단 전환 버튼 (버스↔철도)

---

### TASK-024 [P]: SuggestionScreen
**파일**: `apps/mobile/src/screens/SuggestionScreen.tsx`
**의존**: TASK-014, TASK-021, TASK-009

- 선택 구간별 OptionCard 비교
- 경제성 분석 카드 (패스 vs 개별)

---

## Phase 4 — 통합

### TASK-025: 네비게이션 설정
**파일**: `apps/mobile/src/navigation/AppNavigator.tsx`
**의존**: TASK-019, TASK-022, TASK-023, TASK-024

```typescript
// Bottom Tab: 일정 | 공백 | 비교 | 역산
// 공백 탭에 미예약 뱃지 수 표시
```

---

### TASK-026: 샘플 데이터 연결
**파일**: `apps/mobile/src/store/trip-store.ts` (업데이트)
**의존**: TASK-010, TASK-025

앱 초기 로드 시 샘플 데이터 자동 주입

---

### TASK-027: 전체 통합 테스트
**파일**: 각 스크린 스냅샷 테스트
**의존**: TASK-025, TASK-026

```
검증 체크리스트:
- [ ] 일정 탭: Day1~3 전환, 미예약/역산/자동삽입 배지 표시
- [ ] 공백 탭: GapCard 3개 (위험 2개 + 자동삽입 1개), 탭 펼침/닫힘
- [ ] 비교 탭: 추천 옵션 하이라이트, 경제성 결과 표시
- [ ] 역산 탭: 6단계 계산, 09:15 결과 표시
```

---

### TASK-028: 테스트 환경 설정
**파일**: `jest.config.js`, `.github/workflows/test.yml`, `packages/core/jest.config.js`
**의존**: TASK-002

**Jest 설정 (Coverage 임계값 80%)**:
```javascript
// packages/core/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Playwright E2E 설정**:
```bash
pnpm add -D @playwright/test
```

**완료 기준**: `pnpm test -- --coverage` 실행 시 coverage 80% 이상

---

### TASK-029: 알려진 한계 개선
**파일**: `packages/core/src/engine/gap-detector.ts`, `packages/core/src/engine/free-time.ts`
**의존**: TASK-008, TASK-007

#### 29-A: TC-010 마지막 구간 감지 개선
**현황**: transport 이벤트 이후 숙소까지 구간을 감지하지 못함

**개선**:
```typescript
// gap-detector.ts
// transport 이벤트 하차 후 목적지까지 이동수단 확인 로직 추가
if (event.type === 'transport' && nextEvent.type === 'hotel') {
  // 하차 위치 → 숙소 이동수단 검사
}
```

#### 29-B: TC-016, TC-017 자유시간 계산 구현
**현황**: `calculateFreeTime()` 함수 미구현

**구현**:
```typescript
// packages/core/src/engine/free-time.ts (NEW)
export interface FreeTimeResult {
  minutes: number;
  startTime: string;
  endTime: string;
  warning?: string;  // 30분 미만 시 경고
}

export function calculateFreeTime(
  arrivalTime: string,
  checkInTime: string
): FreeTimeResult {
  // 도착 시간 ~ 체크인 시간 계산
  // 30분 미만 시 경고 메시지 생성
}
```

**완료 기준**:
- TC-010 테스트 통과
- TC-016, TC-017 테스트 통과

---

### TASK-030: E2E 테스트 안정화 (testID 추가)
**파일**: `apps/mobile/src/components/**/*.tsx`, `e2e/*.spec.ts`
**의존**: TASK-017~024

**testID 추가**:
```typescript
// TimelineItem.tsx
<Text testID={`timeline-item-${event.id}`}>{event.title}</Text>

// GapCard.tsx
<View testID={`gap-card-${gap.id}`}>

// ReverseCalcScreen.tsx
<Text testID="reverse-calc-result">{result.homeDepart}</Text>
```

**E2E 테스트 업데이트**:
```typescript
// e2e/timeline.spec.ts
await expect(page.getByTestId('reverse-calc-result')).toHaveText('09:15');
```

**완료 기준**: getByText() 0건, getByTestId() 전환 완료

---

## 태스크 의존성 요약

```
TASK-001
  └─ TASK-002 ──────────────────────────────────────────┐
  └─ TASK-003 [P]                                        │
                                                         ▼
TASK-002 → TASK-004 → TASK-005 → TASK-007 → (테스트)    │
                    → TASK-006 [P]                       │
                    → TASK-008 → (테스트)                 │
                    → TASK-009 [P]                       │
                    → TASK-010                           │
                                                         │
TASK-010 + TASK-003 → TASK-011 ←─────────────────────────┘
TASK-011 → TASK-012 [P]
TASK-011 → TASK-013
TASK-011 + TASK-008 → TASK-014 [P]
TASK-003 → TASK-016

TASK-011 + TASK-016 → TASK-015
TASK-013 + TASK-015 + TASK-016 → TASK-017
TASK-015 → TASK-018 [P]
TASK-013 + TASK-017 + TASK-018 → TASK-019
TASK-015 + TASK-016 → TASK-020
TASK-015 → TASK-021 [P]
TASK-014 + TASK-020 + TASK-021 → TASK-022
TASK-013 + TASK-015 → TASK-023
TASK-014 + TASK-021 + TASK-009 → TASK-024 [P]
TASK-019 + TASK-022 + TASK-023 + TASK-024 → TASK-025
TASK-025 + TASK-010 → TASK-026
TASK-026 → TASK-027

TASK-002 → TASK-028 [P]
TASK-008 + TASK-007 → TASK-029 [P]
TASK-017~024 → TASK-030 [P]
```

---

## 예상 소요 시간

| Phase | 태스크 | 예상 |
|-------|--------|------|
| Phase 0 (모노레포) | TASK-001~003 | 0.5일 |
| Phase 1 (Core 엔진) | TASK-004~010 | 2일 |
| Phase 2 (Store/Hooks) | TASK-011~014 | 1일 |
| Phase 3 (화면) | TASK-015~024 | 3일 |
| Phase 4 (통합) | TASK-025~027 | 0.5일 |
| Phase 5 (개선) | TASK-028~030 | 1일 |
| **합계** | 30 태스크 | **8일** |

---

*tasks version: 1.0 | feature: 001-tripframe*
