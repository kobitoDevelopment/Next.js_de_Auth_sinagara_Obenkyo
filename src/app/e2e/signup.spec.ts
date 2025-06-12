import { test, expect } from '@playwright/test';

// テスト用のユニークなデータを生成するためのヘルパー関数
const generateUniqueData = () => {
  const timestamp = Date.now();
  return {
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'Password123',
  };
};

test.describe('サインアップ機能のテスト', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にサインアップページに移動
    await page.goto('/signup2');
  });

  test('サインアップページが正しく表示されること', async ({ page }) => {
    // ページタイトルの確認（h1要素を直接使用）
    await expect(page.locator('h1:has-text("サインアップ")')).toBeVisible();

    // 全ての必要なフォーム要素が存在することを確認
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#role')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#privacyPolicy')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('有効な情報でサインアップできること', async ({ page }) => {
    // テスト用の一意のデータを生成
    const testData = generateUniqueData();

    // フォームに入力
    await page.fill('#username', testData.username);
    await page.fill('#email', testData.email);
    await page.selectOption('#role', 'user');
    await page.fill('#password', testData.password);
    await page.check('#privacyPolicy');

    // フォーム送信
    await page.click('button[type="submit"]');

    // フォーム送信後のネットワークアクティビティを待つ
    await page.waitForTimeout(5000);

    // サインインページにリダイレクトされたことを確認
    await expect(page).toHaveURL('/signin2', { timeout: 5000 });
  });

  test('必須フィールドの検証が機能すること', async ({ page }) => {
    // 空のフォームを送信
    await page.click('button[type="submit"]');

    // フォーム送信後のネットワークアクティビティを待つ
    await page.waitForTimeout(5000);

    // 全てのエラーが表示されていることを確認
    await expect(page.getByText('ユーザー名は必須です')).toBeVisible();
    await expect(page.getByText('メールアドレスの形式が正しくありません')).toBeVisible();
    await expect(page.getByText('パスワードは6文字以上で入力してください')).toBeVisible();
    await expect(page.getByText('プライバシーポリシーへの同意が必要です')).toBeVisible();
  });

  test('短すぎるパスワードでエラーが表示されること', async ({ page }) => {
    const testData = generateUniqueData();

    // 短いパスワードを入力
    await page.fill('#username', testData.username);
    await page.fill('#email', testData.email);
    await page.selectOption('#role', 'user');
    await page.fill('#password', '12345'); // 6文字未満
    await page.check('#privacyPolicy');

    // フォーム送信
    await page.click('button[type="submit"]');

    // フォーム送信後のネットワークアクティビティを待つ
    await page.waitForTimeout(5000);

    // 特定のエラーメッセージが表示されるのを待つ
    await expect(page.getByText('パスワードは6文字以上で入力してください')).toBeVisible();
  });
});
