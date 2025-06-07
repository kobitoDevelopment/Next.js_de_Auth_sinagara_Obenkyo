"use client";
import React, { useActionState } from "react";
import { registerUserAction, RegisterResult } from "./actions";

const initialState: RegisterResult = { errors: undefined };

export default function SignUp2Form() {
  const [state, formAction] = useActionState(registerUserAction, initialState);

  return (
    <form action={formAction}>
      <div>
        <label>
          ユーザー名
          <input type="text" name="username" required autoComplete="username" />
        </label>
      </div>
      <div>
        <label>
          メールアドレス
          <input type="email" name="email" required autoComplete="email" />
        </label>
      </div>
      <div>
        <label>
          ロール
          <select name="role" required>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          パスワード
          <input type="password" name="password" required autoComplete="new-password" />
        </label>
      </div>
      <button type="submit">登録</button>
      {state?.errors && (
        <ul style={{ color: "red", margin: 0, padding: 0, listStyle: "none" }}>
          {state.errors.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
