'use server';

import { cookies } from 'next/headers';
import SignOut from '@/app/components/mypage2/signout2/SignOut';
import Delete from '@/app/components/mypage2/delete2/Delete';
import Link from 'next/link';
import styles from './MyPage.module.css';

export default async function MyPage() {
  // サーバーコンポーネントなので cookies() で直接ユーザーIDを取得できる
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value || '未ログイン';

  return (
    <section className={styles.container}>
      <div className={styles.inner}>
        <h1 className={styles.title}>マイページ</h1>
        <dl className={styles.box}>
          <div className={styles.line}>
            <dt className={styles.term}>ユーザーID</dt>
            <dd className={styles.description}>
              <i>{userId}</i>
            </dd>
          </div>
        </dl>
        <Link href="/mypage2/edit2" className={styles.button}>
          編集画面へ
        </Link>
        <SignOut />
        <Delete />
      </div>
    </section>
  );
}
