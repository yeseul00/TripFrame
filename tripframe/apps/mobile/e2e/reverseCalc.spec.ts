/**
 * E2E 테스트: SCR-004 — 역산 탭 (ReverseCalcScreen)
 *
 * 대상 URL : http://localhost:8081
 * 실행 방법: expo start --web 기동 후 Playwright MCP 또는 `npx playwright test`
 *
 * 요구사항 매핑 (TF-RDS-001):
 *   REQ-FR-001~005
 * 검증 시나리오:
 *   TC-007, TC-008
 * implement.md 시나리오 3
 */

import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';
const MOBILE = devices['Pixel 5'];

test.use({ ...MOBILE });

test.describe('SCR-004 역산 탭', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '역산' }).click();
  });

  // ── 화면 기본 렌더 ──────────────────────────────────────────────────────

  test('[SCR-004-01] "역산 타임라인" 타이틀 표시', async ({ page }) => {
    await expect(page.getByText('역산 타임라인')).toBeVisible();
  });

  test('[SCR-004-02] "집을 몇 시에 나서야 할까?" 서브타이틀 표시', async ({ page }) => {
    await expect(page.getByText('집을 몇 시에 나서야 할까?')).toBeVisible();
  });

  // ── Anchor 카드 ──────────────────────────────────────────────────────────

  test('[SCR-004-03] Anchor 이벤트 카드 — 앵커 이벤트(기준 시각) 레이블 표시', async ({ page }) => {
    await expect(page.getByText('앵커 이벤트 (기준 시각)')).toBeVisible();
  });

  test('[SCR-004-04] Anchor 시각 12:15 표시', async ({ page }) => {
    await expect(page.getByText('12:15')).toBeVisible();
  });

  // ── TC-007, TC-008: 역산 결과 09:15 ────────────────────────────────────

  test('[TC-007] 권장 집 출발 시각 09:15 표시', async ({ page }) => {
    await expect(page.getByText('권장 집 출발 시각')).toBeVisible();
    await expect(page.getByText('09:15')).toBeVisible();
  });

  // ── TC-008: 단계별 역산 ───────────────────────────────────────────────────

  test('[TC-008-A] 역산 단계 "역산 단계" 섹션 표시', async ({ page }) => {
    await expect(page.getByText('역산 단계')).toBeVisible();
  });

  test('[TC-008-B] 역산 단계: 공항 체크인 항목 표시', async ({ page }) => {
    await expect(page.getByText('공항 체크인')).toBeVisible();
  });

  test('[TC-008-C] 역산 단계: 공항 이동 버스 항목 표시', async ({ page }) => {
    await expect(page.getByText('공항 이동 버스')).toBeVisible();
  });

  test('[TC-008-D] 역산 단계: 외출 준비 항목 표시', async ({ page }) => {
    await expect(page.getByText('외출 준비')).toBeVisible();
  });

  // ── TC-008: 총 소요시간 (REQ-FR-005) ─────────────────────────────────────

  test('[TC-008-E] 총 소요시간 180분 전 출발 표시', async ({ page }) => {
    await expect(page.getByText(/180분 전 출발/)).toBeVisible();
  });

  // ── 단계별 소요시간 브레이크다운 ─────────────────────────────────────────

  test('[TC-008-F] 단계별 소요 시간 브레이크다운 표시', async ({ page }) => {
    await expect(page.getByText('단계별 소요 시간')).toBeVisible();
  });

  test('[TC-008-G] 브레이크다운에 "50분" (체크인) 표시', async ({ page }) => {
    await expect(page.getByText('50분')).toBeVisible();
  });

  test('[TC-008-H] 브레이크다운에 "75분" (버스 이동) 표시', async ({ page }) => {
    await expect(page.getByText('75분')).toBeVisible();
  });

  // ── 탭 이동 검증 ─────────────────────────────────────────────────────────

  test('[SCR-004-05] 공백감지 탭으로 이동 후 역산 탭 재진입 시 결과 유지', async ({ page }) => {
    await page.getByRole('button', { name: '공백감지' }).click();
    await page.getByRole('button', { name: '역산' }).click();
    await expect(page.getByText('09:15')).toBeVisible();
  });
});
