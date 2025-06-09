import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditProfilePage from '@/app/components/mypage2/edit2/Edit';
import { updateProfileAction } from '@/app/components/mypage2/edit2/actions';

// アクションのモック
jest.mock('@/app/components/mypage2/edit2/actions', () => ({
  updateProfileAction: jest.fn(),
}));

// React.useActionStateのモック
interface EditState {
  errors?: string[];
}

jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useActionState: jest.fn((action, initialState) => {
      // actionをラップして、テスト中に呼び出しを確認できるようにする
      const wrappedAction = async (prevState: EditState, formData: FormData) => {
        return action(prevState, formData);
      };
      return [initialState, wrappedAction, false]; // 第3引数としてisPendingを追加
    }),
  };
});

describe('EditProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // updateProfileActionのデフォルト動作をリセット
    (updateProfileAction as jest.Mock).mockImplementation(async () => {
      return { errors: undefined };
    });
  });

  it('プロフィール編集フォームが正しく表示される', () => {
    render(<EditProfilePage />);

    // ヘッダーの確認
    expect(screen.getByRole('heading', { name: /プロフィール編集/i })).toBeInTheDocument();

    // 入力フィールドの確認
    expect(screen.getByLabelText(/ユーザー名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/現在のパスワード/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/新しいパスワード/i)).toBeInTheDocument();

    // 送信ボタンの確認
    expect(screen.getByRole('button', { name: /更新/i })).toBeInTheDocument();

    // 初期状態では成功メッセージもエラーメッセージも表示されない
    expect(screen.queryByText(/プロフィールを更新しました/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('フォーム送信時にupdateProfileActionが呼ばれる', async () => {
    render(<EditProfilePage />);

    // フォームに値を入力
    fireEvent.change(screen.getByLabelText(/ユーザー名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/メールアドレス/i), {
      target: { value: 'test@example.com' },
    });

    // フォーム送信
    fireEvent.click(screen.getByRole('button', { name: /更新/i }));

    // アクションが呼ばれたことを確認
    await waitFor(() => {
      expect(updateProfileAction).toHaveBeenCalled();
    });
  });

  it('エラーがある場合にエラーメッセージが表示される', async () => {
    // エラーを返すようにモック
    (updateProfileAction as jest.Mock).mockImplementation(async () => {
      return { errors: ['ユーザー名は必須です', 'メールアドレスの形式が正しくありません'] };
    });

    const { rerender } = render(<EditProfilePage />);

    // フォーム送信前はエラーメッセージなし
    expect(screen.queryByText('ユーザー名は必須です')).not.toBeInTheDocument();

    // フォーム送信
    fireEvent.click(screen.getByRole('button', { name: /更新/i }));

    // React.useActionStateの状態更新をシミュレート
    jest.spyOn(React, 'useActionState').mockImplementation(() => {
      return [
        { errors: ['ユーザー名は必須です', 'メールアドレスの形式が正しくありません'] },
        jest.fn() as (payload: unknown) => void,
        false,
      ];
    });

    // 再レンダリング
    rerender(<EditProfilePage />);

    // エラーメッセージが表示されることを確認
    expect(screen.getByText('ユーザー名は必須です')).toBeInTheDocument();
    expect(screen.getByText('メールアドレスの形式が正しくありません')).toBeInTheDocument();
  });

  it('更新成功時に成功メッセージが表示される', async () => {
    const { rerender } = render(<EditProfilePage />);

    // フォーム送信前は成功メッセージなし
    expect(screen.queryByText(/プロフィールを更新しました/i)).not.toBeInTheDocument();

    // フォーム送信
    fireEvent.click(screen.getByRole('button', { name: /更新/i }));

    // React.useActionStateの状態更新をシミュレート（成功状態）
    jest.spyOn(React, 'useActionState').mockImplementation(() => {
      return [
        {}, // エラーがないオブジェクト（initialStateとは異なる）
        jest.fn() as (payload: unknown) => void,
        false,
      ];
    });

    // 再レンダリング
    rerender(<EditProfilePage />);

    // 成功メッセージが表示されることを確認
    expect(screen.getByText(/プロフィールを更新しました/i)).toBeInTheDocument();
  });

  it('各入力フィールドに値を入力できる', () => {
    render(<EditProfilePage />);

    // ユーザー名
    const usernameInput = screen.getByLabelText(/ユーザー名/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(usernameInput.value).toBe('testuser');

    // メールアドレス
    const emailInput = screen.getByLabelText(/メールアドレス/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');

    // 現在のパスワード
    const currentPasswordInput = screen.getByLabelText(/現在のパスワード/i) as HTMLInputElement;
    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass' } });
    expect(currentPasswordInput.value).toBe('currentpass');

    // 新しいパスワード
    const newPasswordInput = screen.getByLabelText(/新しいパスワード/i) as HTMLInputElement;
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    expect(newPasswordInput.value).toBe('newpass123');
  });

  it('入力フィールドに適切な属性が設定されている', () => {
    render(<EditProfilePage />);

    // ユーザー名フィールド
    const usernameInput = screen.getByLabelText(/ユーザー名/i);
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(usernameInput).toHaveAttribute('required');

    // メールアドレスフィールド
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');

    // 現在のパスワードフィールド（任意）
    const currentPasswordInput = screen.getByLabelText(/現在のパスワード/i);
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
    expect(currentPasswordInput).not.toHaveAttribute('required');

    // 新しいパスワードフィールド（任意）
    const newPasswordInput = screen.getByLabelText(/新しいパスワード/i);
    expect(newPasswordInput).toHaveAttribute('type', 'password');
    expect(newPasswordInput).not.toHaveAttribute('required');
  });
});
