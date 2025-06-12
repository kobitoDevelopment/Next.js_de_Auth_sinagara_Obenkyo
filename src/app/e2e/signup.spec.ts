import { test, expect } from '@playwright/test';

// テストアカウント情報（テスト環境用）
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'securePassword123';

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にホームページにアクセス
    await page.goto('/');
  });

  test('新規ユーザーがサインアップできる', async ({ page }) => {
    // ユニークなメールアドレスを生成（テスト間の衝突を避けるため）
    const uniqueEmail = `test-${Date.now()}@example.com`;

    await page.click('text=Sign up');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // サインアップ後の状態検証
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('ユーザー情報の更新ができる', async ({ page }) => {
    // まずログイン
    await page.click('text=Log in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // プロフィールページに移動
    await page.click('text=Profile');

    // ユーザー情報を更新
    await page.fill('input[name="displayName"]', 'Updated Name');
    await page.click('button:has-text("Save")');

    // 更新成功メッセージを確認
    await expect(page.locator('text=Profile updated')).toBeVisible();
  });
});
