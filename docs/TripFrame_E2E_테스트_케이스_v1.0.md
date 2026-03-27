# TripFrame E2E 테스트 케이스

> 문서 ID: TF-TC-001 | 버전: 1.0 | 작성일: 2026-03-27 | 상태: Draft

---

## 목차

1. [개요](#1-개요)
2. [테스트 환경](#2-테스트-환경)
3. [단위 테스트 — Core 엔진](#3-단위-테스트--core-엔진)
4. [E2E 테스트 — 웹 (Playwright)](#4-e2e-테스트--웹-playwright)
5. [요구사항 추적 매트릭스](#5-요구사항-추적-매트릭스)
6. [알려진 한계 및 TODO](#6-알려진-한계-및-todo)

---

## 1. 개요

### 1.1 목적

본 문서는 TripFrame MVP의 핵심 기능에 대한 테스트 케이스를 정의한다. Core 엔진 단위 테스트와 웹 E2E 테스트 두 레이어로 구성되며, 각 테스트 케이스는 요구사항 정의서(TF-RDS-001)의 TC ID와 매핑된다.

### 1.2 범위

| 레이어 | 도구 | 대상 | 실행 위치 |
|--------|------|------|-----------|
| 단위 테스트 | Jest + ts-jest | `packages/core` 엔진 함수 | CI / 로컬 |
| E2E 테스트 | Playwright MCP | 웹 UI (`expo start --web`) | 로컬 |

> 모바일 네이티브 E2E (Maestro)는 Phase 2에서 추가 예정.

### 1.3 참조 문서

| 문서명 | 문서 ID |
|--------|---------|
| 요구사항 정의서 | TF-RDS-001 |
| 앱 화면설계서 | TF-SDD-001 |
| Constitution | spec-kit/constitution.md |
| 구현 가이드 | spec-kit/implement.md |

---

## 2. 테스트 환경

### 2.1 단위 테스트 실행

```bash
cd tripframe/packages/core

# 전체 실행
pnpm test

# 단일 파일 실행
npx jest logic/__tests__/reverseEngine.test.ts
npx jest logic/__tests__/gapEngine.test.ts
```

### 2.2 E2E 테스트 실행

```bash
# 1. 앱 기동 (웹 모드)
cd tripframe/apps/mobile
npx expo start --web --port 8081

# 2. Playwright MCP로 테스트 수행
#    Claude Code에 자연어로 지시:
#    "e2e/timeline.spec.ts 테스트를 localhost:8081에서 실행해줘"
```

### 2.3 샘플 데이터 기준

모든 테스트는 `packages/core/src/data/mock.ts`의 **후쿠오카·유후인** 샘플 여행을 기준으로 한다.

| 항목 | 값 |
|------|----|
| 여행지 | 후쿠오카 · 유후인 |
| 기간 | 2026.06.18 – 2026.06.20 |
| 항공편 (Anchor) | OZ132 인천→후쿠오카, 12:15 출발 |
| 역산 결과 | 집 출발 **09:15** |
| DANGER Gap | 2개 (하카타→유후인, 유후인→공항) |

---

## 3. 단위 테스트 — Core 엔진

### 3.1 Reverse Calculation Engine

> 파일: `packages/core/src/logic/__tests__/reverseEngine.test.ts`
> 대상 함수: `calculateReverseTime(anchorTime, steps)`

#### 핵심 시나리오

| TC ID | 요구사항 | Given | When | Then | 상태 |
|-------|----------|-------|------|------|------|
| TC-005 | REQ-FR-003 | 합정동 출발, 공항버스 75분 | `calculateReverseTime('12:15', [75분])` | `'11:00'` 반환 | ✅ |
| TC-006 | REQ-FR-003 | 합정동 출발, 공항철도 50분 | `calculateReverseTime('12:15', [50분])` | `'11:25'` 반환 | ✅ |
| TC-007 | REQ-FR-004 | 샘플 데이터 역산 steps 4개 | `calculateReverseTime('12:15', MOCK_STEPS)` | `'09:15'` 반환 | ✅ |
| TC-008 | REQ-FR-005 | 체크인 50분+버퍼 40분+버스 75분+준비 15분 | 4단계 누적 차감 | `'09:15'` (총 180분) | ✅ |

#### 경계값

| TC ID | 시나리오 | Then | 상태 |
|-------|----------|------|------|
| EDGE-001 | 단계 없음 | Anchor 시간 그대로 반환 | ✅ |
| EDGE-002 | 자정 경계 (01:00 − 120분) | `'23:00'` 반환 | ✅ |
| EDGE-003 | 정각 입력 (12:00 − 60분) | `'11:00'` 반환 | ✅ |
| EDGE-004 | 복수 단계 누적 차감 순서 | 순서대로 차감, 결과 일치 | ✅ |

---

### 3.2 Gap Detection Engine

> 파일: `packages/core/src/logic/__tests__/gapEngine.test.ts`
> 대상 함수: `detectGaps(events)`

#### DANGER 감지

| TC ID | 요구사항 | Given | When | Then | 상태 |
|-------|----------|-------|------|------|------|
| TC-009 | REQ-FR-006 | 하카타 체크아웃(11:00) → 유후인 체크인(15:00), 이동수단 없음 | `detectGaps([...])` | DANGER Gap 1개 반환 | ✅ |
| TC-010 | REQ-FR-007 | 버스센터 도착(13:30) → 잇코텐(다른 위치), 택시 없음 | `detectGaps([...])` | 마지막 구간 공백 감지 | ⏳ TODO |
| TC-011 | REQ-FR-008 | 샘플 Day 2 이벤트 (하카타→유후인) | `detectGaps(day2)` | `severity === 'DANGER'` | ✅ |

#### WARNING / OK

| TC ID | 요구사항 | Given | When | Then | 상태 |
|-------|----------|-------|------|------|------|
| TC-012 | REQ-FR-008 | 공항→하카타 버스 있으나 여유 20분 | `detectGaps([...])` | `severity === 'WARNING'` | ✅ |
| TC-013 | REQ-FR-008 | 하카타역→호텔, 이동수단+여유 40분 | `detectGaps([...])` | Gap 없음 (OK는 반환 안 함) | ✅ |

#### 제안 옵션 / 경계값

| TC ID | 요구사항 | Given | Then | 상태 |
|-------|----------|-------|------|------|
| TC-014 | REQ-FR-009 | DANGER Gap 발생 | `suggestions.length ≥ 1` | ✅ |
| EDGE-005 | — | 이벤트 0개 | Gap 없음 | ✅ |
| EDGE-006 | — | 이벤트 1개 | Gap 없음 | ✅ |
| EDGE-007 | — | 위치 정보 없는 이벤트 | Gap 없음 | ✅ |
| EDGE-008 | — | 같은 위치 이벤트 | Gap 없음 | ✅ |
| EDGE-009 | — | Day 1 (같은 도시) | Gap 없음 | ✅ |
| EDGE-010 | — | OK 구간 + DANGER 구간 혼재 | DANGER만 반환 | ✅ |
| EDGE-011 | — | Gap 반환 시 | `fromEventId`, `toEventId` 정확히 참조 | ✅ |

#### 단위 테스트 결과 요약

```
Test Suites: 3 passed
Tests:       24 passed, 1 todo
Time:        4.3s
```

---

## 4. E2E 테스트 — 웹 (Playwright)

> 실행 환경: `http://localhost:8081` (Expo web)
> 디바이스 에뮬레이션: Pixel 5 (`devices['Pixel 5']`)

### 4.1 SCR-001 — 일정 탭 (TimelineScreen)

> 파일: `apps/mobile/e2e/timeline.spec.ts`
> 참조: TF-SDD-001 § 3.1, implement.md 시나리오 1

**사전 조건**: 앱 기동 → 일정 탭이 기본 활성 상태

| TC ID | 검증 항목 | 조작 | 기대 결과 |
|-------|-----------|------|-----------|
| SCR-001-01 | 여행 타이틀 | 페이지 로드 | `"후쿠오카 · 유후인"` 표시 |
| SCR-001-02 | 여행 기간 | 페이지 로드 | `"2026.06.18"` 표시 |
| SCR-001-03 | Day 탭 | 페이지 로드 | Day 1 / Day 2 / Day 3 탭 표시 |
| **TC-007** | **역산 배지** | Day 1 탭 클릭 | `"09:15"` + `"집 출발"` + **역산** 배지 표시 |
| SCR-001-04 | Day 전환 | Day 2 탭 클릭 | `"2026.06.19"`, `"호텔 체크아웃"` 표시 |
| SCR-001-05 | Day 전환 | Day 3 탭 클릭 | `"2026.06.20"`, `"인천행 비행기"` 표시 |
| **TC-009** | **공백 경고** | Day 2 탭 클릭 | `"이동 수단 누락"` 빨간 카드 표시 |
| SCR-001-06 | 공백 카운트 | 페이지 로드 | 헤더에 `"공백 2개"` 배지 표시 |
| SCR-001-07 | 하단 탭바 | 페이지 로드 | 일정 / 공백감지 / 제안카드 / 역산 4개 탭 표시 |

---

### 4.2 SCR-002 — 공백감지 탭 (GapDetectionScreen)

> 파일: `apps/mobile/e2e/gap.spec.ts`
> 참조: TF-SDD-001 § 3.2, implement.md 시나리오 2

**사전 조건**: 앱 기동 → `"공백감지"` 탭 클릭

| TC ID | 검증 항목 | 조작 | 기대 결과 |
|-------|-----------|------|-----------|
| SCR-002-01 | 화면 타이틀 | 탭 진입 | `"공백 감지"` 표시 |
| SCR-002-02 | 요약 수치 | 탭 진입 | 위험 공백 / 총 공백 / 완성 구간 표시 |
| **TC-011** | **DANGER 카드** | 탭 진입 | `"이동 수단 누락"` 카드 1개 이상 표시 |
| TC-011-B | DANGER 카드 수 | 탭 진입 | `"이동 수단 누락"` 카드 정확히 **2개** |
| **TC-009** | **Gap 메시지** | 탭 진입 | `"하카타에서 유후인"` 메시지 표시 |
| TC-009-B | Gap 메시지 | 탭 진입 | `"유후인에서 공항"` 메시지 표시 |
| **TC-014** | **GapCard 펼침** | DANGER 카드 탭 | `"선택 가능한 이동 수단"` 옵션 펼쳐짐 |
| TC-014-B | GapCard 닫힘 | 같은 카드 재탭 | 옵션 영역 닫힘 |
| TC-015 | 성공 상태 | 공백 없는 경우 | `"모든 구간이 연결되었습니다"` 표시 (현 샘플에서 미표시 확인) |
| SCR-002-03 | 탭 복귀 | `"일정"` 탭 클릭 | TimelineScreen 재렌더 |

---

### 4.3 SCR-004 — 역산 탭 (ReverseCalcScreen)

> 파일: `apps/mobile/e2e/reverseCalc.spec.ts`
> 참조: TF-SDD-001 § 3.4, implement.md 시나리오 3

**사전 조건**: 앱 기동 → `"역산"` 탭 클릭

| TC ID | 검증 항목 | 조작 | 기대 결과 |
|-------|-----------|------|-----------|
| SCR-004-01 | 화면 타이틀 | 탭 진입 | `"역산 타임라인"` 표시 |
| SCR-004-02 | 서브타이틀 | 탭 진입 | `"집을 몇 시에 나서야 할까?"` 표시 |
| SCR-004-03 | Anchor 레이블 | 탭 진입 | `"앵커 이벤트 (기준 시각)"` 표시 |
| SCR-004-04 | Anchor 시각 | 탭 진입 | `"12:15"` 표시 |
| **TC-007** | **역산 결과** | 탭 진입 | `"권장 집 출발 시각"` + **`09:15`** 표시 |
| TC-008-A | 단계 섹션 | 탭 진입 | `"역산 단계"` 섹션 표시 |
| TC-008-B | 단계 항목 | 탭 진입 | `"공항 체크인"` 항목 표시 |
| TC-008-C | 단계 항목 | 탭 진입 | `"공항 이동 버스"` 항목 표시 |
| TC-008-D | 단계 항목 | 탭 진입 | `"외출 준비"` 항목 표시 |
| **TC-008-E** | **총 소요시간** | 탭 진입 | `"180분 전 출발"` 표시 |
| TC-008-F | 브레이크다운 | 탭 진입 | `"단계별 소요 시간"` 표시 |
| TC-008-G | 소요시간 값 | 탭 진입 | `"50분"` (체크인) 표시 |
| TC-008-H | 소요시간 값 | 탭 진입 | `"75분"` (버스) 표시 |
| SCR-004-05 | 탭 재진입 | 다른 탭 갔다 복귀 | `"09:15"` 결과 유지 |

---

## 5. 요구사항 추적 매트릭스

| TC ID | 요구사항 ID | 검증 레이어 | 파일 | 상태 |
|-------|------------|------------|------|------|
| TC-005 | REQ-FR-003 | 단위 | reverseEngine.test.ts | ✅ |
| TC-006 | REQ-FR-003 | 단위 | reverseEngine.test.ts | ✅ |
| TC-007 | REQ-FR-004 | 단위 + E2E | reverseEngine.test.ts, timeline.spec.ts, reverseCalc.spec.ts | ✅ |
| TC-008 | REQ-FR-005 | 단위 + E2E | reverseEngine.test.ts, reverseCalc.spec.ts | ✅ |
| TC-009 | REQ-FR-006 | 단위 + E2E | gapEngine.test.ts, timeline.spec.ts, gap.spec.ts | ✅ |
| TC-010 | REQ-FR-007 | 단위 | gapEngine.test.ts | ⏳ |
| TC-011 | REQ-FR-008 | 단위 + E2E | gapEngine.test.ts, gap.spec.ts | ✅ |
| TC-012 | REQ-FR-008 | 단위 | gapEngine.test.ts | ✅ |
| TC-013 | REQ-FR-008 | 단위 | gapEngine.test.ts | ✅ |
| TC-014 | REQ-FR-009 | 단위 + E2E | gapEngine.test.ts, gap.spec.ts | ✅ |
| TC-015 | REQ-FR-010 | E2E | gap.spec.ts | ✅ |
| TC-016 | REQ-FR-011 | 미구현 | — | ❌ |
| TC-017 | REQ-FR-012 | 미구현 | — | ❌ |
| TC-019 | REQ-FR-015 | 미구현 (P2) | — | — |
| TC-022 | REQ-FR-019 | 미구현 (P3) | — | — |

> **범례**: ✅ 통과 | ⏳ TODO (엔진 개선 선행 필요) | ❌ 미구현 | — Phase 2/3 예정

---

## 6. 알려진 한계 및 TODO

### TC-010 — 마지막 구간 감지 미지원

**현상**: `transport` 타입 이벤트(버스 도착)가 있으면 `hasTransport = true`로 판정되어, 이후 숙소까지의 마지막 이동 구간을 감지하지 못함.

**재현 케이스**:
```
버스센터(13:30, type: transport) → 잇코텐(15:00, type: hotel)
→ 현재: OK (90분 버퍼) → 기대: DANGER (버스에서 내린 후 이동수단 없음)
```

**해결 방향**: `gapEngine.ts`에 "교통편 하차 후 목적지까지의 마지막 구간" 감지 로직 추가 (TASK-008 개선).

---

### TC-016, TC-017 — 자유 시간 계산 미구현

REQ-FR-011 (자유시간 분 단위 계산), REQ-FR-012 (30분 미만 노란 경고)에 대응하는 함수가 `packages/core`에 아직 없음. TASK-007 구현 후 테스트 추가 필요.

---

### E2E 셀렉터 안정성

현재 `getByText()`와 `getByRole()`로 요소를 선택하고 있어, UI 텍스트 변경 시 E2E 테스트가 함께 깨질 수 있음. 향후 `testID` prop을 주요 컴포넌트에 추가하여 셀렉터를 안정화할 것을 권장.

```tsx
// 권장 패턴
<Text testID="reverse-calc-result">{reverseCalc.calculatedTime}</Text>

// Playwright에서
await page.getByTestId('reverse-calc-result');
```

---

*TF-TC-001 v1.0 | 2026-03-27*
