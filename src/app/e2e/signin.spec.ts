import { test, expect } from '@playwright/test';

// テスト用のダミーデータ
const testUser = {
  email: 'user7@gmail.com',
  password: 'user7user7',
  invalidPassword: 'WrongPass123',
};

test.describe('サインイン機能のテスト', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にサインインページに移動
    await page.goto('/signin2');
  });

  test('サインインページが正しく表示されること', async ({ page }) => {
    // ページタイトルの確認
    await expect(page.locator('h1:has-text("サインイン")')).toBeVisible();

    // 全ての必要なフォーム要素が存在することを確認
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('有効な認証情報でサインインできること', async ({ page }) => {
    // 注: このテストは事前に登録済みのユーザーを前提としています
    // サインアップテストを先に実行するか、テスト用ユーザーを事前に登録しておく必要があります

    // フォームに入力
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);

    // フォーム送信
    await page.click('button[type="submit"]');

    // マイページにリダイレクトされたことを確認
    await expect(page).toHaveURL('/mypage2', { timeout: 10000 });
  });

  test('無効なパスワードでエラーが表示されること', async ({ page }) => {
    // 正しいメールアドレスと間違ったパスワードを入力
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.invalidPassword);

    // フォーム送信
    await page.click('button[type="submit"]');

    // エラーメッセージを確認
    await expect(page.getByText('パスワードが正しくありません')).toBeVisible();
  });

  test('存在しないユーザーでエラーが表示されること', async ({ page }) => {
    // 存在しないユーザーのメールアドレスを入力
    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'Password123');

    // フォーム送信
    await page.click('button[type="submit"]');

    // エラーメッセージを確認
    await expect(page.getByText('ユーザーが見つかりません')).toBeVisible();
  });

  test('短すぎるパスワードでエラーが表示されること', async ({ page }) => {
    // 短いパスワードを入力
    await page.fill('#email', testUser.email);
    await page.fill('#password', '12345'); // 6文字未満

    // フォーム送信
    await page.click('button[type="submit"]');

    // エラーメッセージを確認
    await expect(page.getByText('パスワードは6文字以上')).toBeVisible();
  });
});
