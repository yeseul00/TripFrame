import type { Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8082';

/**
 * Phase 3 공통 헬퍼
 * 앱 진입 후 HomeScreen → Mock 여행 선택 → 탭 화면 진입까지 처리
 */

/** localStorage를 초기화하고 홈 화면으로 이동 */
export async function gotoHome(page: Page) {
  // 앱 origin에서 localStorage를 지워야 하므로 먼저 페이지를 로드한 후 초기화 후 재로드
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.includes('tripframe') || key.includes('AsyncStorage')) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  // React hydration + Zustand rehydration 대기
  await page.waitForFunction(
    () => document.body.textContent !== null && document.body.textContent.trim().length > 10,
    { timeout: 8000 }
  );
}

/** 홈 화면에서 Mock 여행(후쿠오카 · 유후인)을 선택해 탭 화면으로 진입 */
export async function selectMockTrip(page: Page) {
  await gotoHome(page);
  await page.getByText('후쿠오카 · 유후인').first().click();
  // 탭바가 나타날 때까지 대기
  await page.waitForSelector('text=일정', { state: 'visible', timeout: 8000 });
}
