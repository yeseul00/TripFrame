/**
 * E2E 테스트: SCR-001 — 일정 탭 (TimelineScreen)
 *
 * 대상 URL : http://localhost:8081
 * 실행 방법: expo start --web 기동 후 Playwright MCP 또는 `npx playwright test`
 *
 * 요구사항 매핑 (TF-RDS-001):
 *   REQ-FR-004, REQ-FR-005, REQ-FR-006, REQ-FR-010, REQ-FR-011, REQ-FR-012
 * 검증 시나리오:
 *   TC-007, TC-008, TC-015, TC-016, TC-017
 * implement.md 시나리오 1
 */

import { test, expect, devices } from '@playwright/test';
import { selectMockTrip } from './helpers';

const MOBILE = devices['Pixel 5'];

test.use({ ...MOBILE });

test.describe('SCR-001 일정 탭', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
  });

  // ── 화면 기본 렌더 ──────────────────────────────────────────────────────

  test('[SCR-001-01] 여행 타이틀 "후쿠오카 · 유후인" 표시', async ({ page }) => {
    await expect(page.getByText('후쿠오카 · 유후인')).toBeVisible();
  });

  test('[SCR-001-02] 여행 기간 날짜 표시', async ({ page }) => {
    await expect(page.getByText(/2026\.06\.18/).first()).toBeVisible();
  });

  test('[SCR-001-03] Day 선택 탭 3개 (Day 1, Day 2, Day 3) 표시', async ({ page }) => {
    await expect(page.getByText('Day 1')).toBeVisible();
    await expect(page.getByText('Day 2')).toBeVisible();
    await expect(page.getByText('Day 3')).toBeVisible();
  });

  // ── TC-007: 역산 배지 ────────────────────────────────────────────────────

  test('[TC-007] Day 1 — 09:15 집 출발에 역산 배지 표시', async ({ page }) => {
    await page.getByText('Day 1').click();

    // 09:15 이벤트 카드 확인
    await expect(page.getByText('09:15')).toBeVisible();
    await expect(page.getByText('집 출발')).toBeVisible();
    await expect(page.getByText('역산').first()).toBeVisible();
  });

  // ── Day 전환 ────────────────────────────────────────────────────────────

  test('[SCR-001-04] Day 2 탭 클릭 시 Day 2 이벤트 표시', async ({ page }) => {
    await page.getByText('Day 2').click();
    await expect(page.getByText('2026.06.19')).toBeVisible();
    await expect(page.getByText('호텔 체크아웃')).toBeVisible();
  });

  test('[SCR-001-05] Day 3 탭 클릭 시 Day 3 이벤트 표시', async ({ page }) => {
    await page.getByText('Day 3').click();
    await expect(page.getByText('2026.06.20', { exact: true })).toBeVisible();
    await expect(page.getByText('인천행 비행기')).toBeVisible();
  });

  // ── TC-009: 공백 감지 표시 (REQ-FR-006) ──────────────────────────────────

  test('[TC-009] Day 2 — 이동수단 누락 경고 카드 빨간색으로 표시', async ({ page }) => {
    await page.getByText('Day 2').click();

    // 공백 경고 영역 표시 확인
    await expect(page.getByText('이동 수단 누락')).toBeVisible();
    await expect(page.getByText('하카타에서 유후인')).toBeVisible();
  });

  // ── 공백 카운트 배지 ─────────────────────────────────────────────────────

  test('[SCR-001-06] 헤더에 "공백 2개" 경고 배지 표시', async ({ page }) => {
    await expect(page.getByText(/공백 \d+개/)).toBeVisible();
  });

  // ── 하단 탭바 ───────────────────────────────────────────────────────────

  test('[SCR-001-07] 하단 탭바 4개 탭 표시 (일정, 공백감지, 제안카드, 역산)', async ({ page }) => {
    await expect(page.locator('text=일정').first()).toBeVisible();
    await expect(page.locator('text=공백감지').first()).toBeVisible();
    await expect(page.locator('text=제안카드').first()).toBeVisible();
    await expect(page.locator('text=역산').first()).toBeVisible();
  });
});
