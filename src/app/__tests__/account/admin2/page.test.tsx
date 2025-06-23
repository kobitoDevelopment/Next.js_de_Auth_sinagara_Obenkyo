import { render } from '@testing-library/react';
import AdminPage from '@/app/admin2/page';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

// モジュールのモック
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Adminコンポーネントのモック
jest.mock('@/app/components/admin2/Admin', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-component">Admin Component</div>,
}));

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系：管理者ユーザーの場合はAdminコンポーネントを表示する', async () => {
    // 管理者ユーザーをモック
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 'admin-123',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
    });

    const Component = await AdminPage();
    const { getByTestId } = render(Component);

    // Adminコンポーネントが表示されていることを確認
    expect(getByTestId('admin-component')).toBeInTheDocument();

    // リダイレクトが呼ばれていないことを確認
    expect(redirect).not.toHaveBeenCalled();
  });

  it('異常系：未ログインの場合はトップページにリダイレクトする', async () => {
    // 未ログインをモック
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    try {
      await AdminPage();
      // redirectがエラーを投げなかった場合、テストを失敗させる
      expect('このコードは実行されないはず').toBe(false);
    } catch {
      // リダイレクトによるエラーは無視
    }

    // トップページへのリダイレクトが呼ばれたことを確認
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('異常系：管理者でないユーザーの場合はトップページにリダイレクトする', async () => {
    // 一般ユーザーをモック
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 'user-123',
      username: 'user',
      email: 'user@example.com',
      role: 'user',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
    });

    try {
      await AdminPage();
      // redirectがエラーを投げなかった場合、テストを失敗させる
      expect('このコードは実行されないはず').toBe(false);
    } catch {
      // リダイレクトによるエラーは無視
    }

    // トップページへのリダイレクトが呼ばれたことを確認
    expect(redirect).toHaveBeenCalledWith('/');
  });
});
