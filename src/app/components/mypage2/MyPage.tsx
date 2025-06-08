'use server';

import { cookies } from 'next/headers';
import SignOut from '@/app/components/mypage2/signout2/SignOut';
import Delete from '@/app/components/mypage2/delete2/Delete';
import Link from 'next/link';

export default async function MyPage() {
  // サーバーコンポーネントなので cookies() で直接ユーザーIDを取得できる
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value || '未ログイン';

  return (
    <section>
      <h1>マイページ</h1>
      <p>ユーザーID: {userId}</p>
      <Link href="/mypage2/edit2">編集画面へ</Link>
      <SignOut />
      <Delete />
    </section>
  );
}
