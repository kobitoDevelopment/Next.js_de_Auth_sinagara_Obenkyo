'use server';

import { cookies } from 'next/headers';
import { signOut } from './actions';
import Link from 'next/link';

export default async function MyPage() {
  // サーバーコンポーネントなので cookies() で直接ユーザーIDを取得できる
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value || '未ログイン';

  return (
    <section>
      <h1>マイページ</h1>
      <p>ユーザーID: {userId}</p>
      <Link href="/edit2">編集画面へ</Link>
      <form action={signOut}>
        <button type="submit">サインアウト</button>
      </form>
    </section>
  );
}
