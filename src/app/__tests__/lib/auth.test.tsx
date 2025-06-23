import { getCurrentUser, User } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// モジュールのモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// 環境変数のモック
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

describe('認証ユーティリティ', () => {
  // テスト用データ
  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
  };

  // モックオブジェクト
  const mockCookieStore = {
    get: jest.fn(),
  };

  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();
  const mockFrom = jest.fn(() => ({
    select: mockSelect,
  }));
  const mockSupabase = { from: mockFrom };

  beforeEach(() => {
    jest.clearAllMocks();

    // Cookieモックのセットアップ
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    // Supabaseモックのセットアップ
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  it('正常系：ログイン中のユーザー情報を取得できる', async () => {
    // ユーザーIDがCookieに存在する場合
    mockCookieStore.get.mockReturnValue({ value: 'user-123' });
    mockSingle.mockResolvedValue({ data: mockUser, error: null });

    const user = await getCurrentUser();

    // Cookieの確認
    expect(mockCookieStore.get).toHaveBeenCalledWith('user_id');

    // Supabaseクライアントの作成確認
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'mock-anon-key');

    // データ取得の確認
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');

    // 返値の確認
    expect(user).toEqual(mockUser);
  });

  it('異常系：Cookieにユーザーが存在しない場合はnullを返す', async () => {
    // Cookieが存在しない場合
    mockCookieStore.get.mockReturnValue(undefined);

    const user = await getCurrentUser();

    expect(user).toBeNull();
    // Supabaseクエリが実行されないことを確認
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('異常系：ユーザーデータ取得でエラーが発生した場合はnullを返す', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'user-123' });
    // データ取得エラーをシミュレート
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const user = await getCurrentUser();

    expect(user).toBeNull();
  });

  it('異常系：ユーザーデータが見つからない場合はnullを返す', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'user-123' });
    // データが存在しない場合
    mockSingle.mockResolvedValue({ data: null, error: null });

    const user = await getCurrentUser();

    expect(user).toBeNull();
  });
});
