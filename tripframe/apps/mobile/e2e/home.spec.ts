/**
 * E2E 테스트: HomeScreen — 여행 목록 + 진입 시나리오 (Phase 3)
 *
 * 검증 시나리오: US-P3-001 (홈 화면 — 여행 목록 관리)
 */

import { test, expect, devices } from '@playwright/test';
import { gotoHome, selectMockTrip } from './helpers';

const MOBILE = devices['Pixel 5'];
test.use({ ...MOBILE });

test.describe('HomeScreen — 여행 목록', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('[HOME-01] 앱 진입 시 홈 화면이 표시된다', async ({ page }) => {
    await expect(page.getByText('내 여행')).toBeVisible();
  });

  test('[HOME-02] "새 여행 만들기" 카드가 최상단에 표시된다', async ({ page }) => {
    await expect(page.getByText('+ 새 여행 만들기')).toBeVisible();
  });

  test('[HOME-03] Mock 여행 카드(후쿠오카 · 유후인)가 목록에 표시된다', async ({ page }) => {
    await expect(page.getByText('후쿠오카 · 유후인')).toBeVisible();
  });

  test('[HOME-04] 여행 카드에 기간이 표시된다', async ({ page }) => {
    await expect(page.getByText(/2026\.06\.18.*2026\.06\.20/)).toBeVisible();
  });

  test('[HOME-05] 여행 카드에 공백 배지(위험 2개)가 표시된다', async ({ page }) => {
    await expect(page.getByText(/위험 2개/)).toBeVisible();
  });

  test('[HOME-06] 여행 카드 탭 → 탭 화면 진입 (일정 탭 표시)', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await expect(page.locator('text=일정').first()).toBeVisible();
    await expect(page.locator('text=이동 체크').first()).toBeVisible();
  });

  test('[HOME-07] 탭 진입 후 "← 홈" 버튼이 표시된다', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await expect(page.getByText(/← 홈/)).toBeVisible();
  });

  test('[HOME-08] "← 홈" 버튼 탭 → 홈 화면으로 복귀한다', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForSelector('text=← 홈', { state: 'visible' });
    await page.getByText(/← 홈/).click();
    await expect(page.getByText('내 여행')).toBeVisible();
  });
});

test.describe('HomeScreen — 여행 진입 후 탭 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
  });

  test('[HOME-09] 탭 진입 후 일정 화면에 여행명이 표시된다', async ({ page }) => {
    await expect(page.getByText('후쿠오카 · 유후인')).toBeVisible();
  });

  test('[HOME-10] 탭 진입 후 이동 체크 탭으로 이동 가능하다', async ({ page }) => {
    await page.locator('text=이동 체크').first().click();
    // 공통 헤더에 탭 이름 표시 (이동 체크, 공백 없음)
    await expect(page.getByText('이동 체크').first()).toBeVisible();
  });
});
