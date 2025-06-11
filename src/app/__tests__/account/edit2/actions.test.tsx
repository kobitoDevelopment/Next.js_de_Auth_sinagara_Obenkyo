import { updateProfile } from '@/app/components/mypage2/edit2/actions';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Supabaseクライアントのモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// bcryptのモック
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// next/headersのcookiesモック
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Supabaseクエリチェーン用のモック
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockNeq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateEq = jest.fn();

// fromメソッドのモック
const mockFrom = jest.fn(() => {
  return {
    select: mockSelect,
    update: mockUpdate,
  };
});

const mockSupabase = { from: mockFrom };

// FormDataのユーティリティ
function makeFormData(data: { [k: string]: string }) {
  return {
    get: (key: string) => data[key] ?? null,
  } as unknown as FormData;
}

describe('updateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Supabaseクライアントのモック
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // クエリチェーンのモック
    mockSelect.mockReturnValue({ eq: mockEq, neq: mockNeq });
    mockEq.mockImplementation(() => ({
      neq: mockNeq,
      single: mockSingle,
    }));
    mockNeq.mockImplementation(() => ({
      single: mockSingle,
    }));
    mockUpdate.mockImplementation(() => ({
      eq: mockUpdateEq,
    }));

    // デフォルトの成功レスポンス
    mockUpdateEq.mockResolvedValue({ error: null });

    // デフォルトのCookieモック（ログイン済み）
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn(() => ({ value: 'user-id-1' })),
      set: jest.fn(),
    });
  });

  // 正常系テスト

  it('正常系：ユーザー名とメールの更新のみ', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    // 重複チェックなしのモック
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null }) // メール重複チェック
      .mockResolvedValueOnce({ data: [], error: null }); // ユーザー名重複チェック

    const formData = makeFormData({
      username: 'newname',
      email: 'new@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    // 更新に必要なメソッドが呼ばれたことを確認
    expect(mockUpdate).toHaveBeenCalledWith({
      username: 'newname',
      email: 'new@example.com',
    });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-id-1');

    // エラーがないことを確認
    expect(result).toBeUndefined();
  });

  it('正常系：パスワード変更あり', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    // 重複チェックなしのモック
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null }) // メール重複チェック
      .mockResolvedValueOnce({ data: [], error: null }); // ユーザー名重複チェック

    // パスワード検証成功のモック
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // 新パスワードハッシュ化のモック
    (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpass');

    const formData = makeFormData({
      username: 'newname',
      email: 'new@example.com',
      current_password: 'oldpass',
      new_password: 'newpass123',
    });

    const result = await updateProfile(formData);

    // パスワード検証が呼ばれたことを確認
    expect(bcrypt.compare).toHaveBeenCalledWith('oldpass', 'hashedpass');

    // 新パスワードのハッシュ化が呼ばれたことを確認
    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);

    // 更新に必要なメソッドが呼ばれたことを確認（パスワードを含む）
    expect(mockUpdate).toHaveBeenCalledWith({
      username: 'newname',
      email: 'new@example.com',
      password: 'newhashedpass',
    });

    // エラーがないことを確認
    expect(result).toBeUndefined();
  });

  // 異常系テスト

  it('バリデーションエラー：必須項目とフォーマット', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    const formData = makeFormData({
      username: '',
      email: 'invalid-email',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    // エラーが含まれていることを確認
    expect(result?.errors).toContainEqual('ユーザー名は必須です');
    expect(result?.errors).toContainEqual('有効なメールアドレスを入力してください');

    // 更新メソッドが呼ばれていないことを確認
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('バリデーションエラー：パスワード長', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    const formData = makeFormData({
      username: 'newname',
      email: 'new@example.com',
      current_password: 'oldpass',
      new_password: '123', // 6文字未満
    });

    const result = await updateProfile(formData);

    // パスワード長エラーがあることを確認
    expect(result?.errors).toContainEqual('パスワードは6文字以上で入力してください');

    // 更新メソッドが呼ばれていないことを確認
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('重複エラー：メールアドレス', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    // メールアドレス重複エラーのモック
    mockNeq
      .mockResolvedValueOnce({ data: [{ id: 'other-user' }], error: null }) // メール重複あり
      .mockResolvedValueOnce({ data: [], error: null }); // ユーザー名重複なし

    const formData = makeFormData({
      username: 'newname',
      email: 'duplicate@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    // メール重複エラーがあることを確認
    expect(result?.errors).toContainEqual('このメールアドレスは既に登録されています');

    // 更新メソッドが呼ばれていないことを確認
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('重複エラー：ユーザー名', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    // ユーザー名重複エラーのモック
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null }) // メール重複なし
      .mockResolvedValueOnce({ data: [{ id: 'other-user' }], error: null }); // ユーザー名重複あり

    const formData = makeFormData({
      username: 'duplicatename',
      email: 'new@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    // ユーザー名重複エラーがあることを確認
    expect(result?.errors).toContainEqual('このユーザー名は既に登録されています');

    // 更新メソッドが呼ばれていないことを確認
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('パスワードエラー：現在のパスワード未入力', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    // 重複チェックなしのモック
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const formData = makeFormData({
      username: 'newname',
      email: 'new@example.com',
      current_password: '', // 現在のパスワード未入力
      new_password: 'newpass123', // 新パスワードあり
    });

    const result = await updateProfile(formData);

    // 現在のパスワード必須エラーがあることを確認
    expect(result?.errors).toContainEqual('現在のパスワードを入力してください');

    // 更新メソッドが呼ばれていないことを確認
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('パスワードエラー：現在のパスワード不一致', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    // 重複チェックなしのモック
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    // パスワード検証失敗のモック
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const formData = makeFormData({
      username: 'newname',
      email: 'new@example.com',
      current_password: 'wrongpass', // 間違ったパスワード
      new_password: 'newpass123',
    });

    const result = await updateProfile(formData);

    // パスワード不一致エラーがあることを確認
    expect(result?.errors).toContainEqual('現在のパスワードが正しくありません');

    // 更新メソッドが呼ばれていないことを確認
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('データベースエラー：更新エラー', async () => {
    // ユーザー取得成功のモック
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        username: 'oldname',
        email: 'old@example.com',
        password: 'hashedpass',
      },
      error: null,
    });

    // 重複チェックなしのモック
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    // 更新エラーのモック
    mockUpdateEq.mockResolvedValue({
      error: { details: 'データベース接続エラー', message: '更新に失敗しました' },
    });

    const formData = makeFormData({
      username: 'newname',
      email: 'new@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    // データベースエラーがあることを確認
    expect(result?.errors).toContainEqual('データベース接続エラー');

    // 更新メソッドが呼ばれたことを確認（エラーは戻り値で返る）
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('未ログインエラー：ユーザーIDがない', async () => {
    // 未ログイン状態のモック
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn(() => undefined), // cookie取得失敗
      set: jest.fn(),
    });

    const formData = makeFormData({
      username: 'newname',
      email: 'new@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    // ログインエラーがあることを確認
    expect(result?.errors).toContainEqual('ログイン情報が取得できませんでした');

    // 更新メソッドが呼ばれていないことを確認
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('型エラー：フォーム値がstring以外', async () => {
    // 型エラーを発生させるフォームデータ
    const formData = {
      get: (key: string) => {
        if (key === 'username') {
          return 123; // 数値を返して型エラーを発生させる
        } else if (key === 'email') {
          return 'mail@example.com';
        } else if (key === 'current_password' || key === 'new_password') {
          return '';
        } else {
          return null;
        }
      },
    } as unknown as FormData;

    const result = await updateProfile(formData);

    // 型エラーがあることを確認
    expect(result?.errors).toContainEqual('フォームの入力が不正です');

    // 更新メソッドが呼ばれていないことを確認
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
