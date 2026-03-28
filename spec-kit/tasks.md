# Task Breakdown: TripFrame Phase 3

**Feature**: `003-tripframe-phase3`
**Tasks version**: 1.1
**Created**: 2026-03-28
**Depends On**: Phase 2 완료 (TASK-031~056)
**Total Estimate**: ~48h (~6 working days)

---

## Phase 3.1 — 데이터 모델 확장

### TASK-057: Trip/Event Store 확장 · 3h
- [x] `useTripStore`에 `trips: Trip[]`, `currentTripId` 추가
- [x] `addTrip`, `updateTrip`, `deleteTrip`, `selectTrip` 액션 구현
- [x] `addEvent`, `updateEvent`, `deleteEvent` 액션 구현
- [x] AsyncStorage persist 설정 (`zustand/middleware` persist)
- [x] Mock 데이터를 초기 여행으로 자동 삽입 (앱 첫 실행 시)

### TASK-058: App.tsx 홈/탭 분기 · 1h · (057)
- [x] `currentTripId === null`이면 HomeScreen 렌더
- [x] `currentTripId`가 있으면 기존 TabNavigator 렌더
- [x] 뒤로가기 제스처 → 홈으로 복귀

---

## Phase 3.2 — 홈 화면 + Trip CRUD

### TASK-059: HomeScreen 구현 · 4h · (057, 058)
- [x] `src/screens/HomeScreen.tsx` 생성
- [x] 여행 목록 표시: 출발일 역순 정렬
- [x] `TripCard` 컴포넌트: 여행명, 목적지, 기간, Gap 수 표시
- [x] "새 여행 만들기" 카드 최상단 고정
- [x] 여행 카드 탭 → `selectTrip()` 호출 → 탭 화면 진입

### TASK-060: TripFormModal 구현 · 3h · (057)
- [x] `src/screens/TripFormModal.tsx` 생성
- [x] 필드: 여행명(필수), 목적지, 출발일, 귀국일
- [x] 신규 생성 + 기존 수정 모드 (prop으로 trip 전달 시 수정 모드)
- [x] 저장 → `addTrip` / `updateTrip` 호출
- [x] 여행 삭제 버튼 (수정 모드) + 확인 모달

---

## Phase 3.3 — Event CRUD

### TASK-061: EventFormModal 구현 · 4h · (057)
- [x] `src/screens/EventFormModal.tsx` 생성
- [x] 필드: 날짜, 시간(HH:MM), 이벤트명, 장소, 이벤트 유형(EventType)
- [x] 신규 추가 + 기존 수정 모드
- [x] 저장 → `addEvent` / `updateEvent` 호출
- [x] Gap 재계산 트리거 (store 변경 → detectGaps 자동 적용)

### TASK-062: 타임라인에 이벤트 추가/수정 진입점 · 2h · (061)
- [x] 각 이벤트 카드에 편집 버튼 추가
- [x] Day 탭 하단 "+ 이벤트 추가" 버튼
- [x] EventFormModal 열기/닫기 연동

---

## Phase 3.4 — 제안카드 토글 인터랙션

### TASK-063: SuggestionScreen 토글 개선 · 2h
- [x] `expandedGapId: string | null` state 추가 (Set으로 다중 토글 지원)
- [x] Gap 헤더 탭 → 해당 Gap 토글, 나머지 유지
- [x] 기본 상태: 첫 번째 Gap만 펼침 (DANGER Gap 우선)
- [x] 애니메이션: LayoutAnimation 트랜지션

---

## Phase 3.5 — 역산 탭 개선

### TASK-064: 역산 탭 Day 선택 UI · 2h
- [x] `ReverseCalcScreen`에 Day 선택 탭 추가 (타임라인 탭과 동일 디자인)
- [x] `selectedDayIndex` 로컬 state
- [x] Day 선택 시 해당 Day의 앵커 이벤트(첫 항공편/첫 호텔)로 역산 결과 갱신

### TASK-065: 역산 탭 자유 시간 표시 · 2h · (064)
- [x] `calculateFreeTime(arrivalTime, checkInTime)` 호출 (packages/core 기존 함수)
- [x] FreeTime 결과 카드: 자유 시간 길이 + suggestions 목록
- [x] 자유 시간이 없는 경우(예: 직접 이동) 카드 미표시

### TASK-066: 역산 탭 대안 교통수단 비교 · 3h · (064)
- [x] `packages/core`에 `recalculateWithAlternative(steps, alternativeStep)` 순수 함수 추가
- [x] 역산 결과 하단 "다른 교통수단으로 계산" 토글 섹션
- [x] 대안 선택 시 변경된 출발 시각 + Δ시간 표시
- [x] 단위 테스트 3개 (빠름/느림/동일)

---

## Phase 3.6 — 페르소나 테스트 & 결과서

### TASK-067: E2E 테스트 업데이트 · 3h · (059~066)
- [x] `e2e/home.spec.ts` — 홈 화면 여행 목록 + 진입 시나리오
- [x] `e2e/tripCrud.spec.ts` — 여행 생성/수정/삭제
- [x] 기존 spec 파일 업데이트 (홈 진입 흐름 반영)
- [x] 전체 E2E 통과 확인 (86/86 PASS)

### TASK-068: Phase 3 페르소나 테스트 결과서 · 2h · (067)
- [x] 페르소나 시나리오 3종 수동 검증 (홈 진입 → 여행 선택 → 공백 확인 → 이벤트 추가)
- [x] `report/260328/phase3/E2E_TEST_REPORT.md` 생성
- [x] `report/260328/phase3/PERSONA_TEST_REPORT.md` 생성

---

## Phase 3.7 — 사용자 테스트 & 피드백

### TASK-069: 사용자 테스트 준비 · 1h · (068)
- [x] 테스트 시나리오 스크립트 작성 (5개 태스크: 여행 생성, 이벤트 추가, 공백 확인, 제안 확인, 역산)
- [x] 관찰 체크리스트 작성 (혼란 포인트, 완료 여부, 소요 시간)
- [x] 테스트 빌드 배포 방법 문서화 (Expo Go QR 또는 웹 URL)

### TASK-070: 사용자 테스트 실시 · 3h · (069)
- [ ] 테스터 최소 1명 이상 진행 (지인 또는 동료)
- [ ] 화면 녹화 또는 관찰 메모 수집
- [ ] 태스크별 완료율 / 혼란 포인트 기록

### TASK-071: 피드백 분석 & 결과서 작성 · 2h · (070)
- [ ] 피드백 항목 분류 (버그 / UX개선 / 신기능 요청)
- [ ] `report/260328/phase3/USER_FEEDBACK_REPORT.md` 작성
- [ ] Phase 4 백로그에 반영할 항목 정리

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 3.1 데이터 모델 | 057-058 | 2/2 | 100% |
| 3.2 홈 + Trip CRUD | 059-060 | 2/2 | 100% |
| 3.3 Event CRUD | 061-062 | 2/2 | 100% |
| 3.4 제안카드 토글 | 063 | 1/1 | 100% |
| 3.5 역산 개선 | 064-066 | 3/3 | 100% |
| 3.6 페르소나 테스트 | 067-068 | 2/2 | 100% |
| 3.7 사용자 테스트 | 069-071 | 1/3 | 33% |
| **합계** | **15** | **13** | **87%** |
