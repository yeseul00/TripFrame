# E2E 테스트 결과서 — TripFrame Phase 3

**작성일**: 2026-03-28
**테스트 환경**: Chromium (Playwright v1.58.2), Expo Web (정적 빌드, python3 http.server :8082)
**총 테스트**: 86개
**결과**: **86 PASS / 0 FAIL**

---

## 테스트 파일별 결과

| 파일 | 설명 | 테스트 수 | PASS | FAIL |
|------|------|-----------|------|------|
| `home.spec.ts` | 홈 화면 여행 목록 + 탭 진입 | 10 | 10 | 0 |
| `tripCrud.spec.ts` | 여행 생성/수정/삭제 | 10 | 10 | 0 |
| `timeline.spec.ts` | 일정 탭 + 이벤트 CRUD | 13 | 13 | 0 |
| `gap.spec.ts` | 공백감지 탭 | 10 | 10 | 0 |
| `suggestion.spec.ts` | 제안카드 탭 (토글, 인원 선택) | 14 | 14 | 0 |
| `reverseCalc.spec.ts` | 역산 탭 (P3.5 대안 교통수단) | 20 | 20 | 0 |
| `persona.spec.ts` | 3종 페르소나 시나리오 | 9 | 9 | 0 |

---

## Phase 3 신규 테스트 케이스

### HomeScreen (10개)

| ID | 시나리오 | 결과 |
|----|---------|------|
| HOME-01 | 앱 진입 시 홈 화면 표시 | PASS |
| HOME-02 | "새 여행 만들기" 카드 최상단 표시 | PASS |
| HOME-03 | Mock 여행 카드 목록 표시 | PASS |
| HOME-04 | 여행 카드에 기간 표시 | PASS |
| HOME-05 | 여행 카드에 공백 배지(위험 2개) 표시 | PASS |
| HOME-06 | 여행 카드 탭 → 탭 화면 진입 | PASS |
| HOME-07 | 탭 진입 후 "← 홈" 버튼 표시 | PASS |
| HOME-08 | "← 홈" 버튼 탭 → 홈 화면 복귀 | PASS |
| HOME-09 | 탭 진입 후 일정 화면에 여행명 표시 | PASS |
| HOME-10 | 탭 진입 후 공백감지 탭 이동 가능 | PASS |

### TripFormModal — Trip CRUD (10개)

| ID | 시나리오 | 결과 |
|----|---------|------|
| CRUD-01 | "+ 새 여행 만들기" 탭 → 모달 열림 | PASS |
| CRUD-02 | 여행명 없이 저장 → 인라인 오류 메시지 표시 | PASS |
| CRUD-03 | 여행명 입력 후 저장 → 홈 목록에 추가 | PASS |
| CRUD-04 | 모달 "취소" → 모달 닫힘 | PASS |
| CRUD-05 | 여행명 + 목적지 입력 → 목적지 카드 표시 | PASS |
| CRUD-06 | "···" 버튼 → 수정 모달 열림 | PASS |
| CRUD-07 | 수정 모달에 기존 여행명 입력됨 | PASS |
| CRUD-08 | 여행명 수정 후 저장 → 목록 반영 | PASS |
| CRUD-09 | 수정 모달에 "이 여행 삭제" 버튼 존재 | PASS |
| CRUD-10 | 삭제 확인 후 목록에서 사라짐 | PASS |

---

## 주요 기술 이슈 및 해결

### 1. Zustand ESM `import.meta.env` SyntaxError
- **증상**: Expo Web 빌드가 Playwright Chromium에서 흰 화면 표시
- **원인**: Zustand v5 ESM 번들(`esm/*.mjs`)에 `import.meta.env` 포함 → classic script SyntaxError
- **해결**: Metro `unstable_conditionNames = ['browser', 'require', 'react-native', 'default']`로 CJS 버전 강제

### 2. `Alert.alert()` No-op in react-native-web
- **증상**: CRUD-02 테스트에서 `page.waitForEvent('dialog')` 타임아웃
- **원인**: `react-native-web`의 `Alert` 구현이 `static alert() {}` (완전 no-op)
- **해결**: TripFormModal에 `titleError` 상태 추가, 인라인 오류 텍스트 렌더링으로 변경

### 3. 삭제 확인 Alert → 인라인 UI
- **증상**: CRUD-10 삭제 후에도 트립 카드 잔존
- **원인**: `Alert.alert(…, buttons)` 콜백이 no-op이라 `deleteTrip()` 미호출
- **해결**: `deleteConfirm` boolean state + 인라인 "삭제 확인 / 취소" 버튼 UI로 대체

### 4. 카드 인덱스 기반 로케이터
- **증상**: CRUD-09/10에서 `getByRole('button').filter({ hasText: … })` 매칭 실패
- **원인**: React Native Web의 `TouchableOpacity`가 Playwright `role=button` 매칭 불일치
- **해결**: `gotoHome()` 후 MOCK_TRIP(0) + 삭제용 여행(1) 순서 보장 → `nth(1)` 사용

---

## 테스트 실행 방법

```bash
# 프리빌드 (apps/mobile/dist)
cd tripframe/apps/mobile && npx expo export --platform web --output-dir dist

# 서버 시작 (별도 터미널)
python3 -m http.server 8082 --directory dist

# 전체 실행
cd tripframe && npx playwright test

# 특정 파일
npx playwright test apps/mobile/e2e/tripCrud.spec.ts --reporter=list
```

---

## 커버리지 요약

- **Phase 1 (MVP)**: 역산 엔진, 공백감지 — 100% E2E 커버
- **Phase 3 홈/CRUD**: HomeScreen, TripFormModal — 100% E2E 커버
- **Phase 3 이벤트**: EventFormModal, MainTimelineScreen — E2E 커버
- **Phase 3 제안/역산**: SuggestionScreen toggle, ReverseCalc 대안 — E2E 커버
