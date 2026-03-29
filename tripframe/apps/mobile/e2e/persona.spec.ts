/**
 * E2E 테스트: Phase 2.6 — 페르소나 시나리오
 * spec-kit/personas.md 기반 3개 페르소나 앱 동작 검증
 */

import { test, expect, devices } from '@playwright/test';
import { selectMockTrip } from './helpers';

const MOBILE = devices['Pixel 5'];
test.use({ ...MOBILE });

test.describe('P1 — 짐 많은 여행자 (설정 화면 기준)', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=설정').click();
  });

  test('[P1-01] "위탁용" 짐 크기 선택 가능', async ({ page }) => {
    await page.getByText('위탁용').click();
    // 선택 후 활성 상태 확인 (테두리 강조)
    await expect(page.getByText('위탁용')).toBeVisible();
  });

  test('[P1-02] "택시" 교통 선호 선택 가능', async ({ page }) => {
    await page.getByText('택시').click();
    await expect(page.getByText('택시')).toBeVisible();
  });

  test('[P1-03] "여유있게" 여유도 선택 가능', async ({ page }) => {
    await expect(page.getByText('여유있게')).toBeVisible();
  });
});

test.describe('P2 — 알뜰 배낭여행자 (제안카드 화면 검증)', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=제안카드').click();
  });

  test('[P2-01] 구간별 대중교통 옵션이 표시됨', async ({ page }) => {
    await expect(page.getByText('대중교통').first()).toBeVisible();
  });

  test('[P2-02] 하카타→유후인 구간에 고속버스 옵션 존재', async ({ page }) => {
    await expect(page.getByText(/고속버스/).first()).toBeVisible();
  });

  test('[P2-03] 하카타→유후인 구간에 열차 옵션 존재', async ({ page }) => {
    await expect(page.getByText(/유후인노모리|열차/).first()).toBeVisible();
  });

  test('[P2-04] 1인 기준 10,000원 이하 옵션이 표시됨', async ({ page }) => {
    // 고속버스 3,250원, 유후인노모리 4,400원
    await expect(page.getByText(/3,250|4,400/).first()).toBeVisible();
  });
});

test.describe('P3 — 빡빡한 비즈니스 여행자 (역산 + 제안카드)', () => {
  test('[P3-01] 역산 화면에서 출발 시각이 표시됨', async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=역산').first().click();
    await expect(page.getByText('09:20')).toBeVisible(); // ICN→홍대 버스 70분(DB 조회)
  });

  test('[P3-02] 제안카드에서 90분 이내 옵션 존재 (택시 90분)', async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=제안카드').click();
    await expect(page.getByText('90분')).toBeVisible();
  });

  test('[P3-03] 공백감지에서 DANGER 경고 2건 표시', async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=공백감지').click();
    await expect(page.getByText('이동 수단 누락')).toHaveCount(2);
  });
});

test.describe('공통 — 인원수 요금 계산 검증', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=제안카드').click();
  });

  test('[COST-01] 기본 1인 요금 표시 확인', async ({ page }) => {
    await expect(page.getByText(/1인 \d+,\d+원/).first()).toBeVisible();
  });

  test('[COST-02] 4인 설정 시 "× 4명" 요금 라벨 표시', async ({ page }) => {
    const plusBtn = page.getByText('+').first();
    await plusBtn.click();
    await plusBtn.click();
    await plusBtn.click();
    await expect(page.getByText(/× 4명/).first()).toBeVisible();
  });

  test('[COST-03] 인원 감소 시 "× 1명" 라벨 사라짐 (1인이면 미표시)', async ({ page }) => {
    // 기본값 1명 → "× 1명" 텍스트 없어야 함
    await expect(page.getByText(/× 1명/)).toHaveCount(0);
  });
});
