# E2E 테스트 워크플로우

**버전**: 1.0
**작성일**: 2026-03-28
**적용 범위**: TripFrame 전 Phase

---

## 개요

테스트 프로세스는 **계획서 작성 → 테스트 실행 → 결과서 작성** 3단계로 구성됩니다.
결과서는 `report/YYMMDD/` 폴더에 저장합니다.

---

## 테스트 파일 위치

| 파일 | 대상 |
|------|------|
| `tripframe/e2e/tripframe-mvp.spec.ts` | MVP 통합 E2E (구버전) |
| `tripframe/apps/mobile/e2e/timeline.spec.ts` | SCR-001 일정 탭 |
| `tripframe/apps/mobile/e2e/gap.spec.ts` | SCR-002 공백감지 탭 |
| `tripframe/apps/mobile/e2e/reverseCalc.spec.ts` | SCR-004 역산 탭 |

Playwright 설정: `tripframe/playwright.config.ts` (testDir: `apps/mobile/e2e`)

---

## Step 1: 테스트 계획서 작성

테스트 실행 전 `report/YYMMDD/TEST_PLAN.md`를 작성합니다.

**포함 항목**:
- 테스트 목적 (신규 환경 검증 / 기능 회귀 / Phase 완료 검증 등)
- 대상 파일 및 테스트 케이스 범위
- 실행 환경 (OS, Node, Playwright 버전)
- 예상 통과 기준

---

## Step 2: 사전 환경 준비

```bash
# 1. 의존성 확인
cd tripframe
node /c/Users/qptlf/AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs install

# 2. Core 빌드
node .../pnpm.cjs --filter @tripframe/core build

# 3. Playwright 브라우저 확인 (버전 불일치 시 재설치)
npx playwright install chromium

# 4. Expo 웹 서버 선기동 (전체 실행 안정성 확보)
cd apps/mobile && npx expo start --web --host localhost --port 8081 &
# 서버 준비 확인 (HTTP 200 응답 대기)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
# → "200" 확인 후 다음 단계 진행
```

> ⚠️ **주의**: 서버를 선기동하지 않으면 알파벳 순 첫 번째 스펙(gap.spec.ts)에서 30초 타임아웃이 연속 발생하고, 이후 테스트들이 `ERR_EMPTY_RESPONSE`로 실패합니다.

---

## Step 3: 테스트 실행

```bash
cd tripframe

# 전체 실행
npx playwright test --reporter=list

# 특정 파일만
npx playwright test apps/mobile/e2e/timeline.spec.ts --reporter=list

# 결과 HTML 리포트 생성 (tripframe/playwright-report/)
npx playwright test --reporter=html
```

---

## Step 4: 결과서 작성

결과서 저장 위치: `report/YYMMDD/E2E_TEST_REPORT.md`

**결과서 구성**:

```
1. 테스트 개요 (일시, 환경, 목적)
2. 테스트 파일 목록
3. 실행 결과 요약 (통과/실패/통과율 표)
4. 개별 테스트 케이스 결과 (스펙별 표)
5. 실패 원인 분류
   - 기능 결함 (앱 버그)
   - 테스트 셀렉터 문제 (테스트 코드 수정 필요)
   - 환경/인프라 문제 (서버, 버전 등)
6. 환경별 추가 이슈
7. 결론 및 권고사항
```

---

## 알려진 주의사항 (2026-03-28 기준)

### React Native Web 셀렉터 호환성

Expo React Native Web은 `TouchableOpacity`를 `<button>` 태그가 아닌 `<div>` 로 렌더링합니다.

| ❌ 작동 안 함 | ✅ 작동함 |
|--------------|----------|
| `getByRole('button', { name: 'X' })` | `getByText('X')` |
| | `locator('[data-testid="X"]')` |

### strict mode 위반 방지

동일 텍스트가 여러 곳에 렌더링될 수 있습니다 (헤더 + 탭 등).

```ts
// ❌ strict mode 위반 가능
await expect(page.getByText('역산')).toBeVisible();

// ✅ 안전한 방법
await expect(page.getByText('역산').first()).toBeVisible();
```

### Expo 서버 `--host` 옵션

```ts
// playwright.config.ts webServer 설정
command: 'cd apps/mobile && npx expo start --web --host localhost --port 8081',
// ⚠️ '--host lan' 사용 시 장시간 실행 중 연결 불안정 발생 가능
```

---

## 결과서 히스토리

| 날짜 | 파일 | 통과율 | 주요 이슈 |
|------|------|--------|----------|
| 2026-03-27 | `report/260327/TEST_REPORT.md` | 100% (E2E 기준) | Phase 1 완료 검증 |
| 2026-03-28 | `report/260328/E2E_TEST_REPORT.md` | 15.2% | 신규 디바이스 + 셀렉터 호환성 문제 확인 |
| 2026-03-28 | `report/260328/E2E_TEST_REPORT_v2.md` | **100% (33/33)** | 셀렉터 수정 완료 — RN Web 호환 + strict mode 해소 |
