'use client';
import React, { useActionState } from 'react';
import { registerUserAction, RegisterResult } from './actions';
import styles from './SignUp.module.css';

const initialState: RegisterResult = { errors: undefined };

export default function SignUp2Form() {
  const [state, formAction] = useActionState(registerUserAction, initialState);

  return (
    <section className={styles.container}>
      <form action={formAction} className={styles.form}>
        <h1 className={styles.title}>サインアップ</h1>
        <dl className={styles.box}>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="username">ユーザー名</label>
            </dt>
            <dd className={styles.description}>
              <input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                className={styles.input}
              />
            </dd>
          </div>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="email">メールアドレス</label>
            </dt>
            <dd className={styles.description}>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                className={styles.input}
              />
            </dd>
          </div>
          <div className={styles.line}>
            <dt className={styles.term}>
              <label htmlFor="role">ロール</label>
            </dt>
            <dd className={styles.description}>
              <select id="role" name="role" className={styles.select}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
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
                autoComplete="new-password"
                className={styles.input}
              />
            </dd>
          </div>
        </dl>

        <div className={styles.privacyLine}>
          <label htmlFor="privacyPolicy" className={styles.checkboxLabel}>
            プライバシーポリシー に同意します
          </label>
          <input
            id="privacyPolicy"
            type="checkbox"
            name="privacyPolicy"
            className={styles.checkbox}
          />
        </div>

        <button type="submit" className={styles.button}>
          登録
        </button>
        {state?.errors && (
          <ul
            style={{ color: 'red', margin: 0, padding: 0, listStyle: 'none' }}
            className="error-message"
          >
            {state.errors.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        )}
      </form>
    </section>
  );
}
