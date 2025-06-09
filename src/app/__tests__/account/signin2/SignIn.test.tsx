import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignIn2Form from '@/app/components/signin2/SignIn';
import { signInAction } from '@/app/components/signin2/actions';

// signInActionのモック
jest.mock('@/app/components/signin2/actions', () => ({
  signInAction: jest.fn(),
}));

// React.useActionStateのモック
interface FormState {
  errors?: string[];
}

jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useActionState: jest.fn((action, initialState) => {
      const wrappedAction = async (prevState: FormState, formData: FormData) => {
        return action(prevState, formData);
      };
      return [initialState, wrappedAction, false];
    }),
  };
});

describe('SignIn2Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでエラーなしの状態をモック
    (signInAction as jest.Mock).mockImplementation(async () => {
      return { errors: undefined };
    });
  });

  it('正常系：フォーム要素が正しく表示される', () => {
    render(<SignIn2Form />);

    // 見出しの確認
    expect(screen.getByRole('heading', { name: /サインイン/i })).toBeInTheDocument();

    // 入力フィールドの確認
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();

    // ボタンの確認
    expect(screen.getByRole('button', { name: /サインイン/i })).toBeInTheDocument();
  });

  it('正常系：フォームに入力して送信するとアクションが呼ばれる', async () => {
    render(<SignIn2Form />);

    // フォームに値を入力
    fireEvent.change(screen.getByLabelText(/メールアドレス/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/パスワード/i), {
      target: { value: 'password123' },
    });

    // フォーム送信
    fireEvent.click(screen.getByRole('button', { name: /サインイン/i }));

    // アクションが呼ばれたことを確認
    await waitFor(() => {
      expect(signInAction).toHaveBeenCalled();
    });
  });

  it('異常系：エラーがある場合にエラーメッセージが表示される', async () => {
    // エラーを返すようにモック
    (signInAction as jest.Mock).mockImplementation(async () => {
      return { errors: ['ユーザーが見つかりません', 'パスワードが正しくありません'] };
    });

    const { rerender } = render(<SignIn2Form />);

    // フォーム送信前はエラーなし
    expect(screen.queryByText('ユーザーが見つかりません')).not.toBeInTheDocument();

    // フォーム送信
    fireEvent.click(screen.getByRole('button', { name: /サインイン/i }));

    // React.useActionStateの状態更新をシミュレート
    jest.spyOn(React, 'useActionState').mockImplementation(() => {
      return [
        { errors: ['ユーザーが見つかりません', 'パスワードが正しくありません'] },
        jest.fn() as (payload: unknown) => void,
        false,
      ];
    });

    // 再レンダリング
    rerender(<SignIn2Form />);

    // エラーメッセージが表示されることを確認
    expect(screen.getByText('ユーザーが見つかりません')).toBeInTheDocument();
    expect(screen.getByText('パスワードが正しくありません')).toBeInTheDocument();
  });

  it('正常系：入力フィールドに値を入力できる', () => {
    render(<SignIn2Form />);

    // メールアドレスフィールド
    const emailInput = screen.getByLabelText(/メールアドレス/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');

    // パスワードフィールド
    const passwordInput = screen.getByLabelText(/パスワード/i) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  it('正常系：フォームの必須属性が設定されている', () => {
    render(<SignIn2Form />);

    // 必須属性の確認
    const emailInput = screen.getByLabelText(/メールアドレス/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/パスワード/i) as HTMLInputElement;

    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('正常系：入力タイプが正しく設定されている', () => {
    render(<SignIn2Form />);

    // 入力タイプの確認
    const emailInput = screen.getByLabelText(/メールアドレス/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/パスワード/i) as HTMLInputElement;

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
