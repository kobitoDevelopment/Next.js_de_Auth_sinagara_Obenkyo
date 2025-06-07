'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import styles from './Signout.module.css';

export default function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut(); // useAuthからsignOut関数を呼び出す
    router.push('/signin'); // サインインページに遷移
  };

  return (
    <button className={styles.button} type="button" onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
