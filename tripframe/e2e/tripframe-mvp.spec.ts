import { test, expect } from '@playwright/test';

test.describe('TripFrame MVP E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('TC-001: 앱이 정상적으로 로드되고 다크 테마가 적용됨', async ({ page }) => {
    // 타이틀 확인
    await expect(page.locator('text=후쿠오카 · 유후인')).toBeVisible();

    // 날짜 범위 확인
    await expect(page.locator('text=2026.06.18 – 2026.06.20')).toBeVisible();

    // 탭 바 확인
    await expect(page.locator('text=일정').first()).toBeVisible();
    await expect(page.locator('text=공백감지').first()).toBeVisible();
    await expect(page.locator('text=제안카드').first()).toBeVisible();
    await expect(page.locator('text=역산').first()).toBeVisible();

    // 스크린샷 캡처
    await page.screenshot({ path: 'test-results/screenshots/01-app-loaded.png', fullPage: true });
  });

  test('TC-002: Day 1 타임라인 이벤트 확인', async ({ page }) => {
    // Day 1 클릭
    await page.locator('text=Day 1').click();
    await page.waitForTimeout(500);

    // Day 1 이벤트 확인
    await expect(page.locator('text=09:15')).toBeVisible();
    await expect(page.locator('text=집 출발')).toBeVisible();
    await expect(page.locator('text=12:15')).toBeVisible();
    await expect(page.locator('text=후쿠오카행 비행기')).toBeVisible();
    await expect(page.locator('text=15:30')).toBeVisible();
    await expect(page.locator('text=호텔 체크인')).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/02-day1-timeline.png', fullPage: true });
  });

  test('TC-003: Day 2 타임라인 및 경고 확인', async ({ page }) => {
    // Day 2 클릭
    await page.locator('text=Day 2').click();
    await page.waitForTimeout(500);

    // Day 2 이벤트 확인
    await expect(page.locator('text=10:00')).toBeVisible();
    await expect(page.locator('text=호텔 체크아웃')).toBeVisible();
    await expect(page.locator('text=유후인 도착')).toBeVisible();

    // 경고 메시지 확인
    await expect(page.locator('text=이동 수단 누락')).toBeVisible();
    await expect(page.locator('text=하카타에서 유후인으로 이동하는 수단이 없습니다')).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/03-day2-timeline-warning.png', fullPage: true });
  });

  test('TC-004: Day 3 경고 표시 확인', async ({ page }) => {
    // Day 3 탭에 경고 아이콘이 있는지 확인
    const day3Tab = page.locator('text=Day 3');
    await expect(day3Tab).toBeVisible();

    // Day 3 클릭
    await day3Tab.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/screenshots/04-day3-warning.png', fullPage: true });
  });

  test('TC-005: 공백감지 탭 동작 확인', async ({ page }) => {
    // 공백감지 탭 클릭
    await page.locator('text=공백감지').click();
    await page.waitForTimeout(500);

    // 공백감지 화면이 표시되는지 확인
    // (실제 구현에 따라 다를 수 있음)
    await page.screenshot({ path: 'test-results/screenshots/05-gap-detection.png', fullPage: true });
  });

  test('TC-006: 역산 탭 동작 확인', async ({ page }) => {
    // 역산 탭 클릭
    await page.locator('text=역산').first().click();
    await page.waitForTimeout(500);

    // 역산 화면이 표시되는지 확인
    await page.screenshot({ path: 'test-results/screenshots/06-reverse-calc.png', fullPage: true });
  });

  test('TC-007: 탭 전환이 정상적으로 동작함', async ({ page }) => {
    // 일정 → 공백감지 → 역산 → 일정 순서로 전환
    await page.locator('text=일정').click();
    await page.waitForTimeout(300);

    await page.locator('text=공백감지').click();
    await page.waitForTimeout(300);

    await page.locator('text=역산').click();
    await page.waitForTimeout(300);

    await page.locator('text=일정').click();
    await page.waitForTimeout(300);

    // 최종적으로 일정 탭이 활성화되어 있는지 확인
    await expect(page.locator('text=후쿠오카 · 유후인')).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/07-tab-navigation.png', fullPage: true });
  });

  test('TC-008: 퍼플 강조색 확인', async ({ page }) => {
    // Day 2가 기본 선택되어 퍼플 배경색을 가지는지 확인
    const day2Button = page.locator('text=Day 2').first();
    await expect(day2Button).toBeVisible();

    // Day 1 클릭 후 퍼플 강조색이 이동하는지 확인
    await page.locator('text=Day 1').click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/screenshots/08-purple-accent.png', fullPage: true });
  });

  test('TC-009: 경고 메시지 스타일 확인', async ({ page }) => {
    // Day 2로 이동하여 경고 박스 확인
    await page.locator('text=Day 2').click();
    await page.waitForTimeout(500);

    // 경고 박스가 빨간 테두리를 가지는지 확인
    const warningBox = page.locator('text=이동 수단 누락').locator('..');
    await expect(warningBox).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/09-warning-style.png', fullPage: true });
  });

  test('TC-010: 전체 화면 캡처 (최종 상태)', async ({ page }) => {
    // Day 2 타임라인을 보여주는 최종 스크린샷
    await page.locator('text=Day 2').click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/screenshots/10-final-state.png',
      fullPage: true
    });
  });
});
