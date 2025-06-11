import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUp2Form from '@/app/components/signup2/SignUp';
import { registerUserAction } from '@/app/components/signup2/actions';

// actionsのモック
jest.mock('@/app/components/signup2/actions', () => ({
  registerUserAction: jest.fn(),
}));

// React.useActionStateのモック
type FormState = {
  errors?: string[];
};

jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useActionState: jest.fn((action, initialState) => {
      // actionをラップして、テスト中に呼び出しを確認できるようにする
      const wrappedAction = async (prevState: FormState, formData: FormData) => {
        return action(prevState, formData);
      };
      return [initialState, wrappedAction, false]; // 第3引数としてisPendingを追加
    }),
  };
});

describe('SignUp2Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // registerUserActionのデフォルト動作をリセット
    (registerUserAction as jest.Mock).mockImplementation(async () => {
      return { errors: undefined };
    });
  });

  it('正常系：すべての入力フィールドとボタンが表示される', () => {
    render(<SignUp2Form />);

    // フォーム要素の存在確認
    expect(screen.getByLabelText(/ユーザー名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ロール/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登録/i })).toBeInTheDocument();
  });

  it('正常系：フォーム送信時にregisterUserActionが呼ばれる', async () => {
    render(<SignUp2Form />);

    // フォームに値を入力
    fireEvent.change(screen.getByLabelText(/ユーザー名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/メールアドレス/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/パスワード/i), { target: { value: 'password123' } });

    // フォーム送信
    fireEvent.click(screen.getByRole('button', { name: /登録/i }));

    // アクションが呼ばれたことを確認
    await waitFor(() => {
      expect(registerUserAction).toHaveBeenCalled();
    });
  });

  it('異常系：エラーがある場合にエラーメッセージが表示される', async () => {
    // エラーを返すようにモック
    (registerUserAction as jest.Mock).mockImplementation(async () => {
      return { errors: ['ユーザー名は必須です', 'パスワードは6文字以上で入力してください'] };
    });

    const { rerender } = render(<SignUp2Form />);

    // フォーム送信前はエラーなし
    expect(screen.queryByText('ユーザー名は必須です')).not.toBeInTheDocument();

    // フォーム送信
    fireEvent.click(screen.getByRole('button', { name: /登録/i }));

    // React.useActionStateの状態更新をシミュレート（実際の実装では自動的に更新される）
    jest.spyOn(React, 'useActionState').mockImplementation(() => {
      return [
        { errors: ['ユーザー名は必須です', 'パスワードは6文字以上で入力してください'] },
        jest.fn() as (payload: unknown) => void,
        false, // isPendingフラグを追加
      ];
    });

    // 再レンダリング
    rerender(<SignUp2Form />);

    // エラーメッセージが表示されることを確認
    expect(screen.getByText('ユーザー名は必須です')).toBeInTheDocument();
    expect(screen.getByText('パスワードは6文字以上で入力してください')).toBeInTheDocument();
  });

  it('正常系：select要素で異なるロールを選択できる', () => {
    render(<SignUp2Form />);

    // ロール選択のselectを取得
    const roleSelect = screen.getByLabelText(/ロール/i) as HTMLSelectElement;

    // デフォルト値の確認
    expect(roleSelect.value).toBe('user');

    // adminに変更
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    expect(roleSelect.value).toBe('admin');
  });

  it('正常系：各入力フィールドに値を入力できる', () => {
    render(<SignUp2Form />);

    // ユーザー名フィールド
    const usernameInput = screen.getByLabelText(/ユーザー名/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(usernameInput.value).toBe('testuser');

    // メールアドレスフィールド
    const emailInput = screen.getByLabelText(/メールアドレス/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');

    // パスワードフィールド
    const passwordInput = screen.getByLabelText(/パスワード/i) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });
});
