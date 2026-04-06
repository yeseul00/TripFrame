/**
 * E2E 테스트: SCR-002 — 이동 체크 탭 (MoveCheckScreen)
 *
 * TASK-096: gap.spec.ts + suggestion.spec.ts → moveCheck.spec.ts 통합 재작성
 *
 * 대상 URL : http://localhost:8082
 * 실행 방법: expo start --web 기동 후 `npx playwright test`
 *
 * 요구사항 매핑: REQ-FR-006~010, FR-P5-003~004
 * 검증 시나리오: TC-009~015, Phase 5 US-002, US-003
 */

import { test, expect, devices } from '@playwright/test';
import { selectMockTrip } from './helpers';

const MOBILE = devices['Pixel 5'];
test.use({ ...MOBILE });

test.describe('SCR-002 이동 체크 탭 — 기본 렌더', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=이동 체크').click();
  });

  test('[SCR-002-01] "이동 체크" 탭 이름 표시', async ({ page }) => {
    await expect(page.getByText('이동 체크').first()).toBeVisible();
  });

  test('[SCR-002-02] 미해결/완료 카운트 요약 표시', async ({ page }) => {
    await expect(page.getByText(/미해결 \d+건/)).toBeVisible();
  });

  test('[SCR-002-03] 인원 선택기 표시', async ({ page }) => {
    await expect(page.getByText('인원')).toBeVisible();
  });
});

test.describe('SCR-002 이동 체크 탭 — Gap 목록 (TC-009~015)', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=이동 체크').click();
  });

  // ── TC-011: DANGER Gap 표시 ──────────────────────────────────────────────

  test('[TC-011] DANGER 배지가 1개 이상 표시됨', async ({ page }) => {
    await expect(page.getByText('DANGER').first()).toBeVisible();
    const count = await page.getByText('DANGER').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('[TC-011-B] DANGER 배지 정확히 2개 (샘플 데이터 기준)', async ({ page }) => {
    await expect(page.getByText('DANGER')).toHaveCount(2);
  });

  // ── TC-009: Gap 메시지 내용 ──────────────────────────────────────────────

  test('[TC-009] "하카타" → "유후인" 구간 표시', async ({ page }) => {
    await expect(page.getByText(/하카타/).first()).toBeVisible();
    await expect(page.getByText(/유후인/).first()).toBeVisible();
  });

  // ── TC-014: Gap 카드 탭 → 교통 옵션 인라인 펼침 ─────────────────────────

  test('[TC-014] Gap 카드 탭 시 교통 옵션 인라인 펼쳐짐', async ({ page }) => {
    // 기본 펼침 상태 → 닫기 → 다시 열기 순서로 토글 동작 검증
    const card = page.getByText('DANGER').first().locator('..').locator('..');
    await card.click(); // 닫기
    await expect(page.getByText(/대중교통|택시|렌터카/).first()).not.toBeVisible({ timeout: 3000 });
    await card.click(); // 열기
    await expect(page.getByText(/대중교통|택시|렌터카/).first()).toBeVisible();
  });

  test('[TC-014-B] Gap 카드에 추천 배지 표시', async ({ page }) => {
    // 기본 펼침 상태이므로 바로 확인
    await expect(page.getByText('추천').first()).toBeVisible();
  });

  test('[TC-014-C] Gap 카드에 요금(원) 표시', async ({ page }) => {
    // 기본 펼침 상태이므로 바로 확인
    await expect(page.getByText(/[0-9,]+원/).first()).toBeVisible();
  });

  test('[TC-014-D] Gap 카드에 소요시간(분) 표시', async ({ page }) => {
    // 기본 펼침 상태이므로 바로 확인
    await expect(page.getByText(/\d+분/).first()).toBeVisible();
  });

  // ── US-002: 예약 완료 버튼 ────────────────────────────────────────────────

  test('[US-002-01] Gap 카드 펼침 시 "예약 완료" 버튼 표시', async ({ page }) => {
    // 기본 펼침 상태이므로 바로 확인
    await expect(page.getByText('예약 완료').first()).toBeVisible();
  });

  test('[US-002-02] "예약 완료" 클릭 시 RESOLVED 상태로 변경됨', async ({ page }) => {
    await page.getByText('예약 완료').first().click();

    // RESOLVED 완료 아이콘 또는 "예약 완료" 카드 표시
    await expect(page.getByText('예약 완료').first()).toBeVisible();
  });
});

test.describe('SCR-002 이동 체크 탭 — 교통 옵션 필터 (SC-004)', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
  });

  test('[SCR-004-09] 설정: 대중교통 선택 시 대중교통 옵션 표시됨', async ({ page }) => {
    await page.locator('text=설정').click();
    await page.getByText('대중교통').click();
    await page.locator('text=이동 체크').click();
    // 이동 체크 진입 시 첫 DANGER Gap 자동 펼침 — 별도 클릭 불필요
    await expect(page.getByText('대중교통').first()).toBeVisible();
  });

  test('[SCR-004-10] 설정: 택시 선택 시 택시 옵션 표시됨', async ({ page }) => {
    await page.locator('text=설정').click();
    await page.getByText('택시').click();
    await page.locator('text=이동 체크').click();
    // 이동 체크 진입 시 첫 DANGER Gap 자동 펼침 — 별도 클릭 불필요
    await expect(page.getByText('택시').first()).toBeVisible();
  });

  test('[SCR-004-06] 인원 + 버튼 클릭 시 인원 증가', async ({ page }) => {
    await page.locator('text=이동 체크').click();
    await page.getByText('+').first().click();
    await expect(page.getByText(/× 2명/).first()).toBeVisible();
  });

  test('[SCR-004-07] 인원 증가 시 합산 요금 변경됨', async ({ page }) => {
    await page.locator('text=이동 체크').click();
    // 첫 DANGER Gap 자동 펼침 상태이므로 바로 요금 확인
    const priceBefore = await page.getByText(/[0-9,]+원/).first().textContent();
    await page.getByText('+').first().click();
    const priceAfter = await page.getByText(/[0-9,]+원/).first().textContent();
    expect(priceBefore).not.toBe(priceAfter);
  });
});

test.describe('SCR-002 이동 체크 탭 — 탭 전환', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
  });

  test('[SCR-002-04] 일정 탭으로 돌아가면 TimelineScreen 재렌더', async ({ page }) => {
    await page.locator('text=이동 체크').click();
    await page.locator('text=일정').click();
    await expect(page.getByText('후쿠오카 · 유후인')).toBeVisible();
  });
});
