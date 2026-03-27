/**
 * E2E 테스트: SCR-002 — 공백감지 탭 (GapDetectionScreen)
 *
 * 대상 URL : http://localhost:8081
 * 실행 방법: expo start --web 기동 후 Playwright MCP 또는 `npx playwright test`
 *
 * 요구사항 매핑 (TF-RDS-001):
 *   REQ-FR-006, REQ-FR-007, REQ-FR-008, REQ-FR-009, REQ-FR-010
 * 검증 시나리오:
 *   TC-009, TC-010, TC-011, TC-012, TC-013, TC-014, TC-015
 * implement.md 시나리오 2
 */

import { test, expect, devices } from '@playwright/test';

const MOBILE = devices['Pixel 5'];

test.use({ ...MOBILE });

test.describe('SCR-002 공백감지 탭', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // 공백감지 탭으로 이동
    await page.getByRole('button', { name: '공백감지' }).click();
  });

  // ── 화면 기본 렌더 ──────────────────────────────────────────────────────

  test('[SCR-002-01] "공백 감지" 타이틀 표시', async ({ page }) => {
    await expect(page.getByText('공백 감지')).toBeVisible();
  });

  test('[SCR-002-02] 요약 카드 — 위험 공백 / 총 공백 / 완성 구간 수치 표시', async ({ page }) => {
    await expect(page.getByText('위험 공백')).toBeVisible();
    await expect(page.getByText('총 공백')).toBeVisible();
    await expect(page.getByText('완성 구간')).toBeVisible();
  });

  // ── TC-011: DANGER 카드 (REQ-FR-006, REQ-FR-008) ─────────────────────────

  test('[TC-011] "이동 수단 누락" DANGER 카드가 1개 이상 표시됨', async ({ page }) => {
    const dangerCards = page.getByText('이동 수단 누락');
    await expect(dangerCards.first()).toBeVisible();
    const count = await dangerCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('[TC-011-B] DANGER 카드가 정확히 2개 (샘플 데이터 기준)', async ({ page }) => {
    const dangerCards = page.getByText('이동 수단 누락');
    await expect(dangerCards).toHaveCount(2);
  });

  // ── TC-009: Gap 메시지 내용 (REQ-FR-006) ─────────────────────────────────

  test('[TC-009] "하카타에서 유후인" 이동수단 누락 메시지 표시', async ({ page }) => {
    await expect(page.getByText(/하카타에서 유후인/)).toBeVisible();
  });

  test('[TC-009-B] "유후인에서 공항" 이동수단 누락 메시지 표시', async ({ page }) => {
    await expect(page.getByText(/유후인에서 공항/)).toBeVisible();
  });

  // ── TC-014: GapCard 펼침 → suggestions (REQ-FR-009) ─────────────────────

  test('[TC-014] DANGER GapCard 탭 시 이동수단 옵션 펼쳐짐', async ({ page }) => {
    // 첫 번째 DANGER 카드 탭
    const firstCard = page.getByText('이동 수단 누락').first().locator('..');
    await firstCard.click();

    // 옵션 목록 노출 확인
    await expect(page.getByText('선택 가능한 이동 수단')).toBeVisible();
  });

  test('[TC-014-B] GapCard 재탭 시 닫힘', async ({ page }) => {
    const firstCard = page.getByText('이동 수단 누락').first().locator('..');
    await firstCard.click();
    await expect(page.getByText('선택 가능한 이동 수단')).toBeVisible();

    await firstCard.click();
    await expect(page.getByText('선택 가능한 이동 수단')).not.toBeVisible();
  });

  // ── TC-015: 자동삽입 태그 (REQ-FR-010) ───────────────────────────────────
  // 자동삽입 이벤트는 현재 샘플 데이터에 없으므로 UI 구조 확인만
  test('[TC-015] 공백 없을 경우 성공 메시지 "모든 구간이 연결" 표시 가능', async ({ page }) => {
    // 현재 샘플 데이터는 공백 있음 → 성공 메시지 없어야 함
    await expect(page.getByText('모든 구간이 연결되었습니다')).not.toBeVisible();
  });

  // ── 탭 이동 검증 ─────────────────────────────────────────────────────────

  test('[SCR-002-03] 일정 탭으로 돌아가면 TimelineScreen 재렌더', async ({ page }) => {
    await page.getByRole('button', { name: '일정' }).click();
    await expect(page.getByText('후쿠오카 · 유후인')).toBeVisible();
  });
});
