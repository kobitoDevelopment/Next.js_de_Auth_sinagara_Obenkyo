"use client";

import { useState } from "react";
import { updateProfile } from "./actions";

export default function EditProfilePage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(formData);
      setSuccess("プロフィールを更新しました。");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("不明なエラーが発生しました");
      }
    }
  };

  return (
    <section>
      <h1>プロフィール編集</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <form action={handleSubmit}>
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
