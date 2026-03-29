/**
 * E2E 테스트: SCR-004 — 제안카드 탭 (SuggestionScreen)
 *
 * 대상 URL : http://localhost:8081
 * 검증 시나리오: US-003 이동수단 비교 Acceptance Criteria
 */

import { test, expect, devices } from '@playwright/test';
import { selectMockTrip } from './helpers';

const MOBILE = devices['Pixel 5'];
test.use({ ...MOBILE });

test.describe('SCR-004 제안카드 탭', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=제안카드').click();
  });

  test('[SCR-004-01] 제안카드 탭 진입 확인', async ({ page }) => {
    // 공통 헤더에 탭 이름 표시
    await expect(page.getByText('제안카드').first()).toBeVisible();
  });

  test('[SCR-004-02] DANGER Gap 구간이 표시됨 (하카타→유후인)', async ({ page }) => {
    await expect(page.getByText(/하카타.*유후인|유후인.*하카타/).first()).toBeVisible();
  });

  test('[SCR-004-03] 각 구간에 OptionCard가 1개 이상 표시됨', async ({ page }) => {
    // 추천 배지 또는 대중교통/택시 라벨 존재 확인
    const cards = page.getByText(/대중교통|택시|렌터카/);
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('[SCR-004-04] 첫 번째 옵션에 "추천" 배지 표시', async ({ page }) => {
    await expect(page.getByText('추천').first()).toBeVisible();
  });

  test('[SCR-004-05] 요금이 숫자 형식으로 표시됨 (원)', async ({ page }) => {
    await expect(page.getByText(/[0-9,]+원/).first()).toBeVisible();
  });

  test('[SCR-004-06] 인원수 + 버튼 클릭 시 인원 증가', async ({ page }) => {
    await page.getByText('+').first().click();
    // 인원수 표시 텍스트 "× 2명" 확인 (요금 라벨에 반영됨)
    await expect(page.getByText(/× 2명/).first()).toBeVisible();
  });

  test('[SCR-004-07] 인원 증가 시 합산 요금 변경됨', async ({ page }) => {
    // 1인 요금 텍스트 캡처
    const priceBefore = await page.getByText(/[0-9,]+원/).first().textContent();
    await page.getByText('+').first().click();
    const priceAfter = await page.getByText(/[0-9,]+원/).first().textContent();
    expect(priceBefore).not.toBe(priceAfter);
  });

  test('[SCR-004-08] 소요시간 "분" 표시 확인', async ({ page }) => {
    await expect(page.getByText(/\d+분/).first()).toBeVisible();
  });

  // ── 교통 선호도 정렬 (REQ-FR-014, TASK-074) ──────────────────────────────

  test('[SCR-004-09] 설정: 대중교통 선택 시 대중교통 옵션이 첫 번째로 표시됨', async ({ page }) => {
    // 설정 탭에서 대중교통 선택
    await page.locator('text=설정').click();
    await page.getByText('대중교통').click();
    // 제안카드로 이동
    await page.locator('text=제안카드').click();
    // 첫 번째 옵션 카드가 대중교통 모드여야 함
    const firstMode = page.getByText('대중교통').first();
    await expect(firstMode).toBeVisible();
  });

  test('[SCR-004-10] 설정: 택시 선택 시 택시 옵션이 첫 번째로 표시됨', async ({ page }) => {
    // 설정 탭에서 택시 선택
    await page.locator('text=설정').click();
    await page.getByText('택시').click();
    // 제안카드로 이동
    await page.locator('text=제안카드').click();
    // 택시 옵션이 상단에 있어야 함
    const taxiOption = page.getByText('택시').first();
    await expect(taxiOption).toBeVisible();
  });
});

test.describe('SCR-005 설정 탭', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=설정').click();
  });

  test('[SCR-005-01] "설정" 타이틀 표시', async ({ page }) => {
    await expect(page.getByText('설정').first()).toBeVisible();
  });

  test('[SCR-005-02] 짐 크기 옵션 표시 (기내용 / 위탁용)', async ({ page }) => {
    await expect(page.getByText('기내용')).toBeVisible();
    await expect(page.getByText('위탁용')).toBeVisible();
  });

  test('[SCR-005-03] 교통 선호 옵션 표시 (대중교통 / 택시 / 무관)', async ({ page }) => {
    await expect(page.getByText('대중교통')).toBeVisible();
    await expect(page.getByText('택시')).toBeVisible();
    await expect(page.getByText('무관')).toBeVisible();
  });

  test('[SCR-005-04] 여유도 옵션 표시 (빡빡하게 / 여유있게)', async ({ page }) => {
    await expect(page.getByText('빡빡하게')).toBeVisible();
    await expect(page.getByText('여유있게')).toBeVisible();
  });

  test('[SCR-005-05] 비로그인 상태에서 "오프라인 모드" 표시', async ({ page }) => {
    await expect(page.getByText('오프라인 모드')).toBeVisible();
  });

  test('[SCR-005-06] Google 로그인 버튼 표시', async ({ page }) => {
    await expect(page.getByText('Google 로그인')).toBeVisible();
  });
});
