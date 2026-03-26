# Implementation Plan: TripFrame MVP

**Feature**: `001-tripframe`
**Plan version**: 1.0
**Created**: 2026-03-24

---

## Constitution Check

| 원칙 | 준수 여부 | 비고 |
|------|----------|------|
| Mobile-First (Expo) | ✅ | Expo SDK 51, React Native |
| Logic-UI 분리 | ✅ | `packages/core/` 에 모든 엔진 분리 |
| TypeScript strict | ✅ | tsconfig strict: true |
| 단방향 데이터 흐름 | ✅ | Zustand store 사용 |
| 오프라인 우선 | ✅ | 핵심 로직은 순수 TS 함수 |
| P1 우선 완성 | ✅ | 역산 엔진 + 공백 감지 먼저 |

---

## Project Structure

```
tripframe/
├── packages/
│   └── core/                          # 플랫폼 독립 비즈니스 로직
│       ├── src/
│       │   ├── types/
│       │   │   ├── event.ts           # TripEvent, EventType, EventStatus
│       │   │   ├── gap.ts             # Gap, GapSeverity
│       │   │   └── index.ts
│       │   ├── engine/
│       │   │   ├── reverse-calc.ts    # 역산 알고리즘
│       │   │   ├── gap-detector.ts    # 공백 감지
│       │   │   └── economics.ts       # 패스 경제성 계산
│       │   ├── data/
│       │   │   ├── airline-rules.ts   # 항공사 수속 마감 DB
│       │   │   └── transit-rules.ts   # 버스 예약 오픈 규칙
│       │   └── index.ts
│       ├── tests/
│       │   ├── reverse-calc.test.ts
│       │   ├── gap-detector.test.ts
│       │   └── economics.test.ts
│       └── package.json
│
├── apps/
│   └── mobile/                        # Expo React Native 앱
│       ├── src/
│       │   ├── screens/
│       │   │   ├── TimelineScreen.tsx
│       │   │   ├── GapDetectionScreen.tsx
│       │   │   ├── SuggestionScreen.tsx
│       │   │   └── ReverseCalcScreen.tsx
│       │   ├── components/
│       │   │   ├── timeline/
│       │   │   │   ├── TimelineItem.tsx
│       │   │   │   ├── DaySelector.tsx
│       │   │   │   └── FreeTimeBlock.tsx
│       │   │   ├── gap/
│       │   │   │   ├── GapCard.tsx
│       │   │   │   └── OptionCard.tsx
│       │   │   └── common/
│       │   │       ├── Badge.tsx
│       │   │       └── SectionHeader.tsx
│       │   ├── store/
│       │   │   ├── trip-store.ts      # Zustand store
│       │   │   └── ui-store.ts
│       │   ├── hooks/
│       │   │   ├── useTripTimeline.ts
│       │   │   └── useGapDetection.ts
│       │   ├── navigation/
│       │   │   └── AppNavigator.tsx
│       │   └── theme/
│       │       ├── colors.ts
│       │       └── typography.ts
│       ├── app.json
│       └── package.json
│
├── package.json                       # pnpm workspaces root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Data Model

### `packages/core/src/types/event.ts`

```typescript
export type EventType =
  | 'FLIGHT'
  | 'HOTEL'
  | 'BUS'
  | 'TRAIN'
  | 'TAXI'
  | 'WALK'
  | 'SUBWAY'
  | 'FREE';

export type EventStatus =
  | 'CONFIRMED'   // 예약 완료
  | 'PENDING'     // 예약 미완료
  | 'MISSING'     // 공백 감지됨
  | 'AUTO'        // 앱이 자동 삽입
  | 'DERIVED';    // 역산으로 계산됨

export interface Location {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  timezone: string;             // IANA timezone e.g. "Asia/Tokyo"
}

export interface TripEvent {
  id: string;
  type: EventType;
  title: string;
  subtitle?: string;
  startTime: string;            // ISO 8601 local time
  endTime?: string;
  location: Location;
  status: EventStatus;
  reservationId?: string;
  bufferMinutes: number;        // 필요 여유 시간
  notes?: string;
  alertMessage?: string;        // 미예약 등 경고 메시지
  openAlertDate?: string;       // 예약 오픈 알림 날짜 (ISO 8601)
}
```

### `packages/core/src/types/gap.ts`

```typescript
export type GapSeverity = 'DANGER' | 'WARNING' | 'OK';

export interface TransportOption {
  name: string;
  durationMinutes: number;
  costPerPerson: number;        // JPY 또는 KRW
  currency: 'JPY' | 'KRW';
  notes: string;
  isRecommended: boolean;
  bookingUrl?: string;
  requiresReservation: boolean;
}

export interface Gap {
  id: string;
  fromEventId: string;
  toEventId: string;
  gapMinutes: number;
  severity: GapSeverity;
  message: string;
  detail: string;
  suggestedOptions: TransportOption[];
  openAlertDate?: string;
}
```

### `packages/core/src/types/reverse-calc.ts`

```typescript
export interface ReverseCalcStep {
  label: string;
  time: string;               // "HH:MM" or "−N분"
  type: 'ANCHOR' | 'RULE' | 'CALC' | 'DERIVED' | 'RESULT';
  note: string;
}

export interface ReverseCalcResult {
  homeDepart: string;         // "HH:MM"
  steps: ReverseCalcStep[];
  transportMode: 'BUS' | 'RAIL';
}
```

---

## Engine Design

### 역산 알고리즘 (`reverse-calc.ts`)

```
입력: FlightEvent, homeAddress, transportMode
출력: ReverseCalcResult

알고리즘:
1. departureTime = flight.startTime
2. checkInDeadline = departureTime - airlineRule.internationalMinutes
3. recommendedArrival = checkInDeadline - 40min  (카운터 여유)
4. transitTime = getTransitTime(homeAddress, airport, transportMode)
5. homeDepart = recommendedArrival - transitTime
6. steps = [각 단계 레이블, 시간, 타입]
```

### 공백 감지 알고리즘 (`gap-detector.ts`)

```
입력: TripEvent[]
출력: Gap[]

알고리즘:
1. 이벤트를 startTime 기준 정렬
2. 인접 이벤트 쌍을 순회
3. 이전 이벤트 endTime ~ 다음 이벤트 startTime 사이 이동수단 확인
4. 이동수단 없으면 Gap 생성
5. gapMinutes 계산 후 severity 판정
   - DANGER: 이동수단 type이 없음
   - WARNING: 이동수단 있으나 여유 < 30분
   - OK: 여유 >= 30분
6. 마지막 구간(역/터미널→숙소)도 별도 검사
```

---

## Screen Architecture

### Tab 구조

```
Bottom Tab Navigator
├── 일정 (TimelineScreen)
│   └── DaySelector → TimelineItem 목록
├── 공백 (GapDetectionScreen)
│   └── GapCard 목록 (탭으로 펼침)
├── 비교 (SuggestionScreen)
│   └── 선택 구간별 OptionCard 비교
└── 역산 (ReverseCalcScreen)
    └── Anchor → 단계별 계산 → 결과
```

---

## Phase 별 구현 계획

### Phase 0: 모노레포 설정 (Day 1)
- pnpm workspaces 구성
- TypeScript base config 공유
- `packages/core` 빈 구조 생성
- Expo 프로젝트 초기화

### Phase 1: Core 엔진 (Day 2–3)
- 타입 정의 전체 완성
- 항공사 규정 DB
- 역산 알고리즘 구현 + 테스트
- 공백 감지 알고리즘 구현 + 테스트
- 샘플 데이터(후쿠오카 여행) 정의

### Phase 2: Store + Hooks (Day 4)
- Zustand trip-store 구현
- useTripTimeline hook
- useGapDetection hook

### Phase 3: 화면 구현 (Day 5–7)
- 공통 컴포넌트 (Badge, SectionHeader)
- TimelineScreen + 하위 컴포넌트
- GapDetectionScreen + GapCard
- SuggestionScreen + OptionCard
- ReverseCalcScreen

### Phase 4: 통합 + 샘플 데이터 (Day 8)
- 샘플 데이터로 전체 플로우 동작 확인
- 네비게이션 구성
- 다크 테마 적용

---

## Dependency Graph

```
packages/core (no deps)
    ↑
apps/mobile/store (depends on core types)
    ↑
apps/mobile/hooks (depends on store + core engine)
    ↑
apps/mobile/components (depends on hooks)
    ↑
apps/mobile/screens (depends on components)
```

컴포넌트는 절대 core engine을 직접 import하지 않는다.
반드시 hook을 통해서만 접근한다.

---

*plan version: 1.0 | feature: 001-tripframe*
