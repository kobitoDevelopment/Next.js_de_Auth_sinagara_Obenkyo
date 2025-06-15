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
    email: `test-delete-${uniqueId}@example.com`,
    password: 'deleteTest123',
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
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.click('button[type="submit"]');

  // マイページにリダイレクトされるまで待機
  await expect(page).toHaveURL(/\/mypage2/, { timeout: 5000 });
}

test.describe('アカウント削除機能のテスト', () => {
  test('アカウント削除ボタンが表示されること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // 削除ボタンが表示されていることを確認
    await expect(page.getByText('アカウントを削除する')).toBeVisible();
  });

  test('削除をキャンセルした場合、アカウントが削除されないこと', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // 確認ダイアログでキャンセルを選択するよう設定（テスト開始時に設定）
    page.on('dialog', async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // 削除ボタンをクリック
    await page.getByText('アカウントを削除する').click();

    // 少し待機してダイアログ処理が完了するのを待つ
    await page.waitForTimeout(1000);

    // キャンセルしたので、まだマイページにいることを確認
    await expect(page).toHaveURL(/\/mypage2/);

    // 削除ボタンもまだ表示されていることを確認
    await expect(page.getByText('アカウントを削除する')).toBeVisible();
  });

  test('アカウントを削除して、サインインページにリダイレクトされること', async ({ page }) => {
    // テスト用ユーザーを作成
    const user = await createTestUser(page);

    // サインイン
    await signIn(page, user);

    // 確認ダイアログでOKを選択するよう設定（テスト開始時に設定）
    page.on('dialog', async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    // 削除ボタンをクリック
    await page.getByText('アカウントを削除する').click();

    // サインインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/signin2/, { timeout: 10000 });

    // 削除したアカウントでサインインを試みる
    await page.goto('/signin2');
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.getByText('ユーザーが見つかりません')).toBeVisible();

    // サインインページのままであることを確認
    await expect(page).toHaveURL(/\/signin2/);
  });
});
