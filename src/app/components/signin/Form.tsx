'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Form.module.css';

export default function Form() {
  // フォームの入力状態を管理
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // AuthContextからsignIn関数を取得（メールアドレスとパスワードで認証処理を実行）
  const { signIn } = useAuth();

  // Next.jsのクライアントサイドルーター（ページ遷移に利用）
  const router = useRouter();

  // フォーム送信時の処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // signIn関数を呼び出し、成功すればmypageへ遷移
    const success = await signIn(email, password);

    if (success) {
      router.push('/mypage');
    } else {
      // 認証失敗時はエラーメッセージをセットして画面に表示
      setError('メールアドレスかパスワードが間違っています');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <dl className={styles.formItems}>
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="email">
              Email
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            {/* email入力フォーム */}
            <input
              className={styles.formItemsInput}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </dd>
        </div>
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="password">
              PassWord
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            {/* password入力フォーム */}
            <input
              className={styles.formItemsInput}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </dd>
        </div>

        {/* エラーがあれば表示 */}
        {error && <strong className={styles.error}>{error}</strong>}
      </dl>

      {/* 送信ボタン */}
      <button type="submit" className={styles.submitButton}>
        Sign In
      </button>

      {/* サインアップページへのリンク */}
      <Link href="/signup" className={styles.submitButton}>
        Sign Up
      </Link>
    </form>
  );
}
