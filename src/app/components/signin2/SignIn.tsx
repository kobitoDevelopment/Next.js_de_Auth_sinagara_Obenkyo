'use client';

import { useActionState } from 'react';
import { signInAction, SignInResult } from './actions';

const initialState: SignInResult = { errors: undefined };

export default function SignIn2Form() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <section>
      <h1>サインイン</h1>
      {state?.errors && (
        <ul style={{ color: 'red', margin: 0, padding: 0, listStyle: 'none' }}>
          {state.errors.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      )}
      <form action={formAction}>
        <label>
          メールアドレス
          <input type="email" name="email" required />
        </label>
        <label>
          パスワード
          <input type="password" name="password" required />
        </label>
        <button type="submit">サインイン</button>
      </form>
    </section>
  );
}
