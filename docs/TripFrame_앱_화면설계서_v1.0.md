# TripFrame 앱 화면설계서

**App Screen Design Specification**
문서 ID: TF-SDD-001 | 버전: 1.0 | 2026-03-26 | 상태: Draft

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [화면 구성 개요](#2-화면-구성-개요)
3. [화면 상세 설계](#3-화면-상세-설계)
4. [공통 컴포넌트 설계](#4-공통-컴포넌트-설계)
5. [인터랙션 정의](#5-인터랙션-정의)
6. [상태별 화면 변화](#6-상태별-화면-변화)
7. [테마 및 색상 체계](#7-테마-및-색상-체계)
8. [엣지 케이스 및 미확정 항목](#8-엣지-케이스-및-미확정-항목)

---

## 1. 문서 개요

### 1.1 목적

TripFrame 앱의 화면 구성, 화면별 상세 레이아웃, 컴포넌트 구조, 인터랙션 정의 및 상태별 화면 변화를 정의한다. 개발자와 디자이너가 동일한 화면 기준으로 작업할 수 있도록 하는 것이 목적이다.

### 1.2 범위

MVP(Phase 1) 범위의 4개 메인 탭 화면과 공통 컴포넌트를 대상으로 한다. 온보딩, 설정, 예약 이메일 파싱 등 Phase 2 이후 화면은 포함하지 않는다.

### 1.3 참조 문서

| 문서명 | 문서 ID | 비고 |
|--------|---------|------|
| TripFrame Constitution | spec-kit/constitution.md | 아키텍처 원칙, UX 원칙 |
| 기능 명세서 (Spec) | spec-kit/spec.md | FR/NFR 정의, 샘플 데이터 |
| 구현 계획서 (Plan) | spec-kit/plan.md | Data Model, Screen Architecture |
| 태스크 명세서 (Tasks) | spec-kit/tasks.md | 화면별 컴포넌트 Props 정의 |
| 구현 가이드 (Implement) | spec-kit/implement.md | 검증 시나리오, 엣지 케이스 |

### 1.4 용어 정의

| 용어 | 정의 |
|------|------|
| 역산 (Reverse Calculation) | 항공편 출발 시간으로부터 역방향으로 각 단계의 소요 시간을 차감하여 집 출발 시간을 산출하는 계산 |
| 공백 (Gap) | 인접 이벤트 사이에 이동 수단이 누락되어 연결되지 않는 구간 |
| Anchor | 역산 계산의 기준점이 되는 이벤트 (주로 항공편 출발 시간) |
| Severity | 공백의 심각도 (DANGER: 이동수단 없음, WARNING: 여유 부족, OK: 정상) |
| 자동삽입 (AUTO) | 앱이 자동으로 추론하여 삽입한 이동 구간 (예: 택시 5분) |

---

## 2. 화면 구성 개요

### 2.1 네비게이션 구조

TripFrame은 Bottom Tab Navigator 기반의 4개 탭으로 구성된다. Constitution Article VI(UX 원칙)에 따라 역산 우선 표시, 공백의 시각적 구분, 자동삽입 명시를 모든 화면에서 준수한다.

| 탭 | 화면명 | 아이콘 | 주요 기능 |
|----|--------|--------|-----------|
| 일정 | TimelineScreen (SCR-001) | Calendar | 날짜별 이벤트 타임라인, 역산/자동삽입 배지 표시 |
| 공백감지 | GapDetectionScreen (SCR-002) | AlertTriangle | 미연결 구간 감지 결과, 이동수단 옵션 제안 |
| 비교 | SuggestionScreen (SCR-003) | Scale | 구간별 이동수단 비교, 패스 경제성 분석 |
| 역산 | ReverseCalcScreen (SCR-004) | Clock | Anchor 기준 단계별 역산 계산 과정 표시 |

### 2.2 화면 흐름도

| 출발 화면 | 트리거 | 도착 화면 | 설명 |
|---------|--------|---------|------|
| 일정 탭 | GapCard 뱃지 탭 | 공백 탭 | 타임라인의 MISSING 배지 클릭 시 공백 탭으로 이동 |
| 일정 탭 | 역산 배지 탭 | 역산 탭 | DERIVED 배지 클릭 시 역산 상세로 이동 |
| 공백 탭 | 옵션 선택 | 비교 탭 | GapCard에서 비교하기 버튼 클릭 시 |
| 공백 탭 | GapCard 펼침 | (같은 화면) | 카드 탭으로 옵션 목록 펼침/닫힘 |
| 비교 탭 | 옵션 확정 | 일정 탭 | 선택한 이동수단이 타임라인에 반영 |
| 역산 탭 | 교통수단 전환 | (같은 화면) | 버스/철도 토글 시 역산 결과 재계산 |

### 2.3 화면 계층도

각 화면의 컴포넌트 계층 구조. Hooks를 통해서만 Core 엔진에 접근하며(Constitution Article III-1), 컴포넌트는 Core를 직접 import하지 않는다.

| 계층 | 구성 요소 | 역할 |
|------|-----------|------|
| Screen | TimelineScreen, GapDetectionScreen, SuggestionScreen, ReverseCalcScreen | 탭별 최상위 화면, Hook 연결 |
| Hook | useTripTimeline, useGapDetection, useTripEngine | Store 구독 + Core 엔진 호출 + 결과 반환 |
| Store | trip-store (Zustand) | 전역 상태 관리 (이벤트, 선택 Day, 사용자 설정) |
| Component | TimelineItem, GapCard, OptionCard, Badge 등 | UI 렌더링 전용, Props 기반 |
| Core Engine | @tripframe/core | reverse-calc, gap-detector, economics — 순수 TypeScript 함수 |

---

## 3. 화면 상세 설계

### 3.1 일정 탭 — TimelineScreen (SCR-001)

- **파일 경로**: apps/mobile/src/screens/MainTimelineScreen.tsx
- **연결 Hook**: useTripTimeline
- **관련 Task**: TASK-019
- **우선순위**: P1 (MVP 필수)

#### 3.1.1 화면 구성

TimelineScreen은 날짜별 이벤트를 시간순으로 나열하는 앱의 메인 화면이다. 상단에 여행 타이틀과 공백 경고 뱃지, 그 아래 DaySelector(날짜 탭), 본문에 TimelineItem 목록이 배치된다.

| 영역 | 컴포넌트 | 설명 |
|------|----------|------|
| 헤더 | SectionHeader | 여행 타이틀 (예: 후쿠오카 · 유후인) + 공백 경고 뱃지 카운트 |
| 날짜 선택 | DaySelector | 수평 스크롤 탭: D-1, Day1, Day2, Day3. D-1은 출발 전일(역산 결과) |
| 타임라인 | TimelineItem[] | 시간순 이벤트 카드 목록. 이벤트 타입별 아이콘/색상 구분 |
| 하단 여백 | - | Bottom Tab Navigator 가림 방지 padding |

#### 3.1.2 TimelineItem 컴포넌트

**Props:**

| Props | 타입 | 설명 |
|-------|------|------|
| event | TripEvent | 이벤트 데이터 객체 |
| isLast | boolean (optional) | 마지막 아이템 여부 (연결선 숨김) |

**이벤트 타입별 시각 표현:**

| EventType | 아이콘 | 기본 색상 | 비고 |
|-----------|--------|-----------|------|
| flight | Plane | 보라 (#A78BFA) | 항공편 정보 (편명, 출발/도착 시간) |
| hotel | Building | 파랑 (#60A5FA) | 숙소 체크인/체크아웃 |
| transport (bus) | Bus | 노랑 (#F59E0B) | 버스 노선, 소요시간 |
| transport (train) | Train | 초록 (#10B981) | 열차 노선, 소요시간 |
| taxi | Car | 회색 (#9CA3AF) | 자동삽입 구간 택시 |
| walk | PersonStanding | 회색 (#9CA3AF) | 도보 이동 |
| subway | TrainFront | 파랑 (#3B82F6) | 지하철/전철 |
| activity | Coffee | 연보라 (#C4B5FD) | 자유 시간 블록 |

**이벤트 상태별 배지 및 스타일:**

| EventStatus | 배지 텍스트 | 배지 색상 | 카드 스타일 |
|------------|-----------|-----------|------------|
| ok | - | - | 기본 카드 (테두리 없음) |
| pending | 미예약 | 빨강 (#EF4444) | 빨간 점선 테두리 |
| missing | 미예약 | 빨강 (#EF4444) | 빨간 실선 테두리 + 경고 아이콘 |
| auto | 자동삽입 | 초록 (#10B981) | 초록 점선 테두리 + 자동삽입 태그 |
| derived | 역산 | 보라 (#A78BFA) | 보라 점선 테두리 + 역산 배지 |

#### 3.1.3 DaySelector 컴포넌트

| 속성 | 설명 |
|------|------|
| 탭 구성 | D-1 (출발 전일), Day1 (6/18), Day2 (6/19), Day3 (6/20) |
| 선택 표시 | 선택된 탭: 보라 배경 + 흰색 텍스트. 미선택: 투명 배경 + 회색 텍스트 |
| 뱃지 | 해당 날짜에 MISSING 또는 DANGER 이벤트가 있으면 빨간 dot 뱃지 표시 |
| 스크롤 | 4개 이상 날짜 시 수평 스크롤. 선택 탭 자동 스크롤 이동 |

#### 3.1.4 검증 시나리오 (Day1 기준)

샘플 데이터(후쿠오카 여행) 기준 Day1 타임라인 예상 렌더링:

| 시간 | 이벤트 | 상태 | 배지 |
|------|--------|------|------|
| 09:15 | 합정동 출발 | derived | 역산 |
| 10:45 | 인천공항 T1 카운터 도착 권장 | derived | 역산 + 경고 |
| 12:15 | LJ263 출발 (ICN) | ok | - |
| 13:40 | 후쿠오카 도착 (FUK) | ok | - |
| 14:10 | 공항 → 하카타 이동 | ok | - |
| 15:00 | 오리엔탈 호텔 체크인 | ok | - |
| 15:00~ | 자유 시간 | activity | - |

---

### 3.2 공백감지 탭 — GapDetectionScreen (SCR-002)

- **파일 경로**: apps/mobile/src/screens/GapAnalysisScreen.tsx
- **연결 Hook**: useGapDetection
- **관련 Task**: TASK-022
- **우선순위**: P1 (MVP 필수)

#### 3.2.1 화면 구성

공백감지 화면은 이벤트 간 미연결 구간을 감지하여 GapCard 목록으로 표시한다. 각 카드는 탭하여 펼칠 수 있으며, 펼침 시 이동수단 옵션(OptionCard)이 나타난다.

| 영역 | 컴포넌트 | 설명 |
|------|----------|------|
| 헤더 | SectionHeader | 공백 감지 결과 요약 (예: 위험 구간 2개 발견) |
| 카드 목록 | GapCard[] | 심각도 기준 정렬 (DANGER > WARNING > AUTO). 탭으로 펼침/닫힘 |
| 빈 상태 | EmptyState | 공백이 없을 경우 성공 메시지 표시 |

#### 3.2.2 GapCard 컴포넌트

**Props:**

| Props | 타입 | 설명 |
|-------|------|------|
| gap | Gap | 공백 데이터 객체 (from/to 이벤트, severity, suggestedOptions) |
| isOpen | boolean | 현재 펼침 상태 |
| onToggle | () => void | 펼침/닫힘 토글 콜백 |

**심각도별 시각 표현:**

| Severity | 카드 배경 | 아이콘 | 텍스트 색상 | 테두리 |
|---------|-----------|--------|-----------|--------|
| DANGER | rgba(239,68,68,0.1) | AlertTriangle (빨강) | 흰색 | 빨간 실선 좌측 4px |
| WARNING | rgba(245,158,11,0.1) | AlertCircle (노랑) | 흰색 | 노란 실선 좌측 4px |
| AUTO (자동삽입) | rgba(16,185,129,0.1) | CheckCircle (초록) | 흰색 | 초록 실선 좌측 4px |

- **접힌 상태**: 구간명 + severity 아이콘 + 간략 메시지 (예: 하카타 → 유후인 이동수단 없음)
- **펼친 상태**: 위 내용 + OptionCard 목록 + 예약 오픈 날짜 배지 (있는 경우)

#### 3.2.3 OptionCard 컴포넌트

**Props:**

| Props | 타입 | 설명 |
|-------|------|------|
| option | TransportOption | 이동수단 옵션 데이터 |
| people | number | 인원 수 (2인 합산 가격 계산용) |

**표시 항목:**

| 항목 | 위치 | 설명 |
|------|------|------|
| 이동수단명 | 카드 상단 좌 | 예: 유후인호 (니시테츠버스) |
| 추천 배지 | 카드 상단 우 | 추천 옵션에만 보라색 추천 배지 표시 |
| 소요시간 | 카드 중앙 | 예: 약 2시간 |
| 가격 | 카드 중앙 | 1인 가격 + 2인 합계. 통화 단위 표시 |
| 탑승 시간대 | 카드 하단 | 예: 11:30 탑승 |
| 경고 메시지 | 카드 하단 (조건부) | 예: 즉시 매진 주의. 빨간색 텍스트 |
| 예약 오픈일 | 카드 하단 (조건부) | 예: 예약 오픈 5/20 08:00. 노란색 배지 |

#### 3.2.4 검증 시나리오

| 카드 | 구간 | Severity | 옵션 |
|------|------|---------|------|
| GapCard 1 | 하카타 → 유후인 | DANGER | 유후인호 버스 (추천), 유후인노모리 (즉시매진) |
| GapCard 2 | 유후인 → 후쿠오카공항 | DANGER | 공항 직행 버스 (추천) |
| GapCard 3 | 버스센터 → 잇코텐 | AUTO | 택시 5분 (추천), 도보 15분 (비추천) |

---

### 3.3 비교 탭 — SuggestionScreen (SCR-003)

- **파일 경로**: apps/mobile/src/screens/SuggestionScreen.tsx
- **연결 Hook**: useGapDetection, useTripEngine
- **관련 Task**: TASK-024 [P]
- **우선순위**: P2 (Post-MVP 가능)

#### 3.3.1 화면 구성

비교 화면은 각 공백 구간별 이동수단 옵션을 나란히 비교하고, 패스 경제성 분석 결과를 표시한다.

| 영역 | 컴포넌트 | 설명 |
|------|----------|------|
| 구간 선택 | SegmentSelector | 공백 구간 목록에서 비교 대상 선택 (탭 또는 드롭다운) |
| 옵션 비교 | OptionCard[] | 선택 구간의 이동수단 옵션 카드 목록. 추천 옵션에 보라 테두리 |
| 경제성 분석 | EconomicsCard | 패스 vs 개별 구매 가격 비교 결과 |

#### 3.3.2 EconomicsCard 컴포넌트

| 표시 항목 | 설명 | 색상 규칙 |
|---------|------|-----------|
| 개별 구매 합계 | 각 구간 이동수단 가격 합산 (인원수 반영) | 더 저렴한 쪽: 초록 (#10B981) |
| 패스 합계 | 선택된 패스 가격 (인원수 반영) | 더 비싼 쪽: 빨강 (#EF4444) |
| 절약 금액 | 두 옵션의 차이 금액 | 항상 초록 |
| 추천 문구 | 예: 개별 구매가 3,000엔 유리 | 볼드 처리 |

#### 3.3.3 검증 시나리오

| 항목 | 예상 값 |
|------|---------|
| 추천 카드 | 유후인호 버스 - 보라 테두리, 3,250엔/인, 약 2시간, 11:30 탑승 |
| 일반 카드 | 유후인노모리 - 즉시 매진 경고 표시 |
| 개별 구매 합계 | 13,000엔 (2인, 버스 2회) - 초록 |
| 패스 합계 | 16,000엔 (2인, 산큐패스 2일권) - 빨강 |
| 추천 문구 | 개별 구매가 3,000엔 유리 |

---

### 3.4 역산 탭 — ReverseCalcScreen (SCR-004)

- **파일 경로**: apps/mobile/src/screens/ReverseCalcDetailScreen.tsx
- **연결 Hook**: useTripEngine
- **관련 Task**: TASK-023
- **우선순위**: P1 (MVP 필수)

#### 3.4.1 화면 구성

역산 화면은 항공편 출발 시간(Anchor)으로부터 각 단계를 역방향으로 차감하여 집 출발 시간을 도출하는 과정을 시각적으로 보여준다. Constitution Article VI-4(역산 근거 공개)에 따라 모든 계산 단계와 근거를 사용자가 확인할 수 있어야 한다.

| 영역 | 컴포넌트 | 설명 |
|------|----------|------|
| Anchor 카드 | AnchorCard | 기준 항공편 정보 (편명, 출발 시간, 공항, 터미널) |
| 역산 스텝 | ReverseCalcStep[] | 단계별 역산 계산 과정 (시간 + 라벨 + 색상) |
| 결과 카드 | ResultCard | 최종 집 출발 시간 (굵게, 보라색 강조) |
| 교통수단 토글 | TransportToggle | 버스/철도 전환 버튼 (역산 결과 재계산) |

#### 3.4.2 역산 스텝 (ReverseCalcStep) 상세

각 스텝은 수직 타임라인 형태로 위에서 아래로 나열된다. Anchor(상단)에서 Result(하단)까지 시간이 역방향으로 흐른다.

| StepType | 라벨 예시 | 색상 | 설명 |
|---------|-----------|------|------|
| ANCHOR | LJ263 출발 12:15 | 보라 (#A78BFA) | 기준점 (항상 최상단) |
| CHECKIN_DEADLINE | 수속 마감 11:25 | 빨강 (#EF4444) | 출발 N분 전 (항공사 DB 기준) |
| COUNTER_ARRIVAL | 카운터 도착 권장 10:45 | 노랑 (#F59E0B) | 마감 N분 전 여유 시간 |
| TRANSIT | 공항버스 소요 -75분 | 파랑 (#60A5FA) | 이동 수단 소요 시간 차감 |
| BOARDING | 합정역 탑승 09:20 | 회색 (#9CA3AF) | 교통수단 탑승 지점 + 시간 |
| RESULT | 집 출발 09:15 | 보라 (#7C3AED), 굵게 | 최종 결과 (강조 표시) |

#### 3.4.3 교통수단 토글

교통수단 전환 시 transitMinutes 값이 변경되어 역산 결과가 실시간으로 재계산된다.

| 교통수단 | 소요 시간 | 결과 (집 출발) | 비고 |
|---------|-----------|--------------|------|
| 공항버스 (기본) | 75분 | 09:15 | 합정역 기준 |
| 공항철도 (전환) | 50분 | 09:40 | 서울역 기준 (제안) |

#### 3.4.4 검증 시나리오

샘플 데이터(LJ263, 진에어, T1) 기준 역산 화면 예상 렌더링:

| 단계 | 시간 | 라벨 | 배지/색상 |
|------|------|------|-----------|
| Step 0 (ANCHOR) | 12:15 | LJ263 출발 | 보라 배경 |
| Step 1 | 11:25 | 수속 마감 (출발 50분 전) | 빨강 텍스트 |
| Step 2 | 10:45 | 카운터 도착 권장 (마감 40분 전) | 노랑 텍스트 |
| Step 3 | -75분 | 공항버스 소요 | 파랑 화살표 |
| Step 4 | 09:20 | 합정역 탑승 | 회색 |
| Step 5 (RESULT) | 09:15 | 집 출발 | 보라, 굵게, 큰 폰트 |

---

## 4. 공통 컴포넌트 설계

### 4.1 Badge

| Props | 타입 | 설명 |
|-------|------|------|
| variant | `'역산'` \| `'자동삽입'` \| `'미예약'` \| `'추천'` | 배지 종류 |
| size | `'sm'` \| `'md'` (optional) | 크기 (기본 sm) |

| Variant | 배경색 | 텍스트 색상 | 사용 화면 |
|---------|--------|-----------|---------|
| 역산 | #7C3AED (purpleDim) | 흰색 | TimelineScreen, ReverseCalcScreen |
| 자동삽입 | #10B981 (success) | 흰색 | TimelineScreen, GapDetectionScreen |
| 미예약 | #EF4444 (danger) | 흰색 | TimelineScreen, GapDetectionScreen |
| 추천 | #A78BFA (purple) | 흰색 | SuggestionScreen, GapDetectionScreen |

### 4.2 SectionHeader

| Props | 타입 | 설명 |
|-------|------|------|
| title | string | 섹션 제목 텍스트 |
| badgeCount | number (optional) | 우측 경고 뱃지 숫자 (공백 수 등) |
| subtitle | string (optional) | 부제목 텍스트 |

### 4.3 FreeTimeBlock

자유 시간 구간을 시각적으로 표현하는 컴포넌트. 연보라 배경에 예상 활동 추천 문구를 포함할 수 있다.

| Props | 타입 | 설명 |
|-------|------|------|
| startTime | string | 자유 시간 시작 (예: 15:00) |
| endTime | string (optional) | 자유 시간 종료 (없으면 당일 끝까지) |
| suggestions | string[] (optional) | 추천 활동 목록 (Phase 2 연동 대비) |

---

## 5. 인터랙션 정의

### 5.1 터치 인터랙션

| 인터랙션 | 대상 컴포넌트 | 동작 | 피드백 |
|---------|-------------|------|--------|
| 탭 (Tap) | DaySelector 탭 | 날짜 전환, 타임라인 갱신 | 선택 탭 색상 변경 + 부드러운 전환 |
| 탭 (Tap) | GapCard (접힘) | 카드 펼침 (아코디언) | 펼침 애니메이션 (300ms ease) |
| 탭 (Tap) | GapCard (펼침) | 카드 닫힘 | 닫힘 애니메이션 (200ms ease) |
| 탭 (Tap) | TransportToggle | 버스/철도 전환 | 토글 슬라이드 + 역산 결과 재계산 |
| 탭 (Tap) | Badge (역산/미예약) | 관련 탭으로 이동 | 탭 전환 애니메이션 |
| 스크롤 | TimelineItem 목록 | 세로 스크롤 | 일반 스크롤 물리 |
| 스크롤 | DaySelector | 가로 스크롤 | 탭 목록 좌우 이동 |

### 5.2 애니메이션 규격

| 애니메이션 | Duration | Easing | 적용 대상 |
|-----------|----------|--------|---------|
| 카드 펼침/닫힘 | 300ms / 200ms | ease-in-out | GapCard 아코디언 |
| 탭 전환 | 250ms | ease | Bottom Tab, DaySelector |
| 배지 등장 | 200ms | ease-out | Badge 컴포넌트 mount |
| 역산 재계산 | 150ms | ease | 역산 스텝 숫자 변경 |
| 토글 슬라이드 | 200ms | ease | TransportToggle |

---

## 6. 상태별 화면 변화

### 6.1 빈 상태 (Empty State)

| 화면 | 조건 | 표시 내용 |
|------|------|----------|
| TimelineScreen | 이벤트 0개 | 온보딩 안내: 항공편 정보를 입력해보세요 + 입력 버튼 |
| GapDetectionScreen | Gap 0개 | 성공 메시지: 모든 구간이 연결됐습니다 (초록 체크) |
| SuggestionScreen | 비교 대상 없음 | 안내: 공백 탭에서 구간을 선택해주세요 |
| ReverseCalcScreen | 항공편 정보 없음 | 안내: 항공편 정보를 먼저 입력해주세요 |

### 6.2 로딩 상태 (Loading State)

핵심 기능(역산, 공백감지)은 로컬에서 동기 처리되므로 별도 로딩 상태가 불필요하다(Constitution Article III-5, 오프라인 우선). Phase 2에서 클라우드 동기화 추가 시 로딩 스피너가 필요할 수 있으며, 이때 Skeleton UI 패턴을 적용한다.

### 6.3 에러 상태 (Error State)

| 에러 유형 | 발생 조건 | 표시 방식 |
|---------|-----------|----------|
| 항공사 미등록 | DB에 없는 항공사 코드 | 경고 배너: 기본값 60분 적용 중. 정확한 시간은 항공사 홈페이지 확인 |
| 체크인 시간 불가 | 역산 결과가 현재보다 이전 | DANGER 배지 + 다른 시간대/교통수단 제안 |
| 동일 시간 충돌 | 같은 시간에 이벤트 2개 | 우선순위 정렬: CONFIRMED > PENDING > AUTO > FREE |

### 6.4 경고 알림 (Alert Messages)

TimelineItem에 표시되는 경고 메시지는 카드 하단에 노란색 배경 박스로 렌더링된다.

| 경고 유형 | 메시지 예시 | 표시 위치 |
|---------|-----------|----------|
| 여유 시간 부족 | 카운터까지 여유 시간이 40분밖에 없어요 | 역산 결과 카드 하단 |
| 예약 오픈 임박 | 예약 오픈 5/20 08:00 - 놓치지 마세요! | GapCard 내 OptionCard 하단 |
| 즉시 매진 주의 | 유후인노모리는 예약 개시 즉시 매진됩니다 | OptionCard 하단 빨간 텍스트 |
| 자동삽입 안내 | 택시 약 5분 (앱이 자동으로 추가한 구간입니다) | AUTO 이벤트 카드 하단 |

---

## 7. 테마 및 색상 체계

Constitution Article VI-5에 따라 다크 테마를 기본 테마로 사용한다. 라이트 테마는 선택사항이며 Phase 2 이후 지원을 검토한다.

### 7.1 다크 테마 팔레트

| 토큰명 | HEX 값 | 용도 |
|--------|--------|------|
| background | #0D0D12 | 앱 전체 배경 |
| surface | #13131A | 카드, 바텀시트 배경 |
| surfaceHover | #1E1E2E | 카드 hover/press 상태 |
| purple | #A78BFA | 주요 액센트 (Anchor, 역산 배지, 추천) |
| purpleDim | #7C3AED | 보조 액센트 (역산 결과, 배지 배경) |
| danger | #EF4444 | 위험 (DANGER 공백, MISSING 배지, 에러) |
| warning | #F59E0B | 경고 (WARNING, 카운터 도착 권장) |
| success | #10B981 | 성공 (공백 해결, 자동삽입, OK) |
| textPrimary | #F1F5F9 | 본문 텍스트 |
| textSecondary | #94A3B8 | 보조 텍스트, 시간 라벨 |
| textTertiary | #64748B | 비활성 텍스트 |
| border | #1E293B | 카드 테두리 (기본) |

### 7.2 타이포그래피

| 용도 | 크기 | Weight | 색상 |
|------|------|--------|------|
| 화면 타이틀 | 20px | Bold (700) | textPrimary |
| 섹션 헤더 | 16px | Semibold (600) | textPrimary |
| 카드 제목 | 14px | Medium (500) | textPrimary |
| 카드 본문 | 13px | Regular (400) | textSecondary |
| 배지 텍스트 | 11px | Semibold (600) | 흰색 |
| 시간 라벨 | 12px | Medium (500) | textSecondary 또는 액센트 |
| 결과 강조 | 24px | Bold (700) | purple |

### 7.3 간격 체계 (Spacing)

| 토큰 | 값 | 용도 |
|------|-----|------|
| xs | 4px | 인라인 요소 간격 |
| sm | 8px | 카드 내부 요소 간격 |
| md | 12px | 컴포넌트 간 간격 |
| lg | 16px | 섹션 간 간격 |
| xl | 24px | 화면 좌우 패딩 |
| xxl | 32px | 섹션 그룹 간 간격 |

---

## 8. 엣지 케이스 및 미확정 항목

### 8.1 엣지 케이스 처리

| 케이스 | 발생 조건 | 처리 방법 | 관련 화면 |
|--------|-----------|-----------|---------|
| 항공사 미등록 | DB에 없는 항공사 코드 | 기본값 60분 + 경고 배너 | ReverseCalcScreen |
| 이벤트 0개 | 첫 사용 / 데이터 삭제 | 온보딩 안내 + 입력 유도 | 모든 화면 |
| Gap 0개 | 모든 구간 연결 | 성공 메시지 표시 | GapDetectionScreen |
| 체크인 불가 | 역산 결과 < 현재 시간 | DANGER + 대안 교통수단 제안 | ReverseCalcScreen |
| 동일 시간 이벤트 | 같은 시간 이벤트 2개 | 예약 타입 우선순위 정렬 | TimelineScreen |
| 긴 여행 (7일+) | Day 탭 많아짐 | DaySelector 스크롤 + 현재 날짜 강조 | TimelineScreen |

### 8.2 미확정 항목

아래 항목은 현재 확정되지 않았으며, 추후 결정이 필요한 사항이다.

| 항목 | 현재 상태 | 제안 | 결정 시한 |
|------|-----------|------|-----------|
| 온보딩 플로우 | 미설계 | 3단계 스와이프 온보딩 (개념 소개 > 데이터 입력 > 결과 확인) | Phase 1 마감 전 |
| 데이터 입력 방식 | 미확정 | 수동 입력 폼 (MVP) > 이메일 파싱 (Phase 2) | 즉시 결정 필요 |
| 이벤트 편집 UI | 미설계 | TimelineItem 롱프레스 > 수정/삭제 바텀시트 | Phase 1 |
| 다중 여행 관리 | 미확정 | MVP는 단일 여행만. 여행 목록은 Phase 2 | Phase 1 마감 전 |
