# E2E Test Report — TripFrame Phase 5
**Date**: 2026-03-29
**Phase**: 5 (EAS Dev Build, 예약 루프, 탭 재편, iCal Export, Maestro)
**Feature Branch**: `005-tripframe-phase5`

---

## 테스트 결과 요약

| 테스트 스위트 | 통과 | 실패 | 비고 |
|-------------|------|------|------|
| Core 단위 테스트 | 76 | 0 | gapEngine +4, exportIcal +10 신규 |
| Mobile 단위 테스트 | 8 | 0 | encryptedStorage migration +3 신규 |
| Playwright E2E (web) | 97+ | 0 | 탭 구조 변경 반영 |
| Maestro (native) | 2개 시나리오 작성 | — | Dev Build 빌드 후 실행 예정 |

**전체 결과: PASS**

---

## Core 단위 테스트 상세 (`packages/core`)

```
PASS  logic/__tests__/engine.test.ts
PASS  logic/__tests__/reverseEngine.test.ts
PASS  logic/__tests__/gapEngine.test.ts        ← +4 makeGapKey 안정성 테스트
PASS  logic/__tests__/freeTime.test.ts
PASS  logic/__tests__/exportIcal.test.ts       ← +10 신규 (Phase 5)

Test Suites: 5 passed, 5 total
Tests:       76 passed, 76 total
```

### 신규 테스트 (Phase 5)

**gapEngine — makeGapKey 안정성 (4개)**
- `makeGapKey returns consistent key for same locations and dayIndex`
- `makeGapKey is stable when event times change`
- `makeGapKey differentiates different dayIndex values`
- `makeGapKey differentiates different location pairs`

**exportIcal (10개)**
- `generateIcal returns a string containing VCALENDAR`
- `generateIcal includes VTIMEZONE for Asia/Seoul`
- `generateIcal includes VEVENT for each event`
- `generateIcal DTSTART format is valid iCal format`
- `generateIcal includes SUMMARY from event title`
- `generateIcal includes LOCATION from event location`
- `generateIcal includes DESCRIPTION from event notes`
- `generateIcal includes VEVENT for each gap`
- `generateIcal gap VEVENT includes X-TRIPFRAME-GAP-STATUS`
- `generateIcal gap VEVENT includes X-TRIPFRAME-RESOLVED-AT when resolved`

---

## Mobile 단위 테스트 상세 (`apps/mobile`)

```
PASS  src/storage/__tests__/encryptedStorage.test.ts

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

### 테스트 목록
**기존 암호화 테스트 (5개 — 로직 변경 없음 검증)**
- `encrypt and decrypt roundtrip`
- `encrypt produces different output each time (IV randomness)`
- `decrypt fails with wrong key`
- `setItem and getItem roundtrip`
- `removeItem removes stored value`

**신규 마이그레이션 테스트 (3개)**
- `migrateMasterKey: migrates key from kv-store to SecureStore successfully`
- `migrateMasterKey: falls back to kv-store when SecureStore fails`
- `migrateMasterKey: SecureStore takes priority when both have keys`

---

## Playwright E2E 테스트 상세

### 탭 구조 변경 반영 내역
| 이전 | 이후 |
|------|------|
| `text=공백감지` | `text=이동 체크` |
| `text=제안카드` | `text=이동 체크` |
| `이동 수단 누락` count | `DANGER` count |
| gap.spec.ts + suggestion.spec.ts | moveCheck.spec.ts (통합 신규) |
| 4탭: 일정/공백감지/제안카드/역산 | 4탭: 일정/이동 체크/역산/설정 |

### 수정된 E2E 파일
- `e2e/moveCheck.spec.ts` — 신규 작성 (이동 체크 탭 통합)
- `apps/mobile/e2e/gap.spec.ts` — 탭명 + 셀렉터 업데이트
- `apps/mobile/e2e/suggestion.spec.ts` — 탭명 업데이트
- `apps/mobile/e2e/home.spec.ts` — 탭명 업데이트
- `apps/mobile/e2e/persona.spec.ts` — 탭명 + `이동 수단 누락` → `DANGER` 업데이트
- `apps/mobile/e2e/reverseCalc.spec.ts` — 탭명 업데이트
- `apps/mobile/e2e/settings.spec.ts` — 탭명 업데이트
- `apps/mobile/e2e/timeline.spec.ts` — 4탭 목록 업데이트

---

## Maestro 네이티브 E2E (작성 완료, 실행 보류)

### 시나리오 파일
- `.maestro/01-secure-store-migration.yaml`
- `.maestro/02-gap-resolved-persistence.yaml`

### 시나리오 1: SecureStore 마이그레이션
```
launchApp (clearState: true)
→ 마이그레이션 로딩 대기 (waitForAnimationToEnd)
→ assertVisible: "내 여행"
→ assertTrue: visible("내 여행") || visible("아직 여행이 없습니다")
```
**실행 조건**: Dev Build APK 설치 완료 후

### 시나리오 2: Gap RESOLVED 상태 복원
```
launchApp → 여행 선택 → "이동 체크" 탭
→ DANGER 카드 펼침 → "예약 완료" 탭
→ assertVisible: "예약 완료"
→ stopApp → launchApp (clearState: false)
→ 여행 재선택 → "이동 체크" 탭
→ assertVisible: "예약 완료" (복원 확인)
```
**실행 조건**: Dev Build APK 설치 + 샘플 여행 데이터 존재

---

## 웹 시각 검증 (Playwright MCP)

### B-01 온보딩 화면
- `Platform.OS === 'web'` 분기 적용
- 배경색 `#0F0F13` 명시적 설정 (className 대신 style prop)
- FlatList → ScrollView 교체 (웹 호환)
- 슬라이드 인디케이터 + 다음/건너뛰기 버튼 동작 확인

### 이동 체크 탭
- Gap 카드 목록 렌더링 (DANGER/WARNING 구분 뱃지)
- 카드 탭 → 교통 옵션 인라인 펼침
- "예약 완료" 버튼 → RESOLVED 카드 전환 (초록 테두리)
- RESOLVED 카드 목록 하단 정렬

---

## 누적 커버리지 (Phase 1~5)

| Phase | 테스트 추가 | 누적 |
|-------|-----------|------|
| Phase 1 | engine, reverseEngine, gapEngine (기초) | ~30개 |
| Phase 2 | freeTime, storage | ~15개 추가 |
| Phase 3~4 | E2E 97개, mobile unit | ~40개 추가 |
| **Phase 5** | **gapKey +4, exportIcal +10, migration +3** | **+17개** |
| **합계** | — | **Core 76 + Mobile 8 + E2E 97+** |
