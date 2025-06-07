"use client";

import { useActionState } from "react";
import { updateProfileAction, UpdateProfileResult } from "./actions";

const initialState: UpdateProfileResult = { errors: undefined };

/**
 * プロフィール編集ページ
 */
export default function EditProfilePage() {
  // useActionStateでサーバーアクションと状態管理
  const [state, formAction] = useActionState(updateProfileAction, initialState);

  return (
    <section>
      <h1>プロフィール編集</h1>
      {/* エラーがあれば全てリストで表示 */}
      {state?.errors && (
        <ul style={{ color: "red", margin: 0, padding: 0, listStyle: "none" }}>
          {state.errors.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      )}
      {/* 成功時の表示 */}
      {!state?.errors && state !== initialState && <p style={{ color: "green" }}>プロフィールを更新しました。</p>}
      <form action={formAction}>
        <label>
          ユーザー名
          <input type="text" name="username" required />
        </label>

        <label>
          メールアドレス
          <input type="email" name="email" required />
        </label>

        <label>
          現在のパスワード（パスワードを変更する場合のみ）
          <input type="password" name="current_password" />
        </label>

        <label>
          新しいパスワード
          <input type="password" name="new_password" />
        </label>

        <button type="submit">更新</button>
      </form>
    </section>
  );
}
