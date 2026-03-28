# Feature Specification: TripFrame MVP

**Feature**: `001-tripframe`
**Branch**: `001-tripframe-mvp`
**Status**: Draft
**Created**: 2026-03-24

---

## 1. Overview

### Problem Statement

여행자는 항공편·숙박을 예약한 후에도 다음 문제들을 해결하지 못한다:

- "집에서 몇 시에 출발해야 하지?" → 항공사 수속 마감 규정을 모른다
- "숙소 사이 이동 수단을 깜빡했다" → 예약 공백을 스스로 발견해야 한다
- "버스 예약 언제 열리지?" → 노선별 오픈 시간을 따로 찾아야 한다
- "산큐패스 사는 게 이득인가?" → 실제 이용 구간 기반 비교가 어렵다

기존 앱(트리플, 마이리얼트립)은 관광지·맛집 추천에 집중하며, 이동 준비 구간을 다루지 않는다.

### Solution

예약된 이벤트를 타임라인 그래프로 변환 → 역산 엔진으로 선행 시간 계산 → 공백 구간 자동 감지 → 해결 옵션 제안.

---

## 2. User Stories

### US-01: 역산 타임라인 생성
```
As a 여행자
I want to 항공편 예약 정보를 입력하면
So that 집에서 출발해야 하는 시간을 자동으로 알 수 있다

Acceptance Criteria:
- [ ] 항공사 코드로 수속 마감 규정을 자동 조회한다 (진에어: 50분 전)
- [ ] 공항 터미널을 항공사 코드로 자동 판별한다 (T1/T2)
- [ ] 출발지 주소와 이동수단 선택으로 소요시간을 계산한다
- [ ] 계산된 집 출발 시간을 타임라인 상단에 강조 표시한다
- [ ] 역산 근거를 단계별로 확인할 수 있다
```

### US-02: 공백 구간 감지
```
As a 여행자
I want to 예약 이벤트 사이의 이동 수단 없는 구간을 자동으로 감지 받고
So that 놓친 예약을 출발 전에 발견할 수 있다

Acceptance Criteria:
- [ ] 이동 수단 없는 구간을 빨간 경고로 표시한다
- [ ] 감지 대상: 공항→숙소, 숙소 체크아웃→다음 교통편, 대중교통 하차→숙소
- [ ] 경고 수준을 DANGER/WARNING/OK 3단계로 구분한다
- [ ] 각 경고에 해결 옵션 카드를 함께 제시한다
- [ ] 앱이 자동 삽입한 구간(택시 등)은 "자동삽입" 태그로 명시한다
```

### US-03: 숙소 체크인 전 자유 시간 계산
```
As a 여행자
I want to 숙소 도착 후 체크인 전까지의 실제 자유 시간을 알고
So that 짐 보관 여부와 가능한 활동을 계획할 수 있다

Acceptance Criteria:
- [ ] 이동 완료 시간 ~ 체크인 시간 사이 자유 시간을 계산한다
- [ ] 자유 시간이 30분 미만이면 경고를 표시한다
- [ ] "체크인 전 짐 보관 가능 여부" 질문을 자동 생성한다
- [ ] 자유 시간 블록에 위치 기반 활동 제안 슬롯을 표시한다 (내용은 P4)
```

### US-04: 이동 수단 선택지 비교
```
As a 여행자
I want to 공백 구간에 사용 가능한 이동 수단을 비교하고
So that 요금·시간·편의성을 고려해 최적 선택을 할 수 있다

Acceptance Criteria:
- [ ] 이동 수단별 요금, 소요시간, 편의성 메모를 카드로 표시한다
- [ ] 사용자 상황(짐 크기, 인원)에 따라 추천 우선순위를 조정한다
- [ ] 예약 필요 여부와 예약 링크를 포함한다
- [ ] 2인 합산 비용을 자동 계산한다
```

### US-05: 예약 오픈 알림
```
As a 여행자
I want to 교통편 예약 오픈일에 자동으로 알림을 받고
So that 인기 노선을 놓치지 않고 예약할 수 있다

Acceptance Criteria:
- [ ] 유후인호 버스: 탑승일 30일 전 오전 8시 알림
- [ ] 알림 탭에서 예약 오픈 대기 목록을 확인할 수 있다
- [ ] 알림에서 예약 페이지 바로가기를 제공한다
```

### US-06: 패스 경제성 분석
```
As a 여행자
I want to 교통 패스 구매 여부를 실제 이용 구간과 비용으로 비교하고
So that 불필요한 패스 구매를 방지할 수 있다

Acceptance Criteria:
- [ ] 이용 예정 구간 입력 → 패스 가격 vs 개별 합산 자동 비교
- [ ] 손익분기 구간 수를 표시한다 ("N회 이상 이용 시 패스 유리")
- [ ] 패스 사용 시 예약 방식 변경 필요 여부도 안내한다
```

---

## 3. Requirements Traceability

### 3.1 User Story → REQ-FR Mapping

TF-RDS-001 요구사항 정의서의 정규화된 요구사항 ID와 매핑:

| User Story | 기능 요구사항 | 비기능 요구사항 | Phase | 관련 화면 |
|-----------|-------------|---------------|-------|----------|
| US-01 (역산 타임라인) | REQ-FR-001~005 | — | P1 | SCR-001, SCR-004 |
| US-02 (공백 감지) | REQ-FR-006~010 | — | P1 | SCR-002 |
| US-03 (자유시간 계산) | REQ-FR-011~013 | — | P1 | SCR-001 |
| US-04 (이동수단 비교) | REQ-FR-015~018 | — | P2 | SCR-003 |
| US-05 (예약 오픈 알림) | REQ-FR-019~021 | — | P3 | — |
| US-06 (패스 경제성) | REQ-FR-022~024 | — | P3 | SCR-003 |
| — (공통) | — | REQ-NFR-001~017 | P1~P2 | 전체 |

> **참고**: 상세 요구사항 및 Acceptance Criteria는 [TF-RDS-001](../docs/TripFrame_요구사항_정의서_v1.0.md) 참조

---

## 3. Functional Requirements

### FR-01: 항공사 규정 데이터베이스
- 항공사 코드 → 국제선 수속 마감 시간 매핑
- 초기 탑재: 진에어(50분), 대한항공(60분), 아시아나(60분), 제주항공(50분), LCC일반(50분), 미국행(90분)
- 확장 가능한 구조로 설계

### FR-02: 이벤트 타임라인 그래프
- 모든 예약을 TripEvent 노드로 표현
- 노드 간 이동 수단(엣지) 없으면 Gap으로 판정
- Gap severity: DANGER(이동수단 없음), WARNING(여유 30분 미만), OK(여유 30분 이상)

### FR-03: 역산 알고리즘
- 항공 출발 시간부터 역방향으로 계산
- 수속 마감 → 카운터 도착 권장(+40분) → 공항 이동시간 → 집 출발 시간
- 숙소 체크인도 동일하게 역산

### FR-04: 커스터마이징 질문
- 짐 크기(기내 반입만 / 대형 캐리어)
- 선호 교통수단(대중교통 / 택시 우선 / 무관)
- 이동 여유 선호도(촉박해도 OK / 여유 있게)
- 답변에 따라 추천 옵션 순위 자동 조정

---

## 4. Non-Functional Requirements

### 4.1 오프라인 동작 (REQ-NFR-001~002)
- **REQ-NFR-001**: 비행기 모드에서 역산/공백감지 엔진 완전 동작
  - 측정: 시나리오 1~4를 네트워크 끊고 실행 가능
- **REQ-NFR-002**: UI 조작 응답 < 100ms
  - 측정: 탭 전환, 카드 펼침/접기 지연 시간

### 4.2 성능 (REQ-NFR-003~006)
- **REQ-NFR-003**: 타임라인 렌더링 ≤ 16ms per frame (60fps 유지)
  - 측정: React Native Performance Monitor
- **REQ-NFR-004**: 역산 함수 실행 ≤ 5ms (이벤트 10개 기준)
  - 측정: `performance.now()` 벤치마크
- **REQ-NFR-005**: 공백감지 함수 실행 ≤ 10ms (이벤트 100개 기준)
  - 측정: Jest 성능 테스트
- **REQ-NFR-006**: 앱 Cold Start ≤ 3초 (스플래시 → 홈 화면)
  - 측정: Expo 앱 로딩 시간

### 4.3 접근성 (REQ-NFR-007~008)
- **REQ-NFR-007**: VoiceOver/TalkBack으로 전체 탭 탐색 가능
  - 검증: 수동 접근성 테스트
- **REQ-NFR-008**: WCAG 2.1 AA 준수
  - 색상만으로 정보 구분 금지 (경고는 색상 + 아이콘 + 텍스트 병행)
  - 최소 대비율 4.5:1

### 4.4 다국어 (REQ-NFR-009)
- 한국어 우선, i18n 구조 준비
- 하드코딩 문자열 0건 (grep "텍스트" 검증 가능)
- i18n 키 관리 체계 수립

### 4.5 보안 (REQ-NFR-010~012)
- **REQ-NFR-010**: 예약번호/개인정보 암호화 저장
  - 도구: expo-secure-store
- **REQ-NFR-011**: API 키 .env 관리 (하드코딩 0건)
  - 검증: `grep -r "sk_" packages/ apps/` → 결과 없음
- **REQ-NFR-012**: Phase 2 Supabase RLS 체크리스트 준비
  - 사용자별 데이터 격리 정책

### 4.6 코드 품질 (REQ-NFR-013~017)
- **REQ-NFR-013**: TypeScript strict mode 필수
- **REQ-NFR-014**: `any` 타입 사용 금지
  - 검증: `grep -r ": any" packages/core` → 0건
- **REQ-NFR-015**: 함수 50줄 초과 금지
  - ESLint: max-lines-per-function: 50
- **REQ-NFR-016**: packages/core 테스트 커버리지 ≥ 80%
  - Jest coverage threshold
- **REQ-NFR-017**: 컴포넌트에서 core/store 직접 import 금지
  - 검증: components 폴더에서 `import.*@tripframe/core` grep → 0건
  - Hook 경유만 허용

---

## 5. Design Tokens

### 5.1 Color Palette (다크 테마 기본)

다크 테마를 기본으로 사용합니다 (TF-SDD-001 § 7.1 참조).

| 토큰명 | HEX 값 | 용도 |
|--------|--------|------|
| background | #0D0D12 | 앱 전체 배경 |
| surface | #13131A | 카드, 바텀시트 배경 |
| surfaceHover | #1E1E2E | 카드 hover/press 상태 |
| purple | #A78BFA | 주요 액센트 (Anchor, 역산 배지, 추천) |
| purpleDim | #7C3AED | 보조 액센트 (역산 결과, 배지 배경) |
| danger | #EF4444 | 위험 (DANGER 공백, MISSING 배지) |
| warning | #F59E0B | 경고 (WARNING, 카운터 도착 권장) |
| success | #10B981 | 성공 (공백 해결, 자동삽입, OK) |
| textPrimary | #F1F5F9 | 본문 텍스트 |
| textSecondary | #94A3B8 | 보조 텍스트, 시간 라벨 |
| textTertiary | #64748B | 비활성 텍스트 |
| border | #1E293B | 카드 테두리 (기본) |

### 5.2 Typography

| 용도 | 크기 | Weight | 색상 |
|------|------|--------|------|
| 화면 타이틀 | 20px | Bold (700) | textPrimary |
| 섹션 헤더 | 16px | Semibold (600) | textPrimary |
| 카드 제목 | 14px | Medium (500) | textPrimary |
| 카드 본문 | 13px | Regular (400) | textSecondary |
| 배지 텍스트 | 11px | Semibold (600) | 흰색 |
| 시간 라벨 | 12px | Medium (500) | textSecondary 또는 액센트 |
| 결과 강조 | 24px | Bold (700) | purple |

### 5.3 Spacing

| 토큰 | 값 | 용도 |
|------|-----|------|
| xs | 4px | 인라인 요소 간격 |
| sm | 8px | 카드 내부 요소 간격 |
| md | 12px | 컴포넌트 간 간격 |
| lg | 16px | 섹션 간 간격 |
| xl | 24px | 화면 좌우 패딩 |
| xxl | 32px | 섹션 그룹 간 간격 |

### 5.4 접근성 (WCAG 2.1 AA)

- 색상만으로 정보 구분 금지 (경고는 색상 + 아이콘 + 텍스트 병행)
- 최소 대비율 4.5:1 준수
- VoiceOver/TalkBack 전체 탐색 가능

---

## 6. Out of Scope (MVP)

- 관광지·맛집 추천 (P4)
- 소셜/공유 기능
- 항공편 실시간 지연 반영
- 예약 이메일 자동 파싱
- 클라우드 동기화 (Phase 2)

---

## 7. Sample Data (검증용)

**실제 구현 데이터** (tripframe/packages/core/src/data/mock.ts)

```typescript
Trip: 후쿠오카 · 유후인 (2026.06.18–06.20)

Day 1 (2026.06.18):
  09:15  집 출발               [type: home, isDerived: true, status: ok]
  12:15  후쿠오카행 비행기 OZ132  [type: flight, status: ok]
  15:30  호텔 체크인 - 미야코 호텔 하카타  [type: hotel, status: ok, location: 하카타]
  18:30  저녁 식사 - 야키니쿠 챔피언  [type: activity, status: ok, location: 하카타]

Day 2 (2026.06.19):
  10:00  호텔 체크아웃          [type: hotel, status: ok, location: 하카타]
  12:00  점심 식사             [type: activity, status: ok, location: 하카타]
  15:00  유후인 도착           [type: activity, status: missing, location: 유후인]

  🔴 Gap: 하카타 → 유후인 이동수단 없음 (DANGER)
      Suggestions: 유후인노모리 예약, 고속버스 예약, 렌터카

Day 3 (2026.06.20):
  13:00  유후인 출발           [type: activity, status: ok, location: 유후인]
  15:30  후쿠오카 공항 도착     [type: activity, status: missing, location: 후쿠오카 공항]
  17:15  인천행 비행기 OZ133    [type: flight, status: ok]

  🔴 Gap: 유후인 → 후쿠오카 공항 이동수단 없음 (DANGER)

역산 결과 (ReverseCalcResult):
  Anchor: 12:15 (비행기 출발)
  Steps:
    - 공항 체크인: 50분
    - 공항 이동 버스: 75분
    - 집에서 버스정류장 여유: 40분
    - 외출 준비: 15분 [type: prep]
  Calculated: 09:15 (집 출발)
```

**주요 특징**:
- ✅ `'home'` 타입으로 역산 결과 명시 (`isDerived: true`)
- ✅ `'activity'` 타입으로 식사/관광 표현
- ✅ `status: 'missing'`으로 누락 이벤트 표시
- ✅ Gap severity: 'DANGER' (이동수단 없음)

---

*spec version: 1.0 | feature: 001-tripframe*
