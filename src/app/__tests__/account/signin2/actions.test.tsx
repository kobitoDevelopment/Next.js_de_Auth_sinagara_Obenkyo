import { signIn } from '@/app/components/signin2/actions';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// 外部依存のモック化
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Supabaseのクエリチェーン用モック
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
}));

const mockSupabase = { from: mockFrom };

// Cookieストア用モック
const mockCookieStore = {
  set: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};

// テスト用FormDataユーティリティ
function makeFormData(data: { [k: string]: string | number | null }) {
  return {
    get: (key: string) => data[key] ?? null,
  } as unknown as FormData;
}

describe('signIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Supabaseモックのセットアップ
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });

    // Cookieモックのセットアップ
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);
  });

  afterAll(() => {
    // 環境変数を元に戻す（必要に応じて）
    jest.resetModules();
  });

  it('正常系：有効な認証情報でサインイン成功', async () => {
    // テストユーザー
    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed-password',
    };

    // Supabaseレスポンスのモック
    mockSingle.mockResolvedValue({ data: testUser, error: null });

    // パスワード照合成功のモック
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // 有効なフォームデータ
    const formData = makeFormData({
      email: 'test@example.com',
      password: 'password123',
    });

    // 実行
    await signIn(formData);

    // 検証
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('email', 'test@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'user_id',
      'user-123',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      })
    );
    expect(redirect).toHaveBeenCalledWith('/mypage2');
  });

  it('異常系：不正なメールアドレス形式でエラー', async () => {
    const formData = makeFormData({
      email: 'invalid-email',
      password: 'password123',
    });

    const result = await signIn(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining(['有効なメールアドレスを入力してください']),
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：短すぎるパスワードでエラー', async () => {
    const formData = makeFormData({
      email: 'test@example.com',
      password: '12345',
    });

    const result = await signIn(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining(['パスワードは6文字以上で入力してください']),
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：ユーザーが見つからない場合のエラー', async () => {
    // ユーザーが見つからない場合のレスポンス
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const formData = makeFormData({
      email: 'unknown@example.com',
      password: 'password123',
    });

    const result = await signIn(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining(['ユーザーが見つかりません']),
    });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：パスワードが一致しない場合のエラー', async () => {
    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed-password',
    };

    mockSingle.mockResolvedValue({ data: testUser, error: null });
    // パスワード照合失敗のモック
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const formData = makeFormData({
      email: 'test@example.com',
      password: 'wrong-password',
    });

    const result = await signIn(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining(['パスワードが正しくありません']),
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    expect(mockCookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：フォームデータが不正な場合のエラー', async () => {
    // 型が不正なフォームデータ
    const formData = {
      get: (key: string) => {
        if (key === 'email') return 123; // 数値を返して型エラーを発生させる
        if (key === 'password') return 'password123';
        return null;
      },
    } as unknown as FormData;

    const result = await signIn(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining(['フォームの入力が不正です']),
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：複数のバリデーションエラーが発生する場合', async () => {
    const formData = makeFormData({
      email: 'invalid-email',
      password: '12345',
    });

    const result = await signIn(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining([
        '有効なメールアドレスを入力してください',
        'パスワードは6文字以上で入力してください',
      ]),
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：メールアドレスまたはパスワードが未入力の場合', async () => {
    const formData = makeFormData({
      email: '',
      password: '',
    });

    const result = await signIn(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining([
        '有効なメールアドレスを入力してください',
        'パスワードは6文字以上で入力してください',
      ]),
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：DBクエリでエラーが発生した場合', async () => {
    // DBクエリエラーのモック
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database connection error' },
    });

    const formData = makeFormData({
      email: 'test@example.com',
      password: 'password123',
    });

    const result = await signIn(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining(['ユーザーが見つかりません']),
    });
    expect(mockCookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：bcrypt.compareでエラーが発生した場合', async () => {
    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed-password',
    };

    mockSingle.mockResolvedValue({ data: testUser, error: null });
    // bcrypt.compareでエラーを投げる
    (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

    const formData = makeFormData({
      email: 'test@example.com',
      password: 'password123',
    });

    try {
      await signIn(formData);
      // エラーが発生しなかった場合はテスト失敗
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Bcrypt error');
    }

    expect(mockCookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：redirectがエラーを投げた場合', async () => {
    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed-password',
    };

    mockSingle.mockResolvedValue({ data: testUser, error: null });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // redirectモックをテスト内でリセット
    jest.mocked(redirect).mockImplementation(() => {
      throw new Error('Redirect error');
    });

    const formData = makeFormData({
      email: 'test@example.com',
      password: 'password123',
    });

    try {
      await signIn(formData);
      // エラーが発生しなかった場合はテスト失敗
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Redirect error');
    }

    // Cookieは設定されている
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  it('正常系：本番環境ではSecure Cookieが設定される', async () => {
    // テスト中のみモックモジュールのNODE_ENVを変更
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });

    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed-password',
    };

    mockSingle.mockResolvedValue({ data: testUser, error: null });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // redirectのリセット
    jest.mocked(redirect).mockImplementation(() => undefined as never);

    const formData = makeFormData({
      email: 'test@example.com',
      password: 'password123',
    });

    await signIn(formData);

    // secure: trueが設定されていることを確認
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'user_id',
      'user-123',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'lax',
      })
    );

    // モック環境変数を元に戻す
    jest.restoreAllMocks();
  });
});
