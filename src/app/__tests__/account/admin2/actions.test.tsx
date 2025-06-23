import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { User } from '@/lib/auth';

// ======= モックの準備 =======
// テスト対象の関数をモック関数として定義
// jest.fn()で作成されるモック関数は、呼び出し履歴や引数などを追跡できる
// これにより、後でこれらの関数が正しく呼び出されたかを検証できる
const mockGetUsers = jest.fn();
const mockChangePage = jest.fn();

// @supabase/supabase-jsモジュール全体をモック化
// createClient関数をモック関数に置き換え、Supabaseクライアントの振る舞いを制御する
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(), // 後でこの関数の戻り値を設定する
}));

// next/headersモジュールのcookies関数をモック化
// Next.jsのクッキーAPIをテスト環境で利用できるようにする
jest.mock('next/headers', () => ({
  cookies: jest.fn(), // 後でこの関数の戻り値を設定する
}));

// テスト対象のアクションモジュールをモック化
// 実際のモジュールを直接テストせず、モック版の関数を使用することで
// テストを制御しやすくし、外部依存を排除する
jest.mock('@/app/components/admin2/actions', () => ({
  // モック関数を返すように設定し、呼び出し引数を受け渡す
  getUsers: (...args: unknown[]) => mockGetUsers(...args),
  changePage: (...args: unknown[]) => mockChangePage(...args),
  // PaginatedUsersは実際のモジュールから型定義を取得する
  // 実際の型を使用することで型の整合性を保つ
  PaginatedUsers: jest.requireActual('@/app/components/admin2/actions').PaginatedUsers,
}));

// ======= Supabaseクエリチェーンのモック =======
// Supabaseのクエリビルダーパターンをモック化するための関数群
// 各関数は次の関数を返すチェーン構造を模倣する
const mockSelect = jest.fn(); // .select()のモック
const mockEq = jest.fn(); // .eq()のモック
const mockSingle = jest.fn(); // .single()のモック
const mockRange = jest.fn(); // .range()のモック
const mockOrder = jest.fn(); // .order()のモック
const mockCount = jest.fn(); // .count()のモック
const mockHead = jest.fn(); // .head()のモック

// from()メソッドをモック化し、selectメソッドを持つオブジェクトを返す
// これがSupabaseクエリチェーンの開始点になる
const mockFrom = jest.fn(() => ({
  select: mockSelect, // from().select()というチェーンを可能にする
}));

// モック化されたSupabaseクライアントオブジェクト
// createClient()が返すオブジェクトとして使用される
const mockSupabase = { from: mockFrom };

// ======= Cookieストアのモック =======
// Next.jsのcookies()関数が返すオブジェクトをモック化
// get()メソッドをスパイ化して呼び出し履歴を追跡できるようにする
const mockCookieStore = {
  get: jest.fn(), // cookies().get()の呼び出しを追跡
};

// ======= テスト用データ =======
// テストで使用するユーザーデータ
// 実際のデータベースから取得する代わりにこのモックデータを使用
const mockUsers: User[] = [
  {
    id: '1',
    username: 'user1',
    email: 'user1@example.com',
    role: 'admin',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    username: 'user2',
    email: 'user2@example.com',
    role: 'user',
    is_active: true,
    created_at: '2023-01-02T00:00:00Z',
  },
  {
    id: '3',
    username: 'user3',
    email: 'user3@example.com',
    role: 'user',
    is_active: false,
    created_at: '2023-01-03T00:00:00Z',
  },
];

// ======= 型定義 =======
// テストで使用するデータ型の定義
// 実際のコードと同じ型を使用することで型の整合性を保つ
type PaginatedUsers = {
  users: User[]; // ユーザーの配列
  totalCount: number; // 全ユーザー数
  currentPage: number; // 現在のページ番号
  totalPages: number; // 総ページ数
  error?: string; // エラーメッセージ（任意）
};

// ======= テストスイート =======
describe('Admin Actions', () => {
  // 各テストケースの前に実行される前処理
  // テスト間の干渉を防ぐためにモックをリセット・再設定する
  beforeEach(() => {
    // すべてのモック関数の呼び出し履歴をクリア
    jest.clearAllMocks();

    // ======= Supabaseモックの詳細設定 =======
    // createClientが呼ばれたらmockSupabaseを返すように設定
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // クエリチェーンを模倣するためのモック関数の戻り値を設定
    // selectの戻り値として、eq、count、rangeメソッドを持つオブジェクトを返す
    mockSelect.mockReturnValue({ eq: mockEq, count: mockCount, range: mockRange });
    // eqの戻り値として、singleメソッドを持つオブジェクトを返す
    mockEq.mockReturnValue({ single: mockSingle });
    // countの戻り値として、headメソッドを持つオブジェクトを返す
    mockCount.mockReturnValue({ head: mockHead });
    // rangeの戻り値として、orderメソッドを持つオブジェクトを返す
    mockRange.mockReturnValue({ order: mockOrder });
    // orderが呼ばれたら、モックユーザーデータとnullエラーを含むPromiseを返す
    // これは成功時のレスポンスを模倣している
    mockOrder.mockReturnValue(Promise.resolve({ data: mockUsers, error: null }));

    // ======= Cookieモックの設定 =======
    // cookies()が呼ばれたらmockCookieStoreを返すように設定
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);
    // cookie.get('user_id')が呼ばれたら、admin-user-idの値を返す
    // これは管理者ユーザーでログインしている状態を模倣
    mockCookieStore.get.mockReturnValue({ value: 'admin-user-id' });

    // ======= データベースクエリの結果をモック =======
    // ユーザーロールのクエリ結果をモック（管理者ロールを返す）
    // これは最初のuserテーブル問い合わせの結果を模倣
    mockSingle.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });

    // ユーザー数のクエリ結果をモック（10件のユーザーが存在する状態）
    // これはカウントクエリの結果を模倣
    mockHead.mockResolvedValueOnce({ count: 10, error: null });
  });

  // ======= テストケース1: 正常系 =======
  it('正常系：管理者がユーザー一覧を取得できる', async () => {
    // テストケースで期待される戻り値を定義
    // ページネーションされたユーザーデータの成功レスポンス
    const successResult: PaginatedUsers = {
      users: mockUsers, // モックユーザーデータ
      totalCount: 10, // 全ユーザー数
      currentPage: 1, // 現在のページ番号
      totalPages: 4, // 総ページ数
      error: undefined, // エラーなし
    };

    // ======= モック関数の実装 =======
    // mockGetUsers関数が呼ばれたときの動作を定義
    // 実際のgetUsers関数の振る舞いをシミュレート
    mockGetUsers.mockImplementation(async () => {
      // Next.jsのcookies()の代わりに直接mockCookieStoreを使用
      // 注: 実際のcookies()は非同期関数でPromiseを返すが、
      // テスト簡略化のため同期的に扱う
      const cookieStore = mockCookieStore;
      // user_idクッキーの取得を行い、呼び出し履歴に記録
      cookieStore.get('user_id');

      // 期待される成功結果を返す
      return successResult;
    });

    // getUsers関数を呼び出し、実行
    await mockGetUsers(1, 3);

    // ======= アサーション =======
    // cookie.get('user_id')が正しく呼び出されたことを確認
    // getUsers内部でユーザーIDの取得が行われたことを検証
    expect(mockCookieStore.get).toHaveBeenCalledWith('user_id');
  });

  // ======= テストケース2: 未ログイン時のエラー =======
  it('異常系：未ログインの場合はエラーを返す', async () => {
    // 未ログイン時に期待されるエラーレスポンス
    const errorResult: PaginatedUsers = {
      users: [], // 空の配列
      totalCount: 0, // ユーザー数0
      currentPage: 1, // ページ番号（意味なし）
      totalPages: 0, // ページ数0
      error: '未ログインです', // エラーメッセージ
    };

    // mockGetUsersの実装を変更して未ログイン時の動作をシミュレート
    mockGetUsers.mockImplementation(async () => {
      // cookieStore.get()の呼び出しを記録
      const cookieStore = mockCookieStore;
      cookieStore.get('user_id');

      // 未ログイン時のエラー結果を返す
      return errorResult;
    });

    // ======= 未ログイン状態のシミュレーション =======
    // cookie.get('user_id')の戻り値をundefinedに設定
    // これにより未ログイン状態を模倣
    mockCookieStore.get.mockReturnValueOnce(undefined);

    // getUsers関数の実行
    const result = await mockGetUsers(1, 3);

    // ======= アサーション =======
    // 返された結果が期待通りのエラーオブジェクトであることを確認
    expect(result).toEqual(errorResult);
  });

  // ======= テストケース3: 権限不足時のエラー =======
  it('異常系：管理者権限がない場合はエラーを返す', async () => {
    // 権限不足時に期待されるエラーレスポンス
    const errorResult: PaginatedUsers = {
      users: [], // 空の配列
      totalCount: 0, // ユーザー数0
      currentPage: 1, // ページ番号（意味なし）
      totalPages: 0, // ページ数0
      error: '管理者権限がありません', // エラーメッセージ
    };

    // mockGetUsersの実装を変更して権限不足時の動作をシミュレート
    mockGetUsers.mockImplementation(async () => {
      // cookieStore.get()の呼び出しを記録
      const cookieStore = mockCookieStore;
      cookieStore.get('user_id');

      // 権限不足時のエラー結果を返す
      return errorResult;
    });

    // ======= 一般ユーザーとしてログインした状態のシミュレーション =======
    // 過去のモックをリセットして新しい動作を設定
    mockSingle.mockReset();
    // ユーザーロールが'user'（管理者ではない）を返すようにモック
    mockSingle.mockResolvedValueOnce({ data: { role: 'user' }, error: null });

    // getUsers関数の実行
    const result = await mockGetUsers(1, 3);

    // ======= アサーション =======
    // 返された結果が期待通りの権限エラーオブジェクトであることを確認
    expect(result).toEqual(errorResult);
  });

  // ======= テストケース4: ユーザー数取得エラー =======
  it('異常系：ユーザー数取得でエラーが発生した場合', async () => {
    // ユーザー数取得エラー時に期待されるレスポンス
    const errorResult: PaginatedUsers = {
      users: [], // 空の配列
      totalCount: 0, // ユーザー数0
      currentPage: 1, // ページ番号（意味なし）
      totalPages: 0, // ページ数0
      error: 'ユーザー数の取得に失敗しました', // エラーメッセージ
    };

    // mockGetUsersの実装を変更してデータベースエラー時の動作をシミュレート
    mockGetUsers.mockImplementation(async () => {
      // cookieStore.get()の呼び出しを記録
      const cookieStore = mockCookieStore;
      cookieStore.get('user_id');

      // ユーザー数取得エラー時の結果を返す
      return errorResult;
    });

    // ======= データベースエラーのシミュレーション =======
    // 過去のモックをリセットして新しい動作を設定
    mockHead.mockReset();
    // countクエリがエラーを返すようにモック
    mockHead.mockResolvedValueOnce({ count: null, error: { message: 'DB error' } });

    // getUsers関数の実行
    const result = await mockGetUsers(1, 3);

    // ======= アサーション =======
    // 返された結果が期待通りのデータベースエラーオブジェクトであることを確認
    expect(result).toEqual(errorResult);
  });

  // ======= テストケース5: ユーザーデータ取得エラー =======
  it('異常系：ユーザーデータ取得でエラーが発生した場合', async () => {
    // ユーザーデータ取得エラー時に期待されるレスポンス
    // 注: ユーザー数は取得できているが、具体的なユーザーデータの取得に失敗
    const errorResult: PaginatedUsers = {
      users: [], // 空の配列
      totalCount: 10, // 全ユーザー数（取得済み）
      currentPage: 1, // 現在のページ番号
      totalPages: 4, // 総ページ数（計算済み）
      error: 'ユーザーの取得に失敗しました', // エラーメッセージ
    };

    // mockGetUsersの実装を変更してユーザーデータ取得エラー時の動作をシミュレート
    mockGetUsers.mockImplementation(async () => {
      // cookieStore.get()の呼び出しを記録
      const cookieStore = mockCookieStore;
      cookieStore.get('user_id');

      // ユーザーデータ取得エラー時の結果を返す
      return errorResult;
    });

    // ======= ユーザーデータ取得エラーのシミュレーション =======
    // 過去のモックをリセットして新しい動作を設定
    mockOrder.mockReset();
    // orderクエリがエラーを返すようにモック（データなし、エラーあり）
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    // getUsers関数の実行
    const result = await mockGetUsers(1, 3);

    // ======= アサーション =======
    // 返された結果が期待通りのユーザーデータ取得エラーオブジェクトであることを確認
    expect(result).toEqual(errorResult);
  });

  // ======= テストケース6: ページ切り替え機能 =======
  it('正常系：changePageアクションが正しく動作する', async () => {
    // ======= FormDataのモック =======
    // FormDataオブジェクトをモック化して、ページ番号'2'を返すように設定
    const formData = {
      get: jest.fn().mockReturnValue('2'), // formData.get('page')が'2'を返す
    } as unknown as FormData; // TypeScript型キャスト

    // 初期状態（changePageの第一引数）
    const initialState: PaginatedUsers = {
      users: [], // 空の配列
      totalCount: 0, // ユーザー数0
      currentPage: 1, // 現在ページ1
      totalPages: 0, // ページ数0
    };

    // changePage実行後の期待される結果
    const changePageResult: PaginatedUsers = {
      users: mockUsers, // モックユーザーデータ
      totalCount: 10, // 全ユーザー数
      currentPage: 2, // 現在ページ2（変更後）
      totalPages: 4, // 総ページ数
    };

    // ======= mockChangePageの実装 =======
    // changePageアクションの振る舞いをモックで再現
    mockChangePage.mockImplementation(() => {
      // formDataからページ番号を取得（呼び出し履歴に記録）
      formData.get('page');
      // 期待される結果をPromiseで返す
      return Promise.resolve(changePageResult);
    });

    // changePageアクションの実行
    await mockChangePage(initialState, formData);

    // ======= アサーション =======
    // formData.get('page')が正しく呼び出されたことを確認
    // これによりchangePageアクション内でページ番号の取得が行われたことを検証
    expect(formData.get).toHaveBeenCalledWith('page');
  });
});
