'use server';

import { signOut } from './actions';

export default async function MyPage() {
  return (
    <form action={signOut}>
      <button type="submit">サインアウト</button>
    </form>
  );
}
