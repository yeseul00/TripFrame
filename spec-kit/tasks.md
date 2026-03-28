# Task Breakdown: TripFrame Phase 3

**Feature**: `003-tripframe-phase3`
**Tasks version**: 1.0
**Created**: 2026-03-28
**Depends On**: Phase 2 완료 (TASK-031~056)
**Total Estimate**: ~40h (~5 working days)

---

## Phase 3.1 — 데이터 모델 확장

### TASK-057: Trip/Event Store 확장 · 3h
- [ ] `useTripStore`에 `trips: Trip[]`, `currentTripId` 추가
- [ ] `addTrip`, `updateTrip`, `deleteTrip`, `selectTrip` 액션 구현
- [ ] `addEvent`, `updateEvent`, `deleteEvent` 액션 구현
- [ ] AsyncStorage persist 설정 (`zustand/middleware` persist)
- [ ] Mock 데이터를 초기 여행으로 자동 삽입 (앱 첫 실행 시)

### TASK-058: App.tsx 홈/탭 분기 · 1h · (057)
- [ ] `currentTripId === null`이면 HomeScreen 렌더
- [ ] `currentTripId`가 있으면 기존 TabNavigator 렌더
- [ ] 뒤로가기 제스처 → 홈으로 복귀

---

## Phase 3.2 — 홈 화면 + Trip CRUD

### TASK-059: HomeScreen 구현 · 4h · (057, 058)
- [ ] `src/screens/HomeScreen.tsx` 생성
- [ ] 여행 목록 표시: 출발일 역순 정렬
- [ ] `TripCard` 컴포넌트: 여행명, 목적지, 기간, Gap 수 표시
- [ ] "새 여행 만들기" 카드 최상단 고정
- [ ] 여행 카드 탭 → `selectTrip()` 호출 → 탭 화면 진입

### TASK-060: TripFormModal 구현 · 3h · (057)
- [ ] `src/screens/TripFormModal.tsx` 생성
- [ ] 필드: 여행명(필수), 목적지, 출발일, 귀국일
- [ ] 신규 생성 + 기존 수정 모드 (prop으로 trip 전달 시 수정 모드)
- [ ] 저장 → `addTrip` / `updateTrip` 호출
- [ ] 여행 삭제 버튼 (수정 모드) + 확인 모달

---

## Phase 3.3 — Event CRUD

### TASK-061: EventFormModal 구현 · 4h · (057)
- [ ] `src/screens/EventFormModal.tsx` 생성
- [ ] 필드: 날짜, 시간(HH:MM), 이벤트명, 장소, 이벤트 유형(EventType)
- [ ] 신규 추가 + 기존 수정 모드
- [ ] 저장 → `addEvent` / `updateEvent` 호출
- [ ] Gap 재계산 트리거 (store 변경 → detectGaps 자동 적용)

### TASK-062: 타임라인에 이벤트 추가/수정 진입점 · 2h · (061)
- [ ] 각 이벤트 카드에 편집 버튼 추가
- [ ] Day 탭 하단 "+ 이벤트 추가" 버튼
- [ ] EventFormModal 열기/닫기 연동

---

## Phase 3.4 — 제안카드 토글 인터랙션

### TASK-063: SuggestionScreen 토글 개선 · 2h
- [ ] `expandedGapId: string | null` state 추가
- [ ] Gap 헤더 탭 → 해당 Gap 토글, 나머지 유지
- [ ] 기본 상태: 첫 번째 Gap만 펼침 (DANGER Gap 우선)
- [ ] 애니메이션: LayoutAnimation 또는 Animated.View 높이 트랜지션

---

## Phase 3.5 — 역산 탭 개선

### TASK-064: 역산 탭 Day 선택 UI · 2h
- [ ] `ReverseCalcScreen`에 Day 선택 탭 추가 (타임라인 탭과 동일 디자인)
- [ ] `selectedDayIndex` 로컬 state
- [ ] Day 선택 시 해당 Day의 앵커 이벤트(첫 항공편/첫 호텔)로 역산 결과 갱신

### TASK-065: 역산 탭 자유 시간 표시 · 2h · (064)
- [ ] `calculateFreeTime(arrivalTime, checkInTime)` 호출 (packages/core 기존 함수)
- [ ] FreeTime 결과 카드: 자유 시간 길이 + suggestions 목록
- [ ] 자유 시간이 없는 경우(예: 직접 이동) 카드 미표시

### TASK-066: 역산 탭 대안 교통수단 비교 · 3h · (064)
- [ ] `packages/core`에 `recalculateWithAlternative(steps, alternativeStep)` 순수 함수 추가
- [ ] 역산 결과 하단 "다른 교통수단으로 계산" 토글 섹션
- [ ] 대안 선택 시 변경된 출발 시각 + Δ시간 표시
- [ ] 단위 테스트 2개 이상

---

## Phase 3.6 — 테스트 & 결과서

### TASK-067: E2E 테스트 업데이트 · 3h · (059~066)
- [ ] `e2e/home.spec.ts` — 홈 화면 여행 목록 + 진입 시나리오
- [ ] `e2e/tripCrud.spec.ts` — 여행 생성/수정/삭제
- [ ] 기존 spec 파일 업데이트 (홈 진입 흐름 반영)
- [ ] 전체 E2E 통과 확인

### TASK-068: Phase 3 테스트 결과서 · 1h · (067)
- [ ] `report/YYMMDD/phase3/E2E_TEST_REPORT.md` 생성
- [ ] `report/YYMMDD/phase3/USER_FEEDBACK_REPORT.md` 생성

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 3.1 데이터 모델 | 057-058 | 0/2 | 0% |
| 3.2 홈 + Trip CRUD | 059-060 | 0/2 | 0% |
| 3.3 Event CRUD | 061-062 | 0/2 | 0% |
| 3.4 제안카드 토글 | 063 | 0/1 | 0% |
| 3.5 역산 개선 | 064-066 | 0/3 | 0% |
| 3.6 테스트 | 067-068 | 0/2 | 0% |
| **합계** | **12** | **0** | **0%** |
