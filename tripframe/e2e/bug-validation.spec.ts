/**
 * 버그 수정 검증용 E2E 시나리오.
 *
 * 대상 BUG:
 *   - BUG-05: 홈 화면 "메일 연동/e-티켓 스캔" 카드 onPress Alert
 *   - BUG-06: 'home'/이벤트 타입 아이콘 매핑 일관성 (홈 카드 이모지 가시성)
 *
 * 실행:
 *   cd tripframe && BASE_URL=https://dist-blue-psi-34.vercel.app \
 *     npx playwright test --config=playwright.vercel.config.ts e2e/bug-validation.spec.ts
 *
 * 주의: react-native-web의 Alert.alert는 web 환경에서 window.alert/confirm으로 폴백된다.
 *       Playwright에서는 page.on('dialog')로 캡처 가능.
 */
import { test, expect, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://dist-blue-psi-34.vercel.app';
const MOBILE = devices['Pixel 5'];
test.use({ ...MOBILE });

/** 홈 화면 진입 (?e2e=1로 온보딩 스킵) */
async function gotoHome(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}?e2e=1`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.includes('tripframe') || k.includes('AsyncStorage')) localStorage.removeItem(k);
      }
    } catch {}
  });
  await page.goto(`${BASE_URL}?e2e=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.body.textContent !== null && document.body.textContent.trim().length > 10,
    { timeout: 15000 }
  );
}

test.describe('BUG-05 — 홈 카드 onPress Alert', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('[BUG-05-01] "메일 연동하기" 카드 클릭 → "곧 출시 예정" Alert 노출', async ({ page }) => {
    const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });
    await page.getByText('메일 연동하기').click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/메일 연동/);
    expect(dialog.message()).toMatch(/Phase 7/);
    await dialog.dismiss();
  });

  test('[BUG-05-02] "e-티켓 스캔" 카드 클릭 → "곧 출시 예정" Alert 노출', async ({ page }) => {
    const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });
    await page.getByText('e-티켓 스캔').click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/e-티켓/);
    expect(dialog.message()).toMatch(/Phase 7/);
    await dialog.dismiss();
  });
});

test.describe('BUG-06 — 아이콘 매핑 (홈 카드 가시성)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('[BUG-06-01] 홈 화면에 메일/스캔 아이콘(📧 📸)이 모두 노출', async ({ page }) => {
    await expect(page.getByText('📧')).toBeVisible();
    await expect(page.getByText('📸')).toBeVisible();
  });

  test('[BUG-06-02] Mock 여행 진입 후 일정 탭에서 EventType 아이콘 노출', async ({ page }) => {
    // Mock trip이 시드되어 있는지 + 진입 시도. 시드가 없으면 skip 처리
    const mockTripText = page.getByText(/후쿠오카|유후인|칭다오/).first();
    if (!(await mockTripText.isVisible().catch(() => false))) {
      test.skip(true, 'Mock trip이 시드되지 않은 환경');
    }
    await mockTripText.click();
    await page.waitForSelector('text=← 홈', { state: 'visible', timeout: 8000 });

    // 타임라인의 대표 EventType 아이콘 — 최소 1개 이상 노출
    const icons = ['✈', '🏨', '🚌', '🏠', '📍'];
    let foundCount = 0;
    for (const ic of icons) {
      if (await page.getByText(ic, { exact: false }).first().isVisible().catch(() => false)) {
        foundCount++;
      }
    }
    expect(foundCount).toBeGreaterThan(0);
  });
});
