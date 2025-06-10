'use server';

import { signOut } from './actions';
import styles from './SignOut.module.css';

export default async function MyPage() {
  return (
    <form action={signOut}>
      <button type="submit" className={styles.button}>
        サインアウト
      </button>
    </form>
  );
}
