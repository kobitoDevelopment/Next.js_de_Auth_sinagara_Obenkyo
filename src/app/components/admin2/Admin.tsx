'use client';

import { useActionState } from 'react';
import { PaginatedUsers, changePage } from './actions';
import { useEffect, Suspense, useTransition } from 'react';
import styles from './Admin.module.css';

export default function AdminUsersPage() {
  // 初期状態
  const initialState: PaginatedUsers = {
    users: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
  };

  // ユーザー一覧を取得するアクションとステート
  const [state, formAction] = useActionState(changePage, initialState);

  // useTransitionを使ってSuspense対応のローディング状態を管理
  const [isPending, startTransition] = useTransition();

  // URLハッシュからページ番号を取得する関数
  const getPageFromHash = (): number => {
    if (typeof window === 'undefined') return 1;

    const hash = window.location.hash;
    const match = hash.match(/#page=(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  // ページ切り替え処理
  const handlePageChange = (pageNum: number, e?: React.MouseEvent) => {
    e?.preventDefault();

    // URLハッシュを更新
    window.location.hash = `page=${pageNum}`;

    // startTransitionでラップしてSuspenseを有効にする
    startTransition(() => {
      // Server Actionでデータ取得
      const formData = new FormData();
      formData.append('page', pageNum.toString());
      formAction(formData);
    });
  };

  // URLハッシュの変更を検知してページを更新
  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();

      // 現在のページと異なる場合のみ更新
      if (page !== state.currentPage) {
        handlePageChange(page);
      }
    };

    // 初回読み込み時
    const initialPage = getPageFromHash();
    handlePageChange(initialPage);

    // hashchangeイベントのリスナー登録
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [state.currentPage]);

  // ページネーションUI生成関数
  const renderPagination = () => {
    const pageItems = [];

    for (let i = 1; i <= state.totalPages; i++) {
      pageItems.push(
        <li key={i} className={i === state.currentPage ? styles.activePage : styles.pageItem}>
          <a
            href={`#page=${i}`}
            onClick={(e) => handlePageChange(i, e)}
            className={styles.pageLink}
            aria-current={i === state.currentPage ? 'page' : undefined}
          >
            {i}
          </a>
        </li>
      );
    }

    return (
      <nav className={styles.paginationNav}>
        <ul className={styles.pagination}>{pageItems}</ul>
      </nav>
    );
  };

  if (state.error) {
    return <div className={styles.error}>{state.error}</div>;
  }

  // ユーザーデータを表示するコンポーネント
  const UserData = () => (
    <>
      <div className={styles.stats}>
        <p>全ユーザー数: {state.totalCount}</p>
        <p>
          ページ: {state.currentPage} / {state.totalPages}
        </p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ユーザー名</th>
            <th>メール</th>
            <th>ロール</th>
            <th>状態</th>
            <th>作成日時</th>
          </tr>
        </thead>
        <tbody>
          {state.users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.is_active ? '有効' : '無効'}</td>
              <td>{new Date(user.created_at).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </>
  );

  return (
    <section className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>ユーザー一覧</h1>

        <Suspense fallback={<div>Suspense...</div>}>
          {isPending ? <div>Suspense...</div> : <UserData />}
        </Suspense>
      </div>
    </section>
  );
}
