/**
 * E2E 테스트: Trip CRUD — 여행 생성/수정/삭제 (Phase 3)
 */

import { test, expect, devices } from '@playwright/test';
import { gotoHome } from './helpers';

const MOBILE = devices['Pixel 5'];
test.use({ ...MOBILE });

/** 여행명 입력 필드를 정확히 가져오는 헬퍼 */
async function getTitleInput(page: ReturnType<typeof import('@playwright/test').test.info>) {
  return page;
}

test.describe('TripFormModal — 여행 생성', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('[CRUD-01] "+ 새 여행 만들기" 탭 → 모달이 열린다', async ({ page }) => {
    await page.getByText('+ 새 여행 만들기').click();
    // '새 여행' 텍스트는 모달 헤더에 있음 (exact: true로 중복 회피)
    await expect(page.getByText('새 여행', { exact: true })).toBeVisible();
  });

  test('[CRUD-02] 여행명 없이 저장 시도 → 인라인 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByText('+ 새 여행 만들기').click();

    await page.getByText('저장', { exact: true }).click();
    // React Native Web은 Alert.alert()가 no-op이므로 인라인 에러 텍스트로 표시
    await expect(page.getByText('여행명을 입력해 주세요.')).toBeVisible();
  });

  test('[CRUD-03] 여행명 입력 후 저장 → 홈 목록에 추가된다', async ({ page }) => {
    await page.getByText('+ 새 여행 만들기').click();
    // 여행명 필드: 첫 번째 textbox (후쿠오카 · 유후인 placeholder)
    await page.getByPlaceholder('예: 후쿠오카 · 유후인').fill('도쿄 여행');
    await page.getByText('저장', { exact: true }).click();
    await expect(page.getByText('도쿄 여행')).toBeVisible();
  });

  test('[CRUD-04] 모달 "취소" 탭 → 모달이 닫힌다', async ({ page }) => {
    await page.getByText('+ 새 여행 만들기').click();
    await expect(page.getByText('새 여행', { exact: true })).toBeVisible();
    await page.getByText('취소', { exact: true }).click();
    await expect(page.getByText('내 여행')).toBeVisible();
    await expect(page.getByText('새 여행', { exact: true })).not.toBeVisible();
  });

  test('[CRUD-05] 여행명 + 목적지 입력 → 저장 후 목적지가 카드에 표시된다', async ({ page }) => {
    await page.getByText('+ 새 여행 만들기').click();
    await page.getByPlaceholder('예: 후쿠오카 · 유후인').fill('오사카 여행');
    await page.getByPlaceholder('예: 일본 후쿠오카').fill('일본 오사카');
    await page.getByText('저장', { exact: true }).click();
    await expect(page.getByText('일본 오사카')).toBeVisible();
  });
});

test.describe('TripFormModal — 여행 수정', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('[CRUD-06] "···" 버튼 탭 → 수정 모달이 열린다', async ({ page }) => {
    await page.getByText('···').first().click();
    await expect(page.getByText('여행 수정', { exact: true })).toBeVisible();
  });

  test('[CRUD-07] 수정 모달에 기존 여행명이 입력되어 있다', async ({ page }) => {
    await page.getByText('···').first().click();
    const titleInput = page.getByPlaceholder('예: 후쿠오카 · 유후인');
    await expect(titleInput).toHaveValue('후쿠오카 · 유후인');
  });

  test('[CRUD-08] 여행명 수정 후 저장 → 홈 목록에 반영된다', async ({ page }) => {
    await page.getByText('···').first().click();
    const titleInput = page.getByPlaceholder('예: 후쿠오카 · 유후인');
    await titleInput.clear();
    await titleInput.fill('후쿠오카 수정됨');
    await page.getByText('저장', { exact: true }).click();
    await expect(page.getByText('후쿠오카 수정됨')).toBeVisible();
  });
});

test.describe('TripFormModal — 여행 삭제', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    // 삭제용 임시 여행 추가
    await page.getByText('+ 새 여행 만들기').click();
    await page.getByPlaceholder('예: 후쿠오카 · 유후인').fill('삭제용 여행');
    await page.getByText('저장', { exact: true }).click();
  });

  test('[CRUD-09] 수정 모달에 "이 여행 삭제" 버튼이 있다', async ({ page }) => {
    // beforeEach 후 카드는 2개: [0] 모크 여행, [1] 삭제용 여행 — .nth(1)로 명시
    await page.getByText('···').nth(1).click();
    await expect(page.getByText('이 여행 삭제')).toBeVisible();
  });

  test('[CRUD-10] 삭제 확인 후 여행이 목록에서 사라진다', async ({ page }) => {
    // beforeEach 후 카드는 2개: [0] 모크 여행, [1] 삭제용 여행 — .nth(1)로 명시
    await page.getByText('···').nth(1).click();
    await page.getByText('이 여행 삭제').click();
    // 인라인 삭제 확인 UI에서 "삭제 확인" 버튼 클릭
    await page.getByText('삭제 확인', { exact: true }).click();
    // 삭제 확인 후 목록에서 사라짐
    await expect(page.getByText('삭제용 여행')).not.toBeVisible({ timeout: 5000 });
  });
});
