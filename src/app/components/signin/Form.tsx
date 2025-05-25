"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Form.module.css";

export default function Form() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // useAuthコンテキストからsignIn関数を取得してサインイン処理に使用する
  const { signIn } = useAuth();

  // useRouterフックを使って、サインイン成功時にページ遷移するためのrouterオブジェクトを取得
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const success = await signIn(email, password);
    if (success) {
      router.push("/mypage");
    } else {
      setError("メールアドレスかパスワードが間違っています");
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
            <input className={styles.formItemsInput} id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </dd>
        </div>
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="password">
              PassWord
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <input className={styles.formItemsInput} id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </dd>
        </div>

        {error && <strong className={styles.error}>{error}</strong>}
      </dl>
      <button type="submit" className={styles.submitButton}>
        Sign In
      </button>
      <Link href="/signup" className={styles.submitButton}>
        Sign Up
      </Link>
    </form>
  );
}
