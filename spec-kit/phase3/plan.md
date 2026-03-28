# Implementation Plan: TripFrame Phase 3

**Feature**: `003-tripframe-phase3`
**Plan version**: 1.0
**Created**: 2026-03-28
**Status**: Planning

---

## 1. Tech Stack

Phase 2와 동일 스택 유지. 신규 추가 없음.

| 영역 | 기술 | 비고 |
|------|------|------|
| UI | NativeWind v4 + React Native | 기존 유지 |
| 상태 관리 | Zustand | Trip/Event store 확장 |
| Backend | Supabase (기존 연결) | trips/events 테이블 활용 |
| 날짜 | date-fns | 기존 유지 |
| 폼 입력 | React Native TextInput + DateTimePicker | 신규 |

---

## 2. Architecture

### 신규 화면 구조

```
App.tsx
├── HomeScreen          ← NEW: 여행 목록 (진입점 변경)
│   └── TripCard[]
├── (기존 탭 화면)
│   ├── TimelineScreen  ← 기존, Trip 컨텍스트 연동
│   ├── GapScreen       ← 기존 유지
│   ├── SuggestionScreen← 기존 + 토글 개선
│   ├── ReverseCalcScreen← 기존 + Day 선택 + 대안 비교
│   └── SettingsScreen  ← 기존 유지
└── (신규 모달/화면)
    ├── TripFormModal   ← NEW: 여행 생성/수정
    └── EventFormModal  ← NEW: 이벤트 추가/수정
```

### 상태 관리 확장 (`useTripStore`)

```typescript
// 현재: 단일 Mock Trip 고정
// Phase 3: 다중 Trip 관리

interface TripStore {
  trips: Trip[]                    // 전체 여행 목록
  currentTripId: string | null     // 선택된 여행 ID
  currentTrip: Trip | null         // computed

  // Actions
  addTrip(trip: Trip): void
  updateTrip(id: string, updates: Partial<Trip>): void
  deleteTrip(id: string): void
  selectTrip(id: string): void

  // Event Actions
  addEvent(tripId: string, event: TripEvent): void
  updateEvent(tripId: string, eventId: string, updates: Partial<TripEvent>): void
  deleteEvent(tripId: string, eventId: string): void
}
```

### 네비게이션 흐름 변경

```
현재: 앱 진입 → 탭 화면 (타임라인이 기본)
Phase 3: 앱 진입 → HomeScreen → 여행 선택 → 탭 화면
```

HomeScreen은 탭 바깥에 위치 (별도 Stack 레이어).

---

## 3. 핵심 설계 결정

### 3-1. HomeScreen 네비게이션

- 탭 네비게이터를 Stack 네비게이터로 감쌈
- HomeScreen → (여행 선택) → TabNavigator
- 뒤로가기 시 홈으로 복귀
- **라이브러리 없이** React Native의 State 기반 조건부 렌더링으로 구현 (의존성 최소화)

```typescript
// App.tsx 분기
if (!currentTripId) return <HomeScreen />
return <TabNavigator />  // 기존 구조 유지
```

### 3-2. Trip/Event CRUD 스토리지

- **로컬**: Zustand + AsyncStorage persist (기존 패턴 활용)
- **원격**: Supabase trips/events 테이블 (Phase 2에서 스키마 이미 배포됨)
- **동기화**: 기존 SyncEngine 재활용 — Trip UPSERT/DELETE 이미 구현됨 (supabaseSync.ts)

### 3-3. 제안카드 토글

- `SuggestionScreen`의 `expandedGapId: string | null` state 추가
- Gap 헤더 탭 → `expandedGapId` 토글
- OptionCard는 `expandedGapId === gap.id`일 때만 렌더

### 3-4. 역산 Day 선택

- `ReverseCalcScreen`에 현재 타임라인 탭과 동일한 Day 선택 UI 추가
- `selectedDayIndex` 상태를 ReverseCalcScreen 내부에서 관리
- Day별 앵커 이벤트 자동 감지 (가장 이른 항공편/호텔)

### 3-5. 자유 시간 표시

- `calculateFreeTime(arrivalTime, checkInTime)` — 이미 `packages/core`에 구현
- 역산 탭 하단에 FreeTime 카드 추가
- FreeTimeResult의 suggestions 목록 표시

### 3-6. 대안 교통수단 비교

- 역산 단계 중 교통 구간을 감지 → `getMockTransportOptions(gapId)` 조회
- "다른 교통수단" 토글 UI — 선택 시 해당 option의 duration으로 역산 재계산
- 순수 함수 `recalculateWithAlternative(steps, alternativeStep)` 추가 (packages/core)

---

## 4. 구현 순서

```
Phase 3.1 — 데이터 모델 확장 (1주)
  └─ Trip/Event Store 확장, AsyncStorage persist, 기존 Mock → 첫 여행으로 전환

Phase 3.2 — 홈 화면 + Trip CRUD (1주)
  └─ HomeScreen, TripCard, TripFormModal

Phase 3.3 — Event CRUD (1주)
  └─ EventFormModal, 타임라인에서 이벤트 추가/수정/삭제

Phase 3.4 — 제안카드 토글 (2일)
  └─ SuggestionScreen accordion 개선

Phase 3.5 — 역산 개선 (3일)
  └─ Day 선택, 자유 시간, 대안 교통수단 비교

Phase 3.6 — 테스트 + 결과서 (3일)
  └─ E2E 업데이트, 페르소나 재검증
```

---

## 5. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 네비게이션 리팩터 복잡도 | 중 | Stack 없이 조건부 렌더링으로 단순화 |
| Trip CRUD + Sync 충돌 | 중 | SyncEngine 기존 코드 재활용, 신규 로직 최소화 |
| EventFormModal 날짜 입력 UX | 낮음 | 간단한 TextInput 우선, 이후 DatePicker 적용 |

---

*Phase 3 목표: Mock 데이터 의존에서 벗어나 실제 여행 계획을 입력·관리 가능한 앱*
