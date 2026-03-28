# E2E 테스트 환경 정비 작업 계획서

| 항목 | 내용 |
|------|------|
| **작성일** | 2026-03-28 |
| **목표** | 260327 기존 디바이스(80% 통과)와 동일한 수준의 E2E 테스트 실행 |
| **기준 결과서** | `report/260327/TEST_REPORT.md` |
| **현황 결과서** | `report/260328/E2E_TEST_REPORT.md` |

---

## 격차 분석 (Gap Analysis)

| 항목 | 260327 (기준) | 260328 (현재) | 차이 |
|------|--------------|--------------|------|
| 테스트 파일 | `e2e/tripframe-mvp.spec.ts` | `apps/mobile/e2e/*.spec.ts` | 파일 다름 |
| 테스트 수 | 10개 | 33개 | +23개 |
| 탭 클릭 셀렉터 | `page.locator('text=X').click()` | `page.getByRole('button', {name:'X'})` | **RN Web 비호환** |
| 서버 설정 | 미확인 | `--host lan` | **장시간 불안정** |
| 통과율 | 80% (8/10) | 15.2% (5/33) | **-64.8%p** |

**핵심 원인 2가지:**
1. `getByRole('button', ...)` — React Native Web은 TouchableOpacity를 `<div>`로 렌더링, `role="button"` 없음
2. `--host lan` — 장시간 실행 시 서버 응답 중단 (`ERR_EMPTY_RESPONSE`)

---

## 작업 목록

### TASK-A: Playwright 서버 설정 수정
**파일**: `tripframe/playwright.config.ts`
**우선순위**: P0 (다른 모든 작업의 전제조건)

```diff
- command: 'cd apps/mobile && npx expo start --web --host lan --port 8081',
+ command: 'cd apps/mobile && npx expo start --web --host localhost --port 8081',
```

**예상 효과**: reverseCalc/timeline 전체의 `ERR_EMPTY_RESPONSE` 해결

---

### TASK-B: `gap.spec.ts` 셀렉터 수정
**파일**: `tripframe/apps/mobile/e2e/gap.spec.ts`
**수정 위치**: 2곳

| 위치 | 수정 전 | 수정 후 |
|------|--------|--------|
| line 25 (beforeEach) | `page.getByRole('button', { name: '공백감지' }).click()` | `page.locator('text=공백감지').click()` |
| line 94 (SCR-002-03) | `page.getByRole('button', { name: '일정' }).click()` | `page.locator('text=일정').click()` |

**예상 효과**: gap.spec.ts 10개 테스트 모두 실행 가능

---

### TASK-C: `reverseCalc.spec.ts` 셀렉터 수정
**파일**: `tripframe/apps/mobile/e2e/reverseCalc.spec.ts`
**수정 위치**: 3곳

| 위치 | 수정 전 | 수정 후 |
|------|--------|--------|
| line 24 (beforeEach) | `page.getByRole('button', { name: '역산' }).click()` | `page.locator('text=역산').first().click()` |
| line 95 (SCR-004-05) | `page.getByRole('button', { name: '공백감지' }).click()` | `page.locator('text=공백감지').click()` |
| line 96 (SCR-004-05) | `page.getByRole('button', { name: '역산' }).click()` | `page.locator('text=역산').first().click()` |

**예상 효과**: reverseCalc.spec.ts 14개 테스트 모두 실행 가능

---

### TASK-D: `timeline.spec.ts` 셀렉터 수정
**파일**: `tripframe/apps/mobile/e2e/timeline.spec.ts`
**수정 위치**: 4곳

| 위치 | 수정 전 | 수정 후 | 원인 |
|------|--------|--------|------|
| line 34 (SCR-001-02) | `page.getByText(/2026\.06\.18/)` | `page.getByText(/2026\.06\.18/).first()` | strict mode (2개 요소) |
| line 51 (TC-007) | `page.getByText('역산')` | `page.getByText('역산').first()` | strict mode (2개 요소) |
| line 65 (SCR-001-05) | `page.getByText('2026.06.20')` | 조사 필요 ※ | 요소 미노출 |
| line 87~90 (SCR-001-07) | `getByRole('button', { name: 'X' })` × 4 | `page.locator('text=X')` × 4 | RN Web 비호환 |

> ※ SCR-001-05 `'2026.06.20'` 미노출 — Day 3 탭 클릭 후 실제 렌더링 텍스트를 스크린샷으로 확인 후 셀렉터 조정 필요

**예상 효과**: timeline.spec.ts 9개 중 8개 이상 통과 (SCR-001-05는 조사 후 결정)

---

### TASK-E: 검증 실행
**작업 순서**:
```bash
# 1. Expo 서버 선기동
cd tripframe/apps/mobile
npx expo start --web --host localhost --port 8081 &
# HTTP 200 확인 후 진행
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081

# 2. 전체 테스트 실행
cd tripframe
npx playwright test --reporter=list

# 3. 결과 HTML 리포트
npx playwright test --reporter=html
npx playwright show-report
```

**합격 기준**: 33개 중 **27개 이상 통과 (80%+)**

---

## 작업 순서 및 의존성

```
TASK-A (서버 설정) ──┐
                     ├──→ TASK-E (검증)
TASK-B (gap)  ──────┤
TASK-C (reverseCalc)┤
TASK-D (timeline) ──┘
```

TASK-A~D는 상호 독립적이므로 병렬 진행 가능. TASK-E는 A~D 완료 후 실행.

---

## 예상 결과 (수정 완료 후)

| 파일 | 현재 통과 | 수정 후 예상 | 비고 |
|------|----------|-------------|------|
| timeline.spec.ts | 5/9 | 7~8/9 | SCR-001-05 조사 필요 |
| gap.spec.ts | 0/10 | 8~10/10 | TC-014 accordion 동작 확인 필요 |
| reverseCalc.spec.ts | 0/14 | 12~14/14 | 콘텐츠 렌더링 여부 확인 필요 |
| **합계** | **5/33 (15%)** | **27~32/33 (82~97%)** | |

---

## 작업 외 참고사항

- `expo-status-bar` 버전 불일치(v55.0.4 → 권장 ~3.0.9)는 경고만 출력, 기능 영향 없음
- pnpm bash alias(`~/.bashrc`)는 터미널 재시작 후 적용됨
- 수정 완료 후 결과서를 `report/260328/E2E_TEST_REPORT_v2.md`로 저장

---

*작성: Claude Code | 참조: report/260327/TEST_REPORT.md, report/260328/E2E_TEST_REPORT.md*
