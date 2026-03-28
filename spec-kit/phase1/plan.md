# Implementation Plan: TripFrame MVP

**Feature**: `001-tripframe`
**Plan version**: 1.0
**Created**: 2026-03-24

---

## Constitution Check

| 원칙 | 준수 여부 | 비고 |
|------|----------|------|
| Mobile-First (Expo) | ✅ | Expo SDK 54+, React Native |
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

### `packages/core/src/types/trip.ts`

**실제 구현 기준** (tripframe/packages/core/src/types/trip.ts)

```typescript
export type EventType =
  | 'flight'      // 항공편
  | 'hotel'       // 호텔 체크인/체크아웃
  | 'transport'   // 이동 수단 (버스, 기차, 택시 등 통합)
  | 'home'        // 집 출발 시점 (역산 엔진 결과)
  | 'activity'    // 식사, 관광 등 활동
  | 'prep'        // 역산 단계 중 준비 시간 (ReverseCalcStep에서 사용)
  | 'warning'     // (Phase 2 예약 - 미사용)
  | 'free';       // (Phase 2 예약 - 미사용)

export type EventStatus =
  | 'ok'          // 확정된 이벤트
  | 'missing'     // 누락된 이벤트 (이동 수단 등)
  | 'warn'        // (Phase 2 예약 - 미사용)
  | 'auto'        // (Phase 2 예약 - 미사용)
  | 'free'        // (Phase 2 예약 - 미사용)
  | 'todo';       // (Phase 2 예약 - 미사용)

export interface TripEvent {
  id: string;
  title: string;
  sub?: string;                 // 부제목
  time: string;                 // "HH:mm" 형식
  type: EventType;
  status: EventStatus;
  location?: string;            // 위치명 (간단 문자열)
  isDerived?: boolean;          // 역산에 의해 생성된 이벤트 여부
  metadata?: Record<string, any>; // 추가 정보
}
```

**주요 차이점 (docs vs 실제 코드)**:
- ✅ 소문자 케이스 사용 (일치)
- ✅ `'transport'`로 BUS/TRAIN 통합 (일치)
- ➕ `'home'`, `'prep'` 타입 추가 (역산 엔진용)
- ➕ `isDerived` 필드 사용 (status='derived' 대신)
- ➕ `location?: string` (Location 객체 대신 간단한 문자열)
- ➕ `time: string` (startTime 대신)
- ➕ `sub?: string` (subtitle 대신)

### Gap 및 ReverseCalc 타입

```typescript
export type GapSeverity = 'DANGER' | 'WARNING' | 'OK';

export interface Gap {
  id: string;
  fromEventId: string;
  toEventId: string;
  severity: GapSeverity;
  type: 'transport' | 'time_buffer' | 'unknown';
  message: string;
  suggestions?: string[];      // 해결 옵션 간단 문자열 배열
}

export interface ReverseCalcStep {
  id: string;
  label: string;              // 단계 설명
  durationMinutes: number;    // 소요 시간 (분)
  type: 'buffer' | 'transport' | 'prep' | 'checkin';
}

export interface ReverseCalcResult {
  anchorTime: string;         // 기준 시간 ("HH:mm")
  steps: ReverseCalcStep[];
  calculatedTime: string;     // 계산된 출발 시간 ("HH:mm")
}

export interface DayTimeline {
  day: number;
  date: string;
  events: TripEvent[];
  gaps: Gap[];
}

export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  timelines: DayTimeline[];
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

## Architecture Constraints

### 의존성 제약 규칙 (TF-SAD-001 § 3.3)

```
packages/core (❌ 외부 의존 금지)
  ├─ apps/mobile/store (import type만)
  │   └─ apps/mobile/hooks (엔진 호출 가능)
  │       └─ apps/mobile/components (Props 경유만)
  │           └─ apps/mobile/screens (조합)
```

**강제 규칙:**
- `packages/core`: 외부 라이브러리 의존 불가 (순수 TypeScript만)
- `apps/mobile/store`: core에서 `import type`만 허용 (함수 호출 금지)
- `apps/mobile/hooks`: store 구독 + core 엔진 호출 가능
- `apps/mobile/components`: core/store 직접 import 금지, Hook 경유만
- `apps/mobile/screens`: components + hooks 조합

**검증 방법:**
```bash
# components에서 core 직접 import 검증 (0건이어야 함)
grep -r "import.*@tripframe/core" apps/mobile/src/components/
```

### Metro 설정 (Windows pnpm 호환)

pnpm 심볼릭 링크가 Windows에서 제대로 작동하지 않을 수 있으므로, Metro에 명시적 경로 매핑을 추가합니다.

**`apps/mobile/metro.config.js`:**

```javascript
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

---

## Component Props Interfaces

### TimelineItem Props

```typescript
interface TimelineItemProps {
  event: TripEvent;
  isLast?: boolean;
}
```

### GapCard Props

```typescript
interface GapCardProps {
  gap: Gap;
  isOpen: boolean;
  onToggle: () => void;
}
```

### OptionCard Props

```typescript
interface OptionCardProps {
  option: TransportOption;
  people: number;           // 인원수 (비용 계산용)
}
```

### Badge Props

```typescript
interface BadgeProps {
  variant: 'derived' | 'auto' | 'missing' | 'pending' | 'ok';
  size?: 'small' | 'medium';
  children: React.ReactNode;
}
```

### SectionHeader Props

```typescript
interface SectionHeaderProps {
  title: string;
  badgeCount?: number;
  subtitle?: string;
}
```

### FreeTimeBlock Props

```typescript
interface FreeTimeBlockProps {
  startTime: string;        // "HH:MM"
  endTime: string;          // "HH:MM"
  suggestions?: string[];   // Phase 4
}
```

---

## Design Tokens

### Colors (다크 테마)

TF-SDD-001 § 7.1 참조:

```typescript
// apps/mobile/src/theme/colors.ts
export const colors = {
  background: '#0D0D12',
  surface: '#13131A',
  surfaceHover: '#1E1E2E',
  purple: '#A78BFA',
  purpleDim: '#7C3AED',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#1E293B',
} as const;
```

### Typography

```typescript
// apps/mobile/src/theme/typography.ts
export const typography = {
  screenTitle: { fontSize: 20, fontWeight: '700' },
  sectionHeader: { fontSize: 16, fontWeight: '600' },
  cardTitle: { fontSize: 14, fontWeight: '500' },
  cardBody: { fontSize: 13, fontWeight: '400' },
  badge: { fontSize: 11, fontWeight: '600' },
  timeLabel: { fontSize: 12, fontWeight: '500' },
  resultEmphasis: { fontSize: 24, fontWeight: '700' },
} as const;
```

### Spacing

```typescript
// apps/mobile/src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
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
