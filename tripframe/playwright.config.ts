import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/mobile/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8082',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'cd apps/mobile && npx expo export --platform web --output-dir dist && python -m http.server 8082 --directory dist',
    url: 'http://localhost:8082',
    reuseExistingServer: true,
    timeout: 180000,
  },
});
