import { test, expect, Page } from '@playwright/test';

// テストユーザーの型定義
interface TestUser {
  username: string;
  email: string;
  password: string;
  role: string;
}

// テストケースごとに別々のユーザーを作成するための関数
function generateTestUser(): TestUser {
  const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2, 8);
  return {
    username: `test_user_${uniqueId}`,
    email: `test-edit-${uniqueId}@example.com`,
    password: 'testPassword123',
    role: 'user',
  };
}

// テストケースごとにユーザーを作成するヘルパー関数
async function createTestUser(page: Page): Promise<TestUser> {
  const user = generateTestUser();

  // サインアップページに移動
  await page.goto('/signup2');

  // フォームに入力
  await page.fill('#username', user.username);
  await page.fill('#email', user.email);
  await page.selectOption('#role', user.role);
  await page.fill('#password', user.password);

  // プライバシーポリシーに同意
  await page.check('#privacyPolicy');

  // フォーム送信
  await page.click('button[type="submit"]');

  // ページロードを待機
  await page.waitForLoadState('networkidle');

  console.log(`テストユーザー作成完了: ${user.email}`);
  return user;
}

// サインインヘルパー関数
async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto('/signin2');

  // ページロードを待機
  await page.waitForLoadState('networkidle');

  // フォームフィールドが確実に表示されるのを待つ
  await page.waitForSelector('#email', { state: 'visible', timeout: 10000 });

  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.click('button[type="submit"]');

  // マイページにリダイレクトされるまで待機
  await expect(page).toHaveURL(/\/mypage2/, { timeout: 10000 });
}

// プロフィール編集ページに移動するヘルパー関数
async function navigateToEditProfile(page: Page): Promise<void> {
  // マイページにいることを確認
  if (!page.url().includes('/mypage2')) {
    await page.goto('/mypage2');
  }

  // 「編集画面へ」リンクをクリック - テキスト内容で要素を特定
  await page.click('a:has-text("編集画面へ")');

  // 編集ページが表示されるまで待機
  await expect(page.locator('h1:has-text("プロフィール編集")')).toBeVisible();
}

test.describe('プロフィール編集機能のテスト', () => {
  test('マイページにユーザー情報が表示され、編集画面へのリンクがあること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // ユーザー情報が表示されていることを確認
    await expect(page.locator('dl dt:has-text("ユーザーID")')).toBeVisible();

    // i要素（ユーザーID）が存在することを確認
    await expect(page.locator('dl dd i')).toBeVisible();

    // 編集画面へのリンクが表示されていることを確認
    await expect(page.locator('a:has-text("編集画面へ")')).toBeVisible();
  });

  test('プロフィール編集ページが正しく表示されること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // プロフィール編集ページに移動
    await navigateToEditProfile(page);

    // 必要なフォーム要素が存在することを確認
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#current_password')).toBeVisible();
    await expect(page.locator('#new_password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('ユーザー名を更新できること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // プロフィール編集ページに移動
    await navigateToEditProfile(page);

    // 新しいユーザー名
    const newUsername = `updated_${user.username}`;

    // フォームに入力
    await page.fill('#username', newUsername);
    await page.fill('#email', user.email); // 元のメールアドレスを維持

    // フォーム送信
    await page.click('button[type="submit"]');

    // 成功メッセージが表示されることを確認
    await expect(page.locator('p:has-text("プロフィールを更新しました")')).toBeVisible();
  });

  test('メールアドレスを更新できること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // プロフィール編集ページに移動
    await navigateToEditProfile(page);

    // 新しいメールアドレス
    const newEmail = `updated-${user.email}`;

    // フォームに入力
    await page.fill('#username', user.username); // 元のユーザー名を維持
    await page.fill('#email', newEmail);

    // フォーム送信
    await page.click('button[type="submit"]');

    // 成功メッセージが表示されることを確認
    await expect(page.locator('p:has-text("プロフィールを更新しました")')).toBeVisible();
  });

  test('パスワードを変更できること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // プロフィール編集ページに移動
    await navigateToEditProfile(page);

    // 新しいパスワード
    const newPassword = 'newPassword456';

    // フォームに入力
    await page.fill('#username', user.username);
    await page.fill('#email', user.email);
    await page.fill('#current_password', user.password); // 元のパスワード
    await page.fill('#new_password', newPassword);

    // フォーム送信
    await page.click('button[type="submit"]');

    // 成功メッセージが表示されることを確認
    await expect(page.locator('p:has-text("プロフィールを更新しました")')).toBeVisible();

    // ここでは新しいパスワードでの再サインインテストはスキップ
    // パスワード変更の成功メッセージが表示されればOKとする
  });

  test('現在のパスワードなしで新しいパスワードを設定するとエラーが表示されること', async ({
    page,
  }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // プロフィール編集ページに移動
    await navigateToEditProfile(page);

    // フォームに入力（現在のパスワードなし）
    await page.fill('#username', user.username);
    await page.fill('#email', user.email);
    await page.fill('#new_password', 'newPassword123');

    // フォーム送信
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('li:has-text("現在のパスワードを入力してください")')).toBeVisible();
  });

  test('間違った現在のパスワードでエラーが表示されること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // プロフィール編集ページに移動
    await navigateToEditProfile(page);

    // フォームに入力（間違ったパスワード）
    await page.fill('#username', user.username);
    await page.fill('#email', user.email);
    await page.fill('#current_password', 'wrongPassword');
    await page.fill('#new_password', 'newPassword123');

    // フォーム送信
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('li:has-text("現在のパスワードが正しくありません")')).toBeVisible();
  });

  test('短すぎる新しいパスワードでエラーが表示されること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // プロフィール編集ページに移動
    await navigateToEditProfile(page);

    // フォームに入力（短いパスワード）
    await page.fill('#username', user.username);
    await page.fill('#email', user.email);
    await page.fill('#current_password', user.password);
    await page.fill('#new_password', '12345'); // 6文字未満

    // フォーム送信
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('li:has-text("パスワードは6文字以上")')).toBeVisible();
  });
});
