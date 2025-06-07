import { signIn } from '@/app/signin2/actions';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ---- Jestによる外部依存のモック ----

// Supabaseクライアントをモック化（サーバー通信を完全に遮断し、テスト用に動作を制御）
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));
// パスワード比較関数のモック
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));
// Cookie操作のモック
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
// リダイレクト関数のモック
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// ---- Supabaseクエリチェーンのためのモック関数群 ----
const mockFrom = jest.fn(); // supabase.from("users")
const mockSelect = jest.fn(); // .select("*")
const mockEq = jest.fn(); // .eq("email", xxx)
const mockSingle = jest.fn(); // .single()

// supabaseクライアントの戻り値として利用
const mockSupabase = { from: mockFrom };

// 各テスト前にモックの状態を初期化
beforeEach(() => {
  jest.clearAllMocks();
  // createClient()が呼ばれたらmockSupabaseを返す
  (createClient as jest.Mock).mockReturnValue(mockSupabase);

  // クエリチェーンを再現
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });

  // cookies()の戻り値も毎回setが呼べるように
  (cookies as jest.Mock).mockReturnValue({
    set: jest.fn(),
  });
});

// フォームデータを模擬的に作成するユーティリティ
function makeFormData(data: { [k: string]: string }) {
  return {
    get: (key: string) => data[key] ?? null,
  } as unknown as FormData;
}

// ---- サインイン処理のテスト ----
describe('signIn', () => {
  it('正常なサインイン処理が成功する', async () => {
    // DBからユーザーが正常に取得されるようモック
    mockSingle.mockResolvedValue({
      data: { id: 'user1', email: 'test@example.com', password: 'hashed' },
      error: null,
    });
    // パスワード比較も成功させる
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // 正常なフォームデータ
    const formData = makeFormData({
      email: 'test@example.com',
      password: 'secret123',
    });

    const result = await signIn(formData);

    // DB問い合わせが正しく行われる
    expect(mockFrom).toHaveBeenCalledWith('users');
    // サインイン成功でリダイレクトされる
    expect(redirect).toHaveBeenCalledWith('/mypage2');
    // 正常終了はundefined（エラーなし）
    expect(result).toBeUndefined();
    // Cookieが正しくセットされる
    expect((cookies as jest.Mock)().set).toHaveBeenCalledWith(
      'user_id',
      'user1',
      expect.any(Object)
    );
  });

  it('フォームの入力が不正の場合はエラーが返る', async () => {
    // パスワードが空（不正）
    const formData = makeFormData({
      email: 'test@example.com',
      password: '',
    });

    const result = await signIn(formData);

    // パスワード長バリデーションエラーを返す
    expect(result).toEqual({
      errors: ['パスワードは6文字以上で入力してください'],
    });
    // DBアクセスは発生しない
    expect(mockFrom).not.toHaveBeenCalled();
    // リダイレクトも発生しない
    expect(redirect).not.toHaveBeenCalled();
  });

  it('バリデーションエラーが複数返る（メール形式・パスワード長）', async () => {
    // メール形式もパスワード長も不正
    const formData = makeFormData({
      email: 'badmail',
      password: '1',
    });

    const result = await signIn(formData);

    // 複数のバリデーションエラーが配列で返る
    expect(result).toEqual({
      errors: expect.arrayContaining([
        '有効なメールアドレスを入力してください',
        'パスワードは6文字以上で入力してください',
      ]),
    });
    // バリデーション後もDBアクセスは実施（仕様による）
    expect(mockFrom).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('ユーザーが見つからない場合はエラーが返る', async () => {
    // DBに該当ユーザーがいないケース
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const formData = makeFormData({
      email: 'notfound@example.com',
      password: 'secret123',
    });

    const result = await signIn(formData);

    // 「ユーザーが見つかりません」エラー
    expect(result).toEqual({
      errors: ['ユーザーが見つかりません'],
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('パスワードが一致しない場合はエラーが返る', async () => {
    // ユーザーは存在するが、パスワード比較に失敗
    mockSingle.mockResolvedValue({
      data: { id: 'user2', email: 'test@example.com', password: 'hashed' },
      error: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const formData = makeFormData({
      email: 'test@example.com',
      password: 'wrongpass',
    });

    const result = await signIn(formData);

    // パスワード不一致エラー
    expect(result).toEqual({
      errors: ['パスワードが正しくありません'],
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('バリデーションエラーとDBエラーが両方返る（複数エラー）', async () => {
    // パスワード短い & メール存在しない（両方エラー）
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const formData = makeFormData({
      email: 'notfound@example.com',
      password: '1',
    });

    const result = await signIn(formData);

    // 両方のエラーが配列で返る
    expect(result).toEqual({
      errors: expect.arrayContaining([
        'パスワードは6文字以上で入力してください',
        'ユーザーが見つかりません',
      ]),
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
