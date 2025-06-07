import { signOut } from '@/app/mypage2/actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// --- 外部依存のモック ---
// cookies()をモック化
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
// redirect()をモック化
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('signOut', () => {
  // setメソッドのモック
  const setMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // cookies()の戻り値としてsetメソッドを返す
    (cookies as jest.Mock).mockReturnValue({
      set: setMock,
    });
  });

  it('クッキーを削除しリダイレクトする', async () => {
    await signOut();

    // クッキー削除が正しく呼ばれているかを検証
    expect(setMock).toHaveBeenCalledWith({
      name: 'user_id',
      value: '',
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // サインインページへリダイレクトされているか
    expect(redirect).toHaveBeenCalledWith('/signin2');
  });
});
