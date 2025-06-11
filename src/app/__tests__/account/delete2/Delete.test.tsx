import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteAccount from '@/app/components/mypage2/delete2/Delete';
import { deleteAccountAction } from '@/app/components/mypage2/delete2/actions';
import { useRouter } from 'next/navigation';

// モックの設定
jest.mock('@/app/components/mypage2/delete2/actions', () => ({
  deleteAccountAction: jest.fn(),
}));

// useRouterのモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// window.confirmのモック
global.confirm = jest.fn();

// テストスイートの開始
describe('DeleteAccount', () => {
  // 各テスト前の準備
  beforeEach(() => {
    jest.clearAllMocks();

    // useRouterのモックを設定
    const mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // window.confirmのデフォルト戻り値
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  it('正常系：削除ボタンが表示される', () => {
    render(<DeleteAccount />);

    // 削除ボタンが存在することを確認
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除する/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('正常系：確認ダイアログでキャンセルした場合、削除処理が実行されない', async () => {
    // 確認ダイアログでキャンセルを選択
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(<DeleteAccount />);

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除する/i });
    fireEvent.click(deleteButton);

    // 削除アクションが呼ばれていないことを確認
    expect(deleteAccountAction).not.toHaveBeenCalled();
  });

  it('正常系：確認後に削除成功した場合、サインインページにリダイレクト', async () => {
    // 削除成功のレスポンスをモック
    (deleteAccountAction as jest.Mock).mockResolvedValue({
      success: true,
    });

    render(<DeleteAccount />);

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除する/i });
    fireEvent.click(deleteButton);

    // アクションが呼ばれたことを確認
    expect(deleteAccountAction).toHaveBeenCalled();

    // リダイレクトが実行されることを確認
    await waitFor(() => {
      expect(useRouter().push).toHaveBeenCalledWith('/signin2');
    });
  });

  it('異常系：削除処理中にエラーが発生した場合、エラーメッセージが表示される', async () => {
    // エラーレスポンスをモック
    (deleteAccountAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ['アカウントの削除に失敗しました。'],
    });

    render(<DeleteAccount />);

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除する/i });
    fireEvent.click(deleteButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('アカウントの削除に失敗しました。')).toBeInTheDocument();
    });

    // リダイレクトが実行されないことを確認
    expect(useRouter().push).not.toHaveBeenCalled();
  });

  it('異常系：例外が発生した場合、一般的なエラーメッセージが表示される', async () => {
    // 例外をスローするようにモック
    (deleteAccountAction as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<DeleteAccount />);

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除する/i });
    fireEvent.click(deleteButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('削除処理中にエラーが発生しました')).toBeInTheDocument();
    });
  });

  it('正常系：削除中は削除ボタンが無効化され、テキストが変わる', async () => {
    // 非同期処理中の状態をシミュレート
    (deleteAccountAction as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<DeleteAccount />);

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除する/i });
    fireEvent.click(deleteButton);

    // ボタンのテキストが変わり、ボタンが無効化されることを確認
    const loadingButton = screen.getByRole('button', { name: /アカウント削除中/i });
    expect(loadingButton).toBeInTheDocument();
    expect(loadingButton).toBeDisabled();
  });
});
