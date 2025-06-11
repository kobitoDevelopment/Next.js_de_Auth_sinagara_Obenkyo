import { registerUser } from '@/app/components/signup2/actions';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

// supabase-jsのモックを設定
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));
// bcryptjsのモックを設定
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));
// next/navigationのredirectメソッドをモック
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Supabaseのメソッドチェーン用モック
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockInsert = jest.fn();

const mockFrom = jest.fn((table: string) => {
  if (table === 'users') {
    return {
      select: mockSelect,
      insert: mockInsert,
    };
  }
  return {};
});

const mockSupabase = { from: mockFrom };

// 各テスト前にモックを初期化
beforeEach(() => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockReturnValue(mockSupabase);
  mockSelect.mockReturnValue({ eq: mockEq });
  mockInsert.mockReset();
  mockEq.mockReset();
});

// FormDataを疑似的に作るユーティリティ関数
function makeFormData(data: { [k: string]: string | number | null }) {
  return {
    get: (key: string) => data[key] ?? null,
  } as unknown as FormData;
}

// registerUser関数のテスト
describe('registerUser', () => {
  it('正常系：ユーザー登録成功時にリダイレクトされる', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    mockEq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockInsert.mockResolvedValue({ error: null });

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(mockInsert).toHaveBeenCalledWith([
      {
        username: 'kobito',
        email: 'test@example.com',
        role: 'user',
        password: 'hashedpass',
      },
    ]);
    expect(redirect).toHaveBeenCalledWith('/signin2');
    expect(result).toBeUndefined();
  });

  it('バリデーションエラーが全て返される', async () => {
    const formData = makeFormData({
      username: '',
      email: 'bademail',
      role: '',
      password: '1',
    });

    const result = await registerUser(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining([
        'ユーザー名は必須です',
        'メールアドレスの形式が正しくありません',
        'ロールは必須です',
        'パスワードは6文字以上で入力してください',
      ]),
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('メールアドレスが重複している場合、エラーが返る', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    mockEq
      .mockResolvedValueOnce({ data: [{ id: 1 }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    expect(result).toEqual({
      errors: ['このメールアドレスは既に登録されています'],
    });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('ユーザー名が重複している場合、エラーが返る', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    mockEq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [{ id: 2 }], error: null });

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    expect(result).toEqual({
      errors: ['このユーザー名は既に登録されています'],
    });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('メールアドレスもユーザー名も重複している場合、両方のエラーが返る', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    mockEq
      .mockResolvedValueOnce({ data: [{ id: 1 }], error: null })
      .mockResolvedValueOnce({ data: [{ id: 2 }], error: null });

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

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
    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'abc',
    });

    const result = await registerUser(formData);

    expect(result).toEqual({
      errors: expect.arrayContaining(['パスワードは6文字以上で入力してください']),
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('Supabase insertでエラーが返れば、その旨のエラーが返る', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    mockEq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockInsert.mockResolvedValue({ error: { message: 'fail' } });

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    const result = await registerUser(formData);

    expect(result).toEqual({
      errors: ['ユーザー登録に失敗しました'],
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  // 追加テストケース

  it('型エラー: フォーム値がstring以外の場合は処理を継続する', async () => {
    // データ型がおかしいフォームデータ（数値型）
    const formData = makeFormData({
      username: 123, // 数値を入れてみる
      email: 'test@example.com',
      role: 'user',
      password: 'password123',
    });

    // モックの準備
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    mockEq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockInsert.mockResolvedValue({ error: null });

    // 実行
    await registerUser(formData);

    // string化されて正常に処理されていることを確認
    expect(mockInsert).toHaveBeenCalledWith([
      {
        username: '123', // 文字列に変換されている
        email: 'test@example.com',
        role: 'user',
        password: 'hashedpass',
      },
    ]);
  });

  it('DB問い合わせでエラーが発生した場合（メール重複チェック時）', async () => {
    // DB問い合わせでエラー
    mockEq.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB接続エラー' },
    });
    mockEq.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    mockInsert.mockResolvedValue({ error: null });

    // ハッシュ化のモック
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    // 実行
    await registerUser(formData);

    // DBエラーでもvalidationは行われ、モックが設定されていればinsert処理は試みられる
    expect(mockInsert).toHaveBeenCalled();
  });

  it('bcrypt.hashでエラーが発生した場合は挿入処理は行われない', async () => {
    mockEq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    // ハッシュ化でエラー
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('ハッシュ化エラー'));

    const formData = makeFormData({
      username: 'kobito',
      email: 'test@example.com',
      role: 'user',
      password: 'secret123',
    });

    // 実行すると例外が発生（ハンドリングがなければ）
    try {
      await registerUser(formData);
      // 例外が発生しなかった場合はテスト失敗
      expect(true).toBe(false);
    } catch (error) {
      // 例外が発生することを確認
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('ハッシュ化エラー');
    }

    // 挿入処理は行われない
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('空のフォームデータが渡された場合でもクラッシュせずエラーを返す', async () => {
    // 全ての値がnull
    const formData = makeFormData({
      username: null,
      email: null,
      role: null,
      password: null,
    });

    const result = await registerUser(formData);

    // バリデーションエラーが返る
    expect(result).toEqual({
      errors: expect.arrayContaining([
        'ユーザー名は必須です',
        'メールアドレスの形式が正しくありません',
        'ロールは必須です',
        'パスワードは6文字以上で入力してください',
      ]),
    });
  });
});
