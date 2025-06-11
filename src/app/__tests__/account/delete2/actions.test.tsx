import { deleteAccount } from '@/app/components/mypage2/delete2/actions';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Supabaseクライアントのモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Supabaseクエリチェーン用のモック
// deleteメソッドとeqメソッドのモック
const mockDelete = jest.fn();
const mockDeleteEq = jest.fn();

const mockFrom = jest.fn(() => {
  return {
    delete: mockDelete,
  };
});
const mockSupabase = { from: mockFrom };

// Cookieモック用変数
let mockCookieStore = {
  get: jest.fn(),
  delete: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();

  // Supabaseクライアントのモックをリセット
  (createClient as jest.Mock).mockReturnValue(mockSupabase);

  // deleteチェーンのモックをリセット
  mockDelete.mockImplementation(() => ({
    eq: mockDeleteEq,
  }));

  // 基本的に成功する応答を設定
  mockDeleteEq.mockResolvedValue({ error: null });

  // Cookieモックをリセット - デフォルトでuser-id-1を返す
  mockCookieStore = {
    get: jest.fn(() => ({ value: 'user-id-1' })),
    delete: jest.fn(),
  };
  (cookies as jest.Mock).mockReturnValue(mockCookieStore);
});

describe('deleteAccount', () => {
  // 正常系テスト
  it('正常系：アカウント削除が成功する', async () => {
    // 成功レスポンスを設定
    mockDeleteEq.mockResolvedValue({ error: null });

    // アカウント削除を実行
    const result = await deleteAccount();

    // 成功フラグがtrueになっていることを確認
    expect(result).toEqual({ success: true });

    // Supabaseが正しく呼ばれたか確認
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'user-id-1');

    // Cookieが削除されたか確認
    expect(mockCookieStore.delete).toHaveBeenCalledWith('user_id');
  });

  // 異常系テスト
  it('異常系：ユーザーIDがない（未ログイン）場合', async () => {
    // Cookieに値がない状態をモック
    mockCookieStore.get.mockReturnValue(undefined);

    // アカウント削除を実行
    const result = await deleteAccount();

    // エラーレスポンスを確認
    expect(result).toEqual({
      success: false,
      errors: ['ログインセッションが無効です。再度ログインしてください。'],
    });

    // Supabaseが呼ばれていないことを確認
    expect(mockDelete).not.toHaveBeenCalled();

    // Cookieが削除されていないことを確認
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
  });

  it('異常系：Cookieの値がnullの場合', async () => {
    // Cookieはあるがvalueがnullの状態
    mockCookieStore.get.mockReturnValue({ value: null });

    // アカウント削除を実行
    const result = await deleteAccount();

    // エラーレスポンスを確認
    expect(result).toEqual({
      success: false,
      errors: ['ログインセッションが無効です。再度ログインしてください。'],
    });
  });

  it('異常系：Supabase削除操作でエラーが発生した場合', async () => {
    // Supabaseがエラーを返す状態をモック
    mockDeleteEq.mockResolvedValue({
      error: { message: 'Database error', details: 'Constraint violation' },
    });

    // アカウント削除を実行
    const result = await deleteAccount();

    // エラーレスポンスを確認
    expect(result).toEqual({
      success: false,
      errors: ['アカウントの削除に失敗しました。時間をおいて再度お試しください。'],
    });

    // Cookieが削除されていないことを確認
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
  });

  it('異常系：予期せぬエラー（例外）が発生した場合', async () => {
    // 例外をスローするようにモック
    mockDeleteEq.mockRejectedValue(new Error('Network error'));

    // アカウント削除を実行
    const result = await deleteAccount();

    // エラーレスポンスを確認
    expect(result).toEqual({
      success: false,
      errors: ['システムエラーが発生しました。管理者にお問い合わせください。'],
    });

    // Cookieが削除されていないことを確認
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
  });
});
