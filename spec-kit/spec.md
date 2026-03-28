# Feature Specification: TripFrame Phase 4

**Feature**: `004-tripframe-phase4`
**Branch**: `004-tripframe-phase4`
**Status**: Planning
**Created**: 2026-03-29
**Depends On**: `003-tripframe-phase3` (Phase 3 complete ✅)

---

## 1. Overview

### Phase 3 완료 현황

Phase 3는 2026-03-29 완료됐다 (E2E 85/85 PASS). 구현된 것:

- 다중 여행 관리 (홈 화면 + Trip CRUD)
- 이벤트 CRUD (EventFormModal, 타임라인 편집)
- 제안카드 토글 (accordion)
- 역산 탭 개선 (Day 선택, 자유 시간, 대안 교통수단)
- AsyncStorage 오프라인 영속성

현재 제한사항 (사용자 테스트 피드백):

- 설정 탭 옵션(짐 크기, 교통 선호, 여유도) 선택해도 저장/적용 안 됨
- Google 로그인 400 오류: redirect_uri_mismatch → 클라우드 동기화 불가
- 공백감지 탭: 이동 수단 누락 외에 이벤트 간 여유 시간 미표시
- "공백감지" 메뉴명이 직관적이지 않음
- 여행 기간 변경 시 날짜 입력 UX 불편 (텍스트 필드)

### Problem Statement

- "설정에서 여유도를 '여유있게' 했는데 역산 결과가 바뀌지 않아" → 설정값 미적용
- "구글 로그인을 했는데 내 일정이 다른 기기에서 안 보여" → OAuth redirect 오류
- "공백이 없어도 체크인 전에 시간이 얼마나 있는지 알고 싶어" → FreeTime UI 없음
- "공백감지가 뭔지 모르겠어" → 메뉴명 직관성 부족
- "출발일을 바꾸려는데 날짜 형식을 모르겠어" → 날짜 Picker 없음

### Solution

Phase 4는 **설정 실기능화 + 클라우드 연동 복구 + UX 완성도** 향상이 목표:

1. **설정 기능 실구현**: useSettingsStore + 역산/제안 로직 연동
2. **Google OAuth 수정**: Supabase Redirect URLs 등록 + 동기화 검증
3. **공백감지 여유 시간 UI**: calculateFreeTime() → GapAnalysisScreen 연동
4. **UX 개선**: 메뉴명 결정, 날짜 Picker
5. **교통 데이터 내장 DB**: 하드코딩 → 구조화된 노선 데이터

---

## 2. User Stories

### US-P4-001: 설정값이 역산/제안 결과에 반영된다

**As a** 여행자
**I want to** 설정에서 여유도나 교통 선호도를 바꾸면 역산 결과와 추천 옵션이 달라지길 원한다
**So that** 내 실제 여행 스타일에 맞는 일정 분석 결과를 볼 수 있다

**Acceptance Criteria**:
- [ ] 설정 탭에서 짐 크기 / 교통 선호 / 여유도 선택 후 앱 재시작해도 값이 유지된다
- [ ] 여유도 = "여유있게" 시, 역산 각 단계 bufferTime에 20% 추가 보정이 적용된다
- [ ] 여유도 = "빡빡하게" 시, 역산 bufferTime이 기본값 그대로 적용된다
- [ ] 교통 선호 = "대중교통" 시, 제안카드에서 대중교통 옵션이 "추천" 배지로 우선 노출된다
- [ ] 교통 선호 = "택시" 시, 제안카드에서 택시 옵션이 "추천" 배지로 우선 노출된다

---

### US-P4-002: Google 로그인 후 클라우드 동기화가 작동한다

**As a** 여행자
**I want to** Google 계정으로 로그인하면 내 일정이 다른 기기에서도 보이길 원한다
**So that** 스마트폰과 웹에서 동일한 여행 데이터를 확인할 수 있다

**Acceptance Criteria**:
- [ ] Google 로그인 시 redirect_uri_mismatch 오류 없이 로그인이 완료된다
- [ ] 로그인 후 로컬 trips 데이터가 Supabase에 자동으로 동기화된다
- [ ] 설정 탭에서 로그인 상태(이메일) 또는 "오프라인 모드" 텍스트가 정확히 표시된다
- [ ] 로그아웃 시 로컬 데이터는 유지되고 동기화만 중단된다

---

### US-P4-003: 공백감지 탭에서 여유 시간을 확인할 수 있다

**As a** 여행자
**I want to** 공항 도착 후 호텔 체크인 전 자유 시간이 얼마나 있는지 보고 싶다
**So that** 그 시간에 뭘 할 수 있는지 미리 파악할 수 있다

**Acceptance Criteria**:
- [ ] 공백감지 탭 하단에 "여유 시간" 섹션이 표시된다
- [ ] `calculateFreeTime(도착시각, 체크인시각)` 결과가 카드 형태로 표시된다
- [ ] 여유 시간이 30분 미만이면 주황색 경고 표시
- [ ] 여유 시간이 없는 경우(0 이하) 섹션을 표시하지 않는다

---

### US-P4-004: 날짜 입력이 편하다

**As a** 여행자
**I want to** 여행 출발일과 귀국일을 달력에서 선택하고 싶다
**So that** 날짜 형식을 외우지 않고 직관적으로 입력할 수 있다

**Acceptance Criteria**:
- [ ] TripFormModal의 날짜 필드를 탭하면 날짜 피커(DatePicker)가 열린다
- [ ] 선택한 날짜가 `YYYY-MM-DD` 형식으로 저장된다
- [ ] 웹 환경에서는 `<input type="date">` 또는 동등한 fallback이 제공된다
- [ ] 귀국일이 출발일보다 이전일 경우 인라인 오류 메시지가 표시된다

---

### US-P4-005: 교통 탭 이름이 직관적이다

**As a** 여행자
**I want to** 탭 이름만 보고도 어떤 기능인지 바로 알고 싶다
**So that** 앱 사용법을 학습하지 않아도 탐색이 가능하다

**Acceptance Criteria**:
- [ ] "공백감지" 탭 이름이 더 직관적인 이름으로 변경된다 (결정 후 일괄 적용)
- [ ] 변경된 탭 이름이 탭바, 공통 헤더, 화면 내부에서 일관성 있게 표시된다
- [ ] 관련 E2E 테스트가 새 이름 기준으로 업데이트된다

---

### US-P4-006: 교통 데이터가 실제 노선 기반이다

**As a** 여행자
**I want to** 공항버스나 KTX 시간이 실제 노선 기준으로 계산되길 원한다
**So that** 역산 결과가 실제 교통편과 일치한다

**Acceptance Criteria**:
- [ ] 공항버스 소요 시간이 하드코딩(75분/50분) 대신 `transport-rules.ts` 노선 DB에서 조회된다
- [ ] 인천국제공항 ↔ 서울 주요 구간 10개 이상의 노선 데이터가 내장된다
- [ ] 노선 DB가 없는 구간은 기존 fallback 값을 사용하고 "추정값" 레이블을 표시한다

---

## 3. Out of Scope (Phase 5)

- 예약 알림 / 푸시 알림 (Booking alerts)
- 패스 경제성 분석 (JR Pass, 관광지 패스 비교)
- 활동 추천 AI (자연어 입력 → TripEvent)
- Apple OAuth
- CI/CD 파이프라인 (GitHub Actions)

---

## 4. Non-Functional Requirements

- 설정값 변경은 앱 재시작 없이 즉시 역산/제안 결과에 반영
- 날짜 Picker는 iOS, Android, 웹 세 환경 모두 동작
- 교통 데이터 변경 시 `packages/core` 순수 함수만 수정 (UI 영향 없음)
- 탭 이름 변경 후 E2E 전체 85개 테스트 통과 유지

---

*Phase 4 목표: 설정 기능 실기능화 + 클라우드 동기화 복구 + UX 완성도 향상*
*담당: 개발자 단독*
