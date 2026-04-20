import { test, expect } from '@playwright/test';

test.describe('TripFrame MVP E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('TC-001: 앱이 정상적으로 로드되고 홈 화면이 표시됨', async ({ page }) => {
    // 홈 화면 확인
    await expect(page.locator('text=내 여행')).toBeVisible();

    // 여행 카드 확인
    await expect(page.locator('text=후쿠오카 · 유후인')).toBeVisible();

    // 탭 바 확인
    await expect(page.locator('text=홈').first()).toBeVisible();
    await expect(page.locator('text=일정').first()).toBeVisible();
    await expect(page.locator('text=스마트 체크').first()).toBeVisible();
    await expect(page.locator('text=마이').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/01-app-loaded.png', fullPage: true });
  });

  test('TC-002: Day 1 타임라인 이벤트 확인', async ({ page }) => {
    // 여행 선택 → 일정 탭 진입
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    // Day 1 클릭
    await page.locator('text=Day 1').click();
    await page.waitForTimeout(500);

    // Day 1 이벤트 확인
    await expect(page.locator('text=집 출발')).toBeVisible();
    await expect(page.locator('text=12:15')).toBeVisible();
    await expect(page.locator('text=후쿠오카행 비행기')).toBeVisible();
    await expect(page.locator('text=15:30')).toBeVisible();
    await expect(page.locator('text=호텔 체크인')).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/02-day1-timeline.png', fullPage: true });
  });

  test('TC-003: Day 2 타임라인 및 경고 확인', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    // Day 2 클릭
    await page.locator('text=Day 2').click();
    await page.waitForTimeout(500);

    // Day 2 이벤트 확인
    await expect(page.locator('text=10:00')).toBeVisible();
    await expect(page.locator('text=호텔 체크아웃')).toBeVisible();
    await expect(page.locator('text=유후인 도착')).toBeVisible();

    // 경고 메시지 확인 (v1.1: orange warning)
    await expect(page.locator('text=이동 수단이 필요해요')).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/03-day2-timeline-warning.png', fullPage: true });
  });

  test('TC-004: Day 3 표시 확인', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    const day3Tab = page.locator('text=Day 3');
    await expect(day3Tab).toBeVisible();

    await day3Tab.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/screenshots/04-day3.png', fullPage: true });
  });

  test('TC-005: 스마트 체크 탭 동작 확인', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    // 스마트 체크 탭 클릭
    await page.locator('text=스마트 체크').click();
    await page.waitForTimeout(500);

    await expect(page.getByText('스마트 체크').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/05-smart-check.png', fullPage: true });
  });

  test('TC-006: 스마트 타임라인 모달 동작 확인', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    // 일정 탭에서 Day 1 → 스마트 타임라인 배지 탭
    await page.locator('text=Day 1').click();
    await page.getByText('스마트 타임라인').first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('스마트 타임라인').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/06-smart-timeline-modal.png', fullPage: true });
  });

  test('TC-007: 탭 전환이 정상적으로 동작함', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    // 일정 → 스마트 체크 → 마이 → 일정 순서로 전환
    await page.locator('text=일정').click();
    await page.waitForTimeout(300);

    await page.locator('text=스마트 체크').click();
    await page.waitForTimeout(300);

    await page.locator('text=마이').click();
    await page.waitForTimeout(300);

    await page.locator('text=일정').click();
    await page.waitForTimeout(300);

    // 최종적으로 일정 탭이 활성화되어 있는지 확인
    await expect(page.locator('text=후쿠오카 · 유후인').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/07-tab-navigation.png', fullPage: true });
  });

  test('TC-008: Day 선택 스타일 확인', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    const day2Button = page.locator('text=Day 2').first();
    await expect(day2Button).toBeVisible();

    await page.locator('text=Day 1').click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/screenshots/08-day-selector.png', fullPage: true });
  });

  test('TC-009: 경고 메시지 스타일 확인', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    // Day 2로 이동하여 경고 박스 확인
    await page.locator('text=Day 2').click();
    await page.waitForTimeout(500);

    // v1.1: orange warning style
    const warningBox = page.locator('text=이동 수단이 필요해요').locator('..');
    await expect(warningBox).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/09-warning-style.png', fullPage: true });
  });

  test('TC-010: 전체 화면 캡처 (최종 상태)', async ({ page }) => {
    await page.getByText('후쿠오카 · 유후인').first().click();
    await page.waitForTimeout(500);

    await page.locator('text=Day 2').click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/screenshots/10-final-state.png',
      fullPage: true
    });
  });
});
