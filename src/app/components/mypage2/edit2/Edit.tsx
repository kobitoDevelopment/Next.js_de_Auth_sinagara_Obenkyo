'use client';

import { useActionState } from 'react';
import { updateProfileAction, UpdateProfileResult } from './actions';
import styles from './Edit.module.css';

const initialState: UpdateProfileResult = { errors: undefined };

/**
 * プロフィール編集ページ
 */
export default function EditProfilePage() {
  // useActionStateでサーバーアクションと状態管理
  const [state, formAction] = useActionState(updateProfileAction, initialState);

  return (
    <section className={styles.container}>
      <form action={formAction} className={styles.form}>
        <h1 className={styles.title}>プロフィール編集</h1>
        <dl className={styles.box}>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="username">ユーザー名</label>
            </dt>
            <dd className={styles.description}>
              <input id="username" type="text" name="username" className={styles.input} />
            </dd>
          </div>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="email">メールアドレス</label>
            </dt>
            <dd className={styles.description}>
              <input id="email" type="email" name="email" className={styles.input} />
            </dd>
          </div>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="current_password">現在のパスワード</label>
            </dt>
            <dd className={styles.description}>
              <input
                id="current_password"
                type="password"
                name="current_password"
                className={styles.input}
              />
            </dd>
          </div>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="new_password">新しいパスワード</label>
            </dt>
            <dd className={styles.description}>
              <input
                id="new_password"
                type="password"
                name="new_password"
                className={styles.input}
              />
            </dd>
          </div>
        </dl>

        <button type="submit" className={styles.button}>
          更新
        </button>
        {/* エラーがあれば全てリストで表示 */}
        {state?.errors && (
          <ul style={{ color: 'red', margin: 0, padding: 0, listStyle: 'none' }}>
            {state.errors.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        )}
        {/* 成功時の表示 */}
        {!state?.errors && state !== initialState && (
          <p style={{ color: 'green' }}>プロフィールを更新しました。</p>
        )}
      </form>
    </section>
  );
}
