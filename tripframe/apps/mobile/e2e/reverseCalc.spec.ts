/**
 * E2E 테스트: 스마트 타임라인 (역산) 모달
 *
 * v1.1: 역산이 전용 탭에서 바텀시트 모달로 변경됨.
 * 일정 탭에서 스마트 타임라인 배지를 탭하면 모달이 열림.
 */

import { test, expect, devices } from '@playwright/test';
import { selectMockTrip } from './helpers';

const MOBILE = devices['Pixel 5'];

test.use({ ...MOBILE });

/** 역산 모달을 여는 헬퍼 — 일정 탭 Day 1에서 스마트 타임라인 배지 탭 */
async function openReverseCalcModal(page: import('@playwright/test').Page) {
  await page.getByText('Day 1').click();
  await page.getByText('스마트 타임라인').first().click();
  await page.waitForSelector('text=스마트 타임라인', { state: 'visible', timeout: 5000 });
}

test.describe('스마트 타임라인 모달', () => {
  test.beforeEach(async ({ page }) => {
    await selectMockTrip(page);
  });

  // ── 모달 열기/닫기 ──────────────────────────────────────────────────────

  test('[REV-01] 스마트 타임라인 배지 탭 시 모달이 열린다', async ({ page }) => {
    await openReverseCalcModal(page);
    await expect(page.getByText('스마트 타임라인').first()).toBeVisible();
  });

  test('[REV-02] 닫기 버튼 탭 시 모달이 닫힌다', async ({ page }) => {
    await openReverseCalcModal(page);
    await page.getByText('닫기').click();
    // 모달 닫힌 후 일정 탭이 보여야 함
    await expect(page.getByText('Day 1').first()).toBeVisible();
  });

  // ── Anchor 카드 ──────────────────────────────────────────────────────────

  test('[REV-03] Anchor 이벤트 카드 — 앵커 이벤트 레이블 표시', async ({ page }) => {
    await openReverseCalcModal(page);
    await expect(page.getByText('앵커 이벤트 (기준 시각)')).toBeVisible();
  });

  test('[REV-04] Anchor 시각 12:15 표시', async ({ page }) => {
    await openReverseCalcModal(page);
    await expect(page.getByText('12:15').first()).toBeVisible();
  });

  // ── TC-007, TC-008: 역산 결과 ────────────────────────────────────────────

  test('[TC-007] 권장 집 출발 시각 09:20 표시', async ({ page }) => {
    await openReverseCalcModal(page);
    await expect(page.getByText('권장 집 출발 시각')).toBeVisible();
    await expect(page.getByText('09:20').first()).toBeVisible();
  });

  test('[TC-008-A] 역산 단계 섹션 표시', async ({ page }) => {
    await openReverseCalcModal(page);
    await expect(page.getByText('역산 단계')).toBeVisible();
  });

  test('[TC-008-B] 역산 단계: 공항 체크인 항목 표시', async ({ page }) => {
    await openReverseCalcModal(page);
    await expect(page.getByText('공항 체크인').first()).toBeVisible();
  });

  test('[TC-008-C] 역산 단계: 공항 이동 버스 항목 표시', async ({ page }) => {
    await openReverseCalcModal(page);
    await expect(page.getByText('공항 이동 버스').first()).toBeVisible();
  });
});
