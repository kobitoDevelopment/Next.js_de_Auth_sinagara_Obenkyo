import { signOut } from '@/app/components/mypage2/signout2/actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// モックの設定
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// リダイレクト用のモック
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Cookieストア用モック
const mockCookieStore = {
  set: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};

describe('signOut Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Cookieモックのセットアップ
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);
  });

  it('正常系：クッキーを削除し、サインインページにリダイレクトする', async () => {
    // アクションを実行
    await signOut();

    // クッキーが正しく設定されたことを確認
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'user_id',
        value: '',
        path: '/',
        expires: expect.any(Date),
        httpOnly: true,
        sameSite: 'lax',
      })
    );

    // 期限切れの日付が過去であることを確認
    const cookieOptions = mockCookieStore.set.mock.calls[0][0];
    expect(cookieOptions.expires.getTime()).toBe(new Date(0).getTime());

    // リダイレクトが正しく呼ばれたことを確認
    expect(redirect).toHaveBeenCalledWith('/signin2');
  });

  it('開発環境では secure フラグが false に設定される', async () => {
    // 開発環境を模擬
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });

    // アクションを実行
    await signOut();

    // secure フラグが false であることを確認
    const cookieOptions = mockCookieStore.set.mock.calls[0][0];
    expect(cookieOptions.secure).toBe(false);

    // 環境変数の復元
    jest.restoreAllMocks();
  });

  it('本番環境では secure フラグが true に設定される', async () => {
    // 本番環境を模擬
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });

    // アクションを実行
    await signOut();

    // secure フラグが true であることを確認
    const cookieOptions = mockCookieStore.set.mock.calls[0][0];
    expect(cookieOptions.secure).toBe(true);

    // 環境変数の復元
    jest.restoreAllMocks();
  });

  it('redirect 関数にエラーが発生した場合でもクッキーは削除される', async () => {
    // redirect でエラーを発生させる
    jest.mocked(redirect).mockImplementation(() => {
      throw new Error('Redirect error');
    });

    try {
      // アクションを実行
      await signOut();
      // エラーが発生すべき
      expect(true).toBe(false);
    } catch (error) {
      // エラーが発生しても、クッキーが設定されていることを確認
      expect(mockCookieStore.set).toHaveBeenCalled();
      expect((error as Error).message).toBe('Redirect error');
    }
  });

  it('cookies 関数にエラーが発生した場合は例外が投げられる', async () => {
    // cookies でエラーを発生させる
    (cookies as jest.Mock).mockImplementation(() => {
      throw new Error('Cookie store error');
    });

    try {
      // アクションを実行
      await signOut();
      // エラーが発生すべき
      expect(true).toBe(false);
    } catch (error) {
      // エラーメッセージを確認
      expect((error as Error).message).toBe('Cookie store error');
      // リダイレクトは呼ばれない
      expect(redirect).not.toHaveBeenCalled();
    }
  });
});
