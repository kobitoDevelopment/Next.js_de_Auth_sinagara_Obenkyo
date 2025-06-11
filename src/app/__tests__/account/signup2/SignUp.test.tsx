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
    expect(screen.getByLabelText(/プライバシーポリシー.*に同意します/i)).toBeInTheDocument();
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

    // プライバシーポリシーに同意
    fireEvent.click(screen.getByLabelText(/プライバシーポリシー.*に同意します/i));

    // HTML5検証を回避するためのモック
    jest.spyOn(HTMLFormElement.prototype, 'checkValidity').mockImplementation(() => true);

    // フォーム送信
    const form = screen.getByRole('button', { name: /登録/i }).closest('form');
    if (form) fireEvent.submit(form);

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

    // HTML5検証を回避するためのモック
    jest.spyOn(HTMLFormElement.prototype, 'checkValidity').mockImplementation(() => true);

    // フォーム送信
    const form = screen.getByRole('button', { name: /登録/i }).closest('form');
    if (form) fireEvent.submit(form);

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

  // 新しいテストケース: プライバシーポリシーのチェックボックス
  it('正常系：プライバシーポリシーのチェックボックスをチェックできる', () => {
    render(<SignUp2Form />);

    // チェックボックスを取得
    const checkbox = screen.getByLabelText(
      /プライバシーポリシー.*に同意します/i
    ) as HTMLInputElement;

    // 初期状態は未チェック
    expect(checkbox.checked).toBe(false);

    // チェックする
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    // チェックを外す
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('異常系：プライバシーポリシーに同意しない場合はエラーが表示される', async () => {
    // プライバシーポリシー未同意のエラーを返すようにモック
    (registerUserAction as jest.Mock).mockImplementation(async () => {
      return { errors: ['プライバシーポリシーへの同意が必要です'] };
    });

    const { rerender } = render(<SignUp2Form />);

    // 全フィールドに値を入力するが、プライバシーポリシーには同意しない
    fireEvent.change(screen.getByLabelText(/ユーザー名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/メールアドレス/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/パスワード/i), { target: { value: 'password123' } });

    // HTML5検証を回避するためのモック
    jest.spyOn(HTMLFormElement.prototype, 'checkValidity').mockImplementation(() => true);

    // フォーム送信
    const form = screen.getByRole('button', { name: /登録/i }).closest('form');
    if (form) fireEvent.submit(form);

    // React.useActionStateの状態更新をシミュレート
    jest.spyOn(React, 'useActionState').mockImplementation(() => {
      return [
        { errors: ['プライバシーポリシーへの同意が必要です'] },
        jest.fn() as (payload: unknown) => void,
        false,
      ];
    });

    // 再レンダリング
    rerender(<SignUp2Form />);

    // エラーメッセージが表示されることを確認
    expect(screen.getByText('プライバシーポリシーへの同意が必要です')).toBeInTheDocument();
  });
});
