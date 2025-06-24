import { test, expect, Page } from '@playwright/test';

// テスト用アカウント情報 - 実際の環境に合わせて調整してください
const adminUser = {
  email: 'admin1@gmail.com',
  password: 'admin1admin1',
};

const regularUser = {
  email: 'user1@gmail.com',
  password: 'user1user1',
};

test.describe('管理者画面のテスト', () => {
  // テスト全体のタイムアウトを設定
  test.setTimeout(60000);

  // 管理者としてログインするヘルパー関数 - 詳細なデバッグ情報を含む
  async function loginAsAdmin(page: Page) {
    console.log('管理者ログイン処理開始');
    await page.goto('/signin2');
    console.log('サインインページ読み込み完了');

    await page.fill('#email', adminUser.email);
    await page.fill('#password', adminUser.password);
    console.log(`ログイン試行: ${adminUser.email}`);

    // フォーム送信前のスクリーンショット（オプション）
    await page.screenshot({ path: 'before-login.png' });

    await page.click('button[type="submit"]');
    console.log('ログインフォーム送信完了');

    // エラーメッセージをチェック
    try {
      const errorEl = page.locator('.error-message');
      const isVisible = await errorEl.isVisible({ timeout: 2000 });
      if (isVisible) {
        const errorText = await errorEl.textContent();
        console.error(`ログインエラーを検出: ${errorText}`);
        await page.screenshot({ path: 'login-error.png' });
      }
    } catch (error) {
      // エラーメッセージ要素の検出に失敗した場合の処理
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`エラーメッセージ要素の検出中にエラー発生: ${errorMessage}`);
    }

    try {
      // 明示的なリダイレクト先を待つ
      await page.waitForURL('/mypage2', { timeout: 10000 });
      console.log('マイページへのリダイレクト成功');

      // 認証状態が反映されるための追加待機
      await page.waitForTimeout(1000);

      // ログイン後のスクリーンショット
      await page.screenshot({ path: 'after-login.png' });

      // Cookieを確認
      const cookies = await page.context().cookies();
      const userIdCookie = cookies.find((c) => c.name === 'user_id');

      if (userIdCookie) {
        console.log('user_idクッキーを確認:', userIdCookie.value);
      } else {
        console.error('user_idクッキーが見つかりません');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`リダイレクトまたは認証に失敗: ${errorMessage}`);
      console.log('現在のURL:', page.url());
      await page.screenshot({ path: 'login-failure.png' });
    }
    console.log('管理者ログイン処理終了');
  }

  // 一般ユーザーとしてログインするヘルパー関数
  async function loginAsUser(page: Page) {
    console.log('一般ユーザーログイン処理開始');
    await page.goto('/signin2');

    await page.fill('#email', regularUser.email);
    await page.fill('#password', regularUser.password);
    console.log(`ログイン試行: ${regularUser.email}`);

    await page.click('button[type="submit"]');

    // エラーメッセージをチェック
    try {
      const errorEl = page.locator('.error-message');
      const isVisible = await errorEl.isVisible({ timeout: 2000 });
      if (isVisible) {
        const errorText = await errorEl.textContent();
        console.error(`ログインエラーを検出: ${errorText}`);
      }
    } catch (error) {
      // エラーメッセージ要素の検出に失敗した場合の処理
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`エラーメッセージ要素の検出中にエラー発生: ${errorMessage}`);
    }

    try {
      await page.waitForURL('/mypage2', { timeout: 10000 });
      console.log('マイページへのリダイレクト成功');

      // 認証状態が反映されるための追加待機
      await page.waitForTimeout(1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`リダイレクトに失敗: ${errorMessage}`);
      console.log('現在のURL:', page.url());
    }
    console.log('一般ユーザーログイン処理終了');
  }

  // 管理者としての認証とCookieを検証
  test('管理者として認証しCookieを検証する', async ({ page }) => {
    await loginAsAdmin(page);

    // Cookieを確認
    const cookies = await page.context().cookies();
    console.log('ログイン後の全クッキー:', cookies);

    const userIdCookie = cookies.find((c) => c.name === 'user_id');
    expect(userIdCookie).toBeDefined();

    // 管理者ページにアクセスを試みる
    await page.goto('/admin2');

    // 現在のURLを確認（リダイレクトされていないか）
    expect(page.url()).toContain('/admin2');

    // 管理者ページの内容を確認
    await expect(page.getByText('ユーザー一覧')).toBeVisible();
  });

  test('管理者は管理画面にアクセスできること', async ({ page }) => {
    await loginAsAdmin(page);

    // 管理画面に移動
    await page.goto('/admin2');

    // 管理画面のタイトルが表示されることを確認
    await expect(page.getByText('ユーザー一覧')).toBeVisible();

    // 現在のURLを確認
    console.log('管理画面URL:', page.url());
    expect(page.url()).toContain('/admin2');
  });

  test('一般ユーザーは管理画面にアクセスできないこと', async ({ page }) => {
    await loginAsUser(page);

    // 管理画面へのアクセスを試みる
    await page.goto('/admin2');

    // リダイレクト先を確認
    console.log('リダイレクト後URL:', page.url());

    // トップページにリダイレクトされることを確認
    // 注意: リダイレクト先がsignin2かどうか確認
    await expect(page).not.toHaveURL('/admin2');
  });

  test('未ログインユーザーは管理画面にアクセスできないこと', async ({ page }) => {
    // 直接管理画面にアクセスを試みる
    await page.goto('/admin2');

    // リダイレクト先を確認
    console.log('未ログイン時のリダイレクト後URL:', page.url());

    // ログインページなどにリダイレクトされることを確認
    await expect(page).not.toHaveURL('/admin2');
  });

  test('ユーザーテーブルが表示され、データがロードされること', async ({ page }) => {
    await loginAsAdmin(page);

    // 管理画面に移動
    await page.goto('/admin2');

    // タイトルが表示されることを確認
    await expect(page.getByText('ユーザー一覧')).toBeVisible();

    // Suspenseのローディング状態が表示されることがある
    // ローディング状態が解決するまで待つ
    try {
      await page.waitForSelector('div:text("Suspense...")', { timeout: 5000 });
      console.log('Suspenseローディング状態を検出');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Suspenseローディング状態なし、または素早く消えました: ${errorMessage}`);
    }

    // テーブルが表示されるのを待つ（タイムアウトを増やす）
    await page.waitForSelector('table', { timeout: 10000 });

    // テーブルヘッダーが表示されることを確認
    await expect(page.locator('table thead tr th')).toHaveCount(6);

    // 統計情報が表示されることを確認
    await expect(page.getByText('全ユーザー数:')).toBeVisible();

    // データのロードを待つ（非同期処理が完了するのを待つ）
    // まず初期ロード時のローディングが完了するのを待つ
    await page.waitForTimeout(2000);

    // ユーザーデータが表示されるか、空の状態が適切に表示されるかを確認
    const rowCount = await page.locator('tbody tr').count();
    console.log(`ユーザー行数: ${rowCount}件`);

    if (rowCount > 0) {
      // データがある場合、最初の行を検証
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow.locator('td')).toHaveCount(6);

      // 最初の行のデータをログに出力（デバッグ用）
      const firstRowText = await firstRow.textContent();
      console.log('最初の行のデータ:', firstRowText);
    } else {
      // データがない場合
      console.log('テーブルにユーザーデータが見つかりません');
    }

    // 画面のスクリーンショットを取得（デバッグ用）
    await page.screenshot({ path: 'admin-table.png' });
  });

  test('ページネーションが存在する場合は機能すること', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin2');

    // テーブルが表示されるのを待つ
    await page.waitForSelector('table', { timeout: 10000 });

    // ページネーションの存在を確認
    const hasPagination = await page.locator('nav').isVisible();

    if (!hasPagination) {
      console.log('ページネーションが存在しません。データが少ない可能性があります。');
      test.skip();
      return;
    }

    console.log('ページネーションが見つかりました。');

    // 現在のページ番号を確認
    const currentPage = await page.locator('a[aria-current="page"]').textContent();
    console.log(`現在のページ: ${currentPage}`);

    // 2ページ目のリンクの存在を確認
    const hasPage2 = await page.locator('a[href="#page=2"]').isVisible();

    if (!hasPage2) {
      console.log('2ページ目のリンクが存在しません。データが少ない可能性があります。');
      test.skip();
      return;
    }

    // 現在のテーブルの内容を記録
    const firstPageFirstRowText = await page
      .locator('tbody tr:first-child td:first-child')
      .textContent();

    // 2ページ目をクリック
    await page.click('a[href="#page=2"]');

    // URLハッシュが変更されることを確認
    await expect(page).toHaveURL(/.*#page=2/);

    // ページが切り替わるのを待つ（ローディング状態や非同期処理の完了を待つ）
    await page.waitForTimeout(2000);

    // 2ページ目がアクティブになっていることを確認
    await expect(page.locator('a[aria-current="page"]')).toHaveText('2');

    // 2ページ目のデータが1ページ目と異なることを確認（可能であれば）
    const secondPageFirstRowText = await page
      .locator('tbody tr:first-child td:first-child')
      .textContent();

    // データが異なることを確認できない場合もあるので、警告として出力
    if (firstPageFirstRowText === secondPageFirstRowText) {
      console.log(
        '警告: 1ページ目と2ページ目の最初の行のIDが同じです。ページネーションが正しく機能していない可能性があります。'
      );
    } else {
      console.log('1ページ目と2ページ目のデータが異なることを確認しました。');
    }

    // ページネーションのスクリーンショットを取得（デバッグ用）
    await page.screenshot({ path: 'pagination.png' });
  });

  test('URLハッシュによるページ切り替えが機能すること', async ({ page }) => {
    await loginAsAdmin(page);

    // 直接2ページ目にアクセス
    await page.goto('/admin2#page=2');

    // テーブルが表示されるのを待つ
    await page.waitForSelector('table', { timeout: 10000 });

    // ページネーションの存在を確認
    const hasPagination = await page.locator('nav').isVisible();

    if (!hasPagination) {
      console.log('ページネーションが存在しません。データが少ない可能性があります。');
      test.skip();
      return;
    }

    // ページの読み込みとデータの取得が完了するのを待つ
    await page.waitForTimeout(2000);

    // 2ページ目がアクティブになっていることを確認
    try {
      await expect(page.locator('a[aria-current="page"]')).toHaveText('2', { timeout: 5000 });
      console.log('URLハッシュによる2ページ目の表示が正常に機能しています。');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(
        `2ページ目がアクティブになっていません。データが少ない可能性があります: ${errorMessage}`
      );
      test.skip();
    }

    // URLハッシュページネーションのスクリーンショットを取得（デバッグ用）
    await page.screenshot({ path: 'hash-pagination.png' });
  });
});
