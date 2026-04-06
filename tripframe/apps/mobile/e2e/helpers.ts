import type { Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8082';

/**
 * Phase 3 공통 헬퍼
 * 앱 진입 후 HomeScreen → Mock 여행 선택 → 탭 화면 진입까지 처리
 */

/** localStorage를 초기화하고 홈 화면으로 이동 (?e2e=1 → 온보딩 스킵) */
export async function gotoHome(page: Page) {
  // ?e2e=1 파라미터로 온보딩 화면을 건너뜀 (App.tsx 처리)
  await page.goto(`${BASE_URL}?e2e=1`);
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
  // ?e2e=1 유지하여 재이동 — reload()는 쿼리 파라미터를 제거해 온보딩이 표시됨
  await page.goto(`${BASE_URL}?e2e=1`, { waitUntil: 'domcontentloaded' });
  // React hydration + Zustand rehydration + 홈 화면 렌더링 대기
  await page.waitForFunction(
    () => document.body.textContent !== null && document.body.textContent.trim().length > 10,
    { timeout: 10000 }
  );
}

/** 홈 화면에서 Mock 여행(후쿠오카 · 유후인)을 선택해 탭 화면으로 진입 */
export async function selectMockTrip(page: Page) {
  await gotoHome(page);
  await page.getByText('후쿠오카 · 유후인').first().click();
  // 탭바가 나타날 때까지 대기
  await page.waitForSelector('text=일정', { state: 'visible', timeout: 8000 });
}
