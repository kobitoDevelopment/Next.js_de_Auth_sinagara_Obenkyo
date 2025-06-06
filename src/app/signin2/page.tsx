"use client";

import { useState } from "react";
import { signIn } from "./actions";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      await signIn(formData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <section>
      <h1>サインイン</h1>
      {error && <strong>{error}</strong>}
      <form action={handleSubmit}>
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
