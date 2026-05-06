/**
 * Vercel 배포본 대상 Playwright 설정.
 *
 * 기본 config(playwright.config.ts)는 webServer로 expo dev server를 띄우지만
 * 본 config는 외부 호스팅(Vercel) 대상이라 webServer를 사용하지 않는다.
 *
 * 사용법:
 *   BASE_URL=https://dist-blue-psi-34.vercel.app \
 *     npx playwright test --config=playwright.vercel.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/vercel-results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://dist-blue-psi-34.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // headless 강제 (CI/sandbox 환경)
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
