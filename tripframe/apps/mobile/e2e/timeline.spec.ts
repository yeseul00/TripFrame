/**
 * E2E 테스트: SCR-001 — 일정 탭 (TimelineScreen)
 *
 * v1.1: 탭 구조 홈/일정/스마트 체크/마이, 역산 뱃지 → 스마트 타임라인
 */

import { test, expect, devices } from '@playwright/test';
import { selectMockTrip } from './helpers';

const MOBILE = devices['Pixel 5'];

test.use({ ...MOBILE });

test.describe('SCR-001 일정 탭', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
  });

  // ── 화면 기본 렌더 ──────────────────────────────────────────────────────

  test('[SCR-001-01] 여행 타이틀 "후쿠오카 · 유후인" 표시', async ({ page }) => {
    await expect(page.getByText('후쿠오카 · 유후인').first()).toBeVisible();
  });

  test('[SCR-001-03] Day 선택 탭 3개 (Day 1, Day 2, Day 3) 표시', async ({ page }) => {
    await expect(page.getByText('Day 1')).toBeVisible();
    await expect(page.getByText('Day 2')).toBeVisible();
    await expect(page.getByText('Day 3')).toBeVisible();
  });

  // ── TC-007: 스마트 타임라인 배지 ─────────────────────────────────────────

  test('[TC-007] Day 1 — 집 출발에 스마트 타임라인 배지 표시', async ({ page }) => {
    await page.getByText('Day 1').click();
    await expect(page.getByText('집 출발')).toBeVisible();
    await expect(page.getByText('스마트 타임라인').first()).toBeVisible();
  });

  // ── Day 전환 ────────────────────────────────────────────────────────────

  test('[SCR-001-04] Day 2 탭 클릭 시 Day 2 이벤트 표시', async ({ page }) => {
    await page.getByText('Day 2').click();
    await expect(page.getByText('호텔 체크아웃')).toBeVisible();
  });

  test('[SCR-001-05] Day 3 탭 클릭 시 Day 3 이벤트 표시', async ({ page }) => {
    await page.getByText('Day 3').click();
    await expect(page.getByText('인천행 비행기')).toBeVisible();
  });

  // ── TC-009: 공백 감지 표시 ─────────────────────────────────────────────

  test('[TC-009] Day 2 — 이동수단 필요 경고 카드 표시', async ({ page }) => {
    await page.getByText('Day 2').click();
    await expect(page.getByText('이동 수단이 필요해요')).toBeVisible();
  });

  // ── 하단 탭바 ───────────────────────────────────────────────────────────

  test('[SCR-001-07] 하단 탭바 4개 탭 표시 (홈, 일정, 스마트 체크, 마이)', async ({ page }) => {
    await expect(page.getByText('홈').first()).toBeVisible();
    await expect(page.getByText('일정').first()).toBeVisible();
    await expect(page.getByText('스마트 체크').first()).toBeVisible();
    await expect(page.getByText('마이').first()).toBeVisible();
  });
});
