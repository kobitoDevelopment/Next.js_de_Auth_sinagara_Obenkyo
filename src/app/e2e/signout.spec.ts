import { test, expect } from '@playwright/test';

// テスト用のダミーデータ（サインイン用）
const testUser = {
  email: 'user7@gmail.com',
  password: 'user7user7',
};

test.describe('サインアウト機能のテスト', () => {
  // 各テスト前にサインインしておく
  test.beforeEach(async ({ page }) => {
    // サインインページに移動
    await page.goto('/signin2');

    // ユーザー認証情報を入力
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);

    // サインイン
    await page.click('button[type="submit"]');

    // マイページにリダイレクトされたことを確認
    await expect(page).toHaveURL('/mypage2', { timeout: 5000 });
  });

  test('サインアウトボタンが正しく表示されること', async ({ page }) => {
    // サインアウトボタンが表示されていることを確認
    await expect(page.getByText('サインアウト')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('サインアウトボタンをクリックするとサインインページにリダイレクトされること', async ({
    page,
  }) => {
    // サインアウトボタンをクリック
    await page.getByText('サインアウト').click();

    // サインインページにリダイレクトされたことを確認
    await expect(page).toHaveURL('/signin2', { timeout: 5000 });

    // サインインフォームが表示されていることを確認
    await expect(page.locator('h1:has-text("サインイン")')).toBeVisible();
  });

  test('サインアウト後にマイページにアクセスすると、サインインページにリダイレクトされること', async ({
    page,
  }) => {
    // サインアウト
    await page.getByText('サインアウト').click();

    // サインインページへのリダイレクトを確認
    await expect(page).toHaveURL('/signin2', { timeout: 5000 });

    // マイページに直接アクセスを試みる
    await page.goto('/mypage2');

    // 保護されたルートのため、サインインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/signin2', { timeout: 5000 });
  });

  test('サインアウト後に保存されたユーザーセッションが無効化されていること', async ({
    page,
    context,
  }) => {
    // サインアウト
    await page.getByText('サインアウト').click();

    // サインインページへのリダイレクトを確認
    await expect(page).toHaveURL('/signin2', { timeout: 5000 });

    // 新しいタブでマイページを開こうとする
    const newPage = await context.newPage();
    await newPage.goto('/mypage2');

    // サインアウトされているため、サインインページにリダイレクトされることを確認
    await expect(newPage).toHaveURL('/signin2', { timeout: 5000 });
    await newPage.close();
  });
});
