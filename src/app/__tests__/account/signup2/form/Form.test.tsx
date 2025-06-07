import { registerUser } from '@/app/signup2/actions';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

// --- 外部モジュールのモック定義 ---
// Supabaseクライアントをテスト用にモック化
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));
// パスワードハッシュ化関数もモック
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));
// redirect関数もモック
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// --- Supabaseのメソッドチェーン用モック ---
// select().eq()のチェーン、insert()用
const mockSelect = jest.fn(); // .select()
const mockEq = jest.fn(); // .eq()
const mockInsert = jest.fn(); // .insert()

// from()のテーブル分岐も再現（usersテーブル以外は空オブジェクト）
const mockFrom = jest.fn((table: string) => {
  if (table === 'users') {
    return {
      select: mockSelect,
      insert: mockInsert,
    };
  }
  return {};
});

// Supabaseクライアントの返り値
const mockSupabase = { from: mockFrom };

// --- 各テスト前にモックを初期化 ---
// これによりテスト間で状態が混ざらなくなる
beforeEach(() => {
  jest.clearAllMocks();
  // createClient呼び出し時にmockSupabaseを返す
  (createClient as jest.Mock).mockReturnValue(mockSupabase);
  // select().eq()チェーンのセットアップ
  mockSelect.mockReturnValue({ eq: mockEq });
  // insertやeqの呼び出し履歴もリセット
  mockInsert.mockReset();
  mockEq.mockReset();
});

// --- FormDataを疑似的に作るユーティリティ関数 ---
// オブジェクトの値をget()で取得できるようにする
function makeFormData(data: { [k: string]: string }) {
  return {
    get: (key: string) => data[key] ?? null,
  } as unknown as FormData;
}

// --- registerUser関数のテスト ---
// 各シナリオごとに個別のケースを検証
describe('registerUser', () => {
  it('正常なデータでユーザー登録しリダイレクトされる', async () => {
    // パスワードハッシュ化を正常値で返す
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    // メール・ユーザー名重複なし（DB検索も空配列で返す）
    mockEq
      .mockResolvedValueOnce({ data: [], error: null }) // email
      .mockResolvedValueOnce({ data: [], error: null }); // username
    // insert時もエラーなし
    mockInsert.mockResolvedValue({ error: null });

    // 正常なフォームデータ
    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    // パスワードハッシュ化が正しく呼ばれる
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    // insert時にハッシュ済みパスワードとともに呼ばれる
    expect(mockInsert).toHaveBeenCalledWith([
      {
        username: 'kobito',
        email: 'test@example.com',
        role: 'user',
        password: 'hashedpass',
      },
    ]);
    // 正常時はリダイレクトされる
    expect(redirect).toHaveBeenCalledWith('/signin2');
    // エラーなし
    expect(result).toBeUndefined();
  });

  it('バリデーションエラーが全て返される', async () => {
    // バリデーションNGのフォームデータ
    const formData = makeFormData({
      username: '', // 必須
      email: 'bademail', // 不正
      role: '',
      password: '1',
    });

    const result = await registerUser(formData);

    // すべてのバリデーションエラーが配列で返る
    expect(result).toEqual({
      errors: expect.arrayContaining([
        'ユーザー名は必須です',
        'メールアドレスの形式が正しくありません',
        'ロールは必須です',
        'パスワードは6文字以上で入力してください',
      ]),
    });
    // ハッシュ化もinsertもリダイレクトも呼ばれない
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('メールアドレスが重複している場合、エラーが返る', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    // emailだけ重複（DB検索で1件ヒット）
    mockEq
      .mockResolvedValueOnce({ data: [{ id: 1 }], error: null }) // email
      .mockResolvedValueOnce({ data: [], error: null }); // username

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    // メールアドレス重複エラーのみ返す
    expect(result).toEqual({
      errors: ['このメールアドレスは既に登録されています'],
    });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('ユーザー名が重複している場合、エラーが返る', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    // usernameだけ重複
    mockEq
      .mockResolvedValueOnce({ data: [], error: null }) // email
      .mockResolvedValueOnce({ data: [{ id: 2 }], error: null }); // username

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    // ユーザー名重複のエラーのみ返す
    expect(result).toEqual({
      errors: ['このユーザー名は既に登録されています'],
    });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('メールアドレスもユーザー名も重複している場合、両方のエラーが返る', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    // 両方重複
    mockEq
      .mockResolvedValueOnce({ data: [{ id: 1 }], error: null }) // email
      .mockResolvedValueOnce({ data: [{ id: 2 }], error: null }); // username

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    // 両方の重複エラーが配列で返る
    expect(result).toEqual({
      errors: expect.arrayContaining([
        'このメールアドレスは既に登録されています',
        'このユーザー名は既に登録されています',
      ]),
    });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('パスワードが短い場合、エラーが返る', async () => {
    // パスワード長不正
    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'abc',
    });

    const result = await registerUser(formData);

    // パスワード長エラーのみ返す
    expect(result).toEqual({
      errors: expect.arrayContaining(['パスワードは6文字以上で入力してください']),
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('Supabase insertでエラーが返れば、その旨のエラーが返る', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    // 重複なし
    mockEq
      .mockResolvedValueOnce({ data: [], error: null }) // email
      .mockResolvedValueOnce({ data: [], error: null }); // username
    // insertでエラー発生
    mockInsert.mockResolvedValue({ error: { message: 'fail' } });

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    // insert失敗時のエラー
    expect(result).toEqual({
      errors: ['ユーザー登録に失敗しました'],
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
