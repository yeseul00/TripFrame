/**
 * E2E 테스트: HomeScreen — 여행 목록 + 진입 시나리오
 *
 * v1.1: 홈이 Tab 0, 탭 구조 홈/일정/스마트 체크/마이
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

  test('[HOME-02] 스마트 액션 카드가 표시된다', async ({ page }) => {
    await expect(page.getByText('메일 연동하기')).toBeVisible();
    await expect(page.getByText('e-티켓 스캔')).toBeVisible();
  });

  test('[HOME-03] Mock 여행 카드(후쿠오카 · 유후인)가 목록에 표시된다', async ({ page }) => {
    await expect(page.getByText('후쿠오카 · 유후인')).toBeVisible();
  });

  test('[HOME-04] 여행 카드에 기간이 표시된다', async ({ page }) => {
    await expect(page.getByText(/2026\.06\.18.*2026\.06\.20/)).toBeVisible();
  });

  test('[HOME-05] 여행 카드에 확인 필요 뱃지가 표시된다', async ({ page }) => {
    await expect(page.getByText(/확인 필요한 일정이 2건 있어요/)).toBeVisible();
  });

  test('[HOME-06] 여행 카드에 D-day 뱃지가 표시된다', async ({ page }) => {
    await expect(page.getByText(/D-\d+/)).toBeVisible();
  });

  test('[HOME-07] 여행 카드 탭 → 일정 탭 진입', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await expect(page.getByText('← 홈')).toBeVisible();
  });

  test('[HOME-08] 4탭 바가 표시된다 (홈/일정/스마트 체크/마이)', async ({ page }) => {
    await expect(page.getByText('홈').first()).toBeVisible();
    await expect(page.getByText('일정').first()).toBeVisible();
    await expect(page.getByText('스마트 체크').first()).toBeVisible();
    await expect(page.getByText('마이').first()).toBeVisible();
  });
});

test.describe('HomeScreen — 여행 진입 후 탭 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
  });

  test('[HOME-09] 탭 진입 후 일정 화면에 여행명이 표시된다', async ({ page }) => {
    await expect(page.getByText('후쿠오카 · 유후인').first()).toBeVisible();
  });

  test('[HOME-10] 탭 진입 후 스마트 체크 탭으로 이동 가능하다', async ({ page }) => {
    await page.getByText('스마트 체크').first().click();
    await expect(page.getByText('스마트 체크').first()).toBeVisible();
  });

  test('[HOME-11] "← 홈" 버튼 탭 → 홈 화면으로 복귀한다', async ({ page }) => {
    await page.getByText('← 홈').click();
    await expect(page.getByText('내 여행')).toBeVisible();
  });
});
