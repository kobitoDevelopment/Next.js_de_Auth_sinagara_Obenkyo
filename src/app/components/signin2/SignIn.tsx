'use client';

import { useActionState } from 'react';
import { signInAction, SignInResult } from './actions';
import styles from './SignIn.module.css';

const initialState: SignInResult = { errors: undefined };

export default function SignIn2Form() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <section className={styles.container}>
      <form action={formAction} className={styles.form}>
        <h1 className={styles.title}>サインイン</h1>
        <dl className={styles.box}>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="email">メールアドレス</label>
            </dt>
            <dd className={styles.description}>
              <input id="email" type="email" name="email" required className={styles.input} />
            </dd>
          </div>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="password">パスワード</label>
            </dt>
            <dd className={styles.description}>
              <input
                id="password"
                type="password"
                name="password"
                required
                className={styles.input}
              />
            </dd>
          </div>
        </dl>
        <button type="submit" className={styles.button}>
          サインイン
        </button>
        {state?.errors && (
          <ul style={{ color: 'red', margin: 0, padding: 0, listStyle: 'none' }}>
            {state.errors.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        )}
      </form>
    </section>
  );
}
