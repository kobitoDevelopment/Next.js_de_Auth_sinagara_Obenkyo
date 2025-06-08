import { updateProfile } from '@/app/components/mypage2/edit2/actions';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// --- 外部依存のモック ---
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// --- Supabaseクエリチェーン用のモック ---
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockNeq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateEq = jest.fn();

const mockFrom = jest.fn(() => {
  return {
    select: mockSelect,
    update: mockUpdate,
  };
});
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockReturnValue(mockSupabase);
  mockSelect.mockReturnValue({ eq: mockEq, neq: mockNeq });
  // eq/neqチェーンの戻り値にsingleを追加
  mockEq.mockImplementation(() => ({
    neq: mockNeq,
    single: mockSingle,
  }));
  mockNeq.mockImplementation(() => ({
    single: mockSingle,
  }));
  // update()の戻り値にeqを追加
  mockUpdate.mockImplementation(() => ({
    eq: mockUpdateEq,
  }));
  // update().eq()の戻り値
  mockUpdateEq.mockResolvedValue({ error: null });

  (cookies as jest.Mock).mockReturnValue({
    get: jest.fn(() => ({ value: 'user-id-1' })),
    set: jest.fn(),
  });
});

function makeFormData(data: { [k: string]: string }) {
  return {
    get: (key: string) => data[key] ?? null,
  } as unknown as FormData;
}

describe('updateProfile', () => {
  it('正常系：ユーザー名・メール更新のみ', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-id-1', password: 'hashedpass' },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockUpdateEq.mockResolvedValue({ error: null });

    const formData = makeFormData({
      username: 'newname',
      email: 'newmail@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      username: 'newname',
      email: 'newmail@example.com',
    });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-id-1');
  });

  it('正常系：パスワード変更あり', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-id-1', password: 'hashedpass' },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpass');
    mockUpdateEq.mockResolvedValue({ error: null });

    const formData = makeFormData({
      username: 'newname',
      email: 'newmail@example.com',
      current_password: 'oldpass',
      new_password: 'newpass123',
    });

    const result = await updateProfile(formData);
    expect(bcrypt.compare).toHaveBeenCalledWith('oldpass', 'hashedpass');
    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    expect(mockUpdate).toHaveBeenCalledWith({
      username: 'newname',
      email: 'newmail@example.com',
      password: 'newhashedpass',
    });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-id-1');
    expect(result).toBeUndefined();
  });

  it('バリデーションエラーが複数返る（ユーザー名必須・メール形式・パスワード長）', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-id-1', password: 'hashedpass' },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const formData = makeFormData({
      username: '',
      email: 'badmail',
      current_password: '',
      new_password: '123',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(
      expect.arrayContaining([
        'ユーザー名は必須です',
        '有効なメールアドレスを入力してください',
        'パスワードは6文字以上で入力してください',
      ])
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('メールアドレス・ユーザー名・パスワード長がすべて重複・エラーの場合', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-id-1', password: 'hashedpass' },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [{ id: 'other-user' }], error: null })
      .mockResolvedValueOnce({ data: [{ id: 'other-user2' }], error: null });

    const formData = makeFormData({
      username: 'dupname',
      email: 'dup@example.com',
      current_password: '',
      new_password: '123',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(
      expect.arrayContaining([
        'このメールアドレスは既に登録されています',
        'このユーザー名は既に登録されています',
        'パスワードは6文字以上で入力してください',
      ])
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ログイン情報が取得できない場合、エラー', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn(() => undefined),
      set: jest.fn(),
    });
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const formData = makeFormData({
      username: 'username',
      email: 'mail@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(expect.arrayContaining(['ログイン情報が取得できませんでした']));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ユーザーが見つからない場合、エラー', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const formData = makeFormData({
      username: 'username',
      email: 'mail@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(expect.arrayContaining(['ユーザーが見つかりません']));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('新パスワード入力時に現在のパスワード未入力ならエラー', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-id-1',
        password: 'hashedpass',
        username: 'username',
        email: 'mail@example.com',
      },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const formData = makeFormData({
      username: 'username',
      email: 'mail@example.com',
      current_password: '',
      new_password: 'newpass123',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(expect.arrayContaining(['現在のパスワードを入力してください']));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('現在のパスワードが不一致ならエラー', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-id-1', password: 'hashedpass' },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const formData = makeFormData({
      username: 'username',
      email: 'mail@example.com',
      current_password: 'wrongpass',
      new_password: 'newpass123',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(expect.arrayContaining(['現在のパスワードが正しくありません']));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('更新失敗時はエラーが返る（Supabase error.details）', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-id-1', password: 'hashedpass' },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockUpdateEq.mockResolvedValue({
      error: { details: 'ユニーク制約エラー', message: '' },
    });

    const formData = makeFormData({
      username: 'username',
      email: 'mail@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(expect.arrayContaining(['ユニーク制約エラー']));
  });

  it('更新失敗時はエラーが返る（Supabase error.message）', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-id-1', password: 'hashedpass' },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockUpdateEq.mockResolvedValue({
      error: { details: '', message: '更新できませんでした' },
    });

    const formData = makeFormData({
      username: 'username',
      email: 'mail@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(expect.arrayContaining(['更新できませんでした']));
  });

  it('更新失敗時はエラーが返る（汎用エラー）', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-id-1', password: 'hashedpass' },
      error: null,
    });
    mockNeq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockUpdateEq.mockResolvedValue({
      error: {},
    });

    const formData = makeFormData({
      username: 'username',
      email: 'mail@example.com',
      current_password: '',
      new_password: '',
    });

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(expect.arrayContaining(['ユーザー情報の更新に失敗しました']));
  });

  it('型エラー: フォーム値がstring以外の場合、フォームの入力が不正です', async () => {
    const formData = {
      get: (key: string) =>
        key === 'username'
          ? 123
          : key === 'email'
            ? 'mail@example.com'
            : key === 'current_password'
              ? ''
              : key === 'new_password'
                ? ''
                : null,
    } as unknown as FormData;

    const result = await updateProfile(formData);

    expect(result?.errors).toEqual(expect.arrayContaining(['フォームの入力が不正です']));
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
