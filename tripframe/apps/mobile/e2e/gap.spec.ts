/**
 * E2E 테스트: SCR-002 — 스마트 체크 탭 Gap 감지 (MoveCheckScreen)
 *
 * TASK-096: gap.spec.ts는 moveCheck.spec.ts와 통합됨.
 * 이 파일은 Gap 감지 관련 핵심 TC만 유지하며 MoveCheckScreen 구조를 사용.
 *
 * 요구사항 매핑: REQ-FR-006~010
 * 검증 시나리오: TC-009, TC-011, TC-014, TC-015
 */

import { test, expect, devices } from '@playwright/test';
import { selectMockTrip } from './helpers';

const MOBILE = devices['Pixel 5'];
test.use({ ...MOBILE });

test.describe('SCR-002 스마트 체크 탭 — Gap 감지', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
    await page.locator('text=스마트 체크').click();
  });

  test('[SCR-002-01] "스마트 체크" 탭 표시', async ({ page }) => {
    await expect(page.getByText('스마트 체크').first()).toBeVisible();
  });

  test('[SCR-002-02] 미해결/완료 카운트 표시', async ({ page }) => {
    await expect(page.getByText(/미해결 \d+건/)).toBeVisible();
  });

  // ── TC-011: 확인 필요 Gap 표시 ──────────────────────────────────────────────

  test('[TC-011] 확인 필요 배지가 1개 이상 표시됨', async ({ page }) => {
    const dangerCards = page.getByText('확인 필요');
    await expect(dangerCards.first()).toBeVisible();
    const count = await dangerCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('[TC-011-B] 확인 필요 배지 정확히 2개 (샘플 데이터 기준)', async ({ page }) => {
    await expect(page.getByText('확인 필요')).toHaveCount(2);
  });

  // ── TC-009: Gap 메시지 내용 ──────────────────────────────────────────────

  test('[TC-009] "하카타" → "유후인" 구간 이동수단 누락 표시', async ({ page }) => {
    await expect(page.getByText(/하카타/).first()).toBeVisible();
  });

  test('[TC-009-B] "유후인" → 공항 구간 이동수단 누락 표시', async ({ page }) => {
    await expect(page.getByText(/유후인/).first()).toBeVisible();
  });

  // ── TC-014: GapCard 펼침 → 교통 옵션 인라인 (REQ-FR-009) ────────────────

  test('[TC-014] 확인 필요 Gap 카드 탭 시 교통 옵션 인라인 펼쳐짐', async ({ page }) => {
    // 기본 펼침 상태 → 클릭으로 닫기 → 다시 클릭으로 열기 순서로 토글 동작 검증
    const card = page.getByText('확인 필요').first().locator('..').locator('..');
    await card.click(); // 닫기
    await expect(page.getByText(/대중교통|택시|렌터카/).first()).not.toBeVisible({ timeout: 3000 });
    await card.click(); // 열기
    await expect(page.getByText(/대중교통|택시|렌터카/).first()).toBeVisible();
  });

  test('[TC-014-B] Gap 카드에 "예약 완료" 버튼 표시', async ({ page }) => {
    // 기본 펼침 상태이므로 바로 확인
    await expect(page.getByText('예약 완료').first()).toBeVisible();
  });

  // ── TC-015: 공백 없을 때 성공 메시지 ────────────────────────────────────

  test('[TC-015] 공백 없을 경우 성공 메시지 표시 가능 (현재 데이터: 공백 존재)', async ({ page }) => {
    await expect(page.getByText('이동 수단 공백 없음')).not.toBeVisible();
  });

  // ── 탭 이동 검증 ─────────────────────────────────────────────────────────

  test('[SCR-002-03] 일정 탭으로 돌아가면 TimelineScreen 재렌더', async ({ page }) => {
    await page.locator('text=일정').first().click();
    await expect(page.getByText('후쿠오카 · 유후인').first()).toBeVisible();
  });
});
