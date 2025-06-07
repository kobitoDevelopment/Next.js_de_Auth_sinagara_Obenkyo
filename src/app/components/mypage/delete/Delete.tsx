'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './Delete.module.css';

export default function Delete() {
  const { deleteAccount } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  const handleDelete = async () => {
    const ok = confirm('本当にアカウントを削除しますか？');

    if (!ok) return;

    const result = await deleteAccount();

    if (result) {
      router.push('/signin'); // 削除成功時はサインインページへリダイレクト
    } else {
      setError('アカウントの削除に失敗しました。');
    }
  };

  return (
    <div>
      <button onClick={handleDelete} className={styles.button} type="button">
        Delete
      </button>
      {error && <strong className={styles.error}>{error}</strong>}
    </div>
  );
}
