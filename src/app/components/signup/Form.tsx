"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; // Supabase クライアントのインスタンスをインポート
import { FormData, FormErrors } from "@/app/types/signup/form"; // フォームデータとエラーの型定義をインポート
import { validateEmail, validateUsername, validateRole, validatePassword } from "@/app/utils/form/validation"; // 入力バリデーション関数をインポート
import { useRouter } from "next/navigation"; // リダイレクト用のフックをインポート
import styles from "./Form.module.css";

export default function Form() {
  const router = useRouter();
  // 入力データの状態（初期値は空）
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    role: "user", // 初期ロールをuserに設定
    password: "",
  });

  // バリデーションエラーを保存する状態（空文字列が「エラーなし」の意味）
  const [errors, setErrors] = useState<FormErrors>({
    username: "",
    email: "",
    role: "",
    password: "",
  });

  // 登録結果などのメッセージを表示するための状態
  const [message, setMessage] = useState("");

  /**
   * name に応じて適切なバリデーション関数を実行する
   */
  const validate = function (name: string, value: string): string {
    if (name === "username") {
      return validateUsername(value);
    }
    if (name === "email") {
      return validateEmail(value);
    }
    if (name === "role") {
      return validateRole(value);
    }
    if (name === "password") {
      return validatePassword(value);
    }
    return "";
  };

  /**
   * 入力が変更されたときに呼ばれる
   * - 入力値を状態に反映
   * - 即時バリデーションを行ってエラー状態も更新
   */
  const handleChange = function (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const name = e.target.name;
    const value = e.target.value;

    setFormData(function (prev: FormData) {
      return { ...prev, [name]: value };
    });

    setErrors(function (prev: FormErrors) {
      const newError = validate(name, value);
      return { ...prev, [name]: newError };
    });
  };

  /**
   * フォームが送信されたときに実行
   * - 入力値をバリデーション
   * - エラーがなければ Supabase にデータ挿入
   */
  const handleSubmit = async function (e: React.FormEvent) {
    e.preventDefault();

    // 各項目を手動でバリデーション
    const usernameError = validate("username", formData.username);
    const emailError = validate("email", formData.email);
    const roleError = validate("role", formData.role);
    const passwordError = validate("password", formData.password);

    // エラーオブジェクトを更新
    const newErrors = {
      username: usernameError,
      email: emailError,
      role: roleError,
      password: passwordError,
    };
    setErrors(newErrors);

    // エラーがあれば処理中断
    if (usernameError || emailError || roleError || passwordError) {
      setMessage("入力に誤りがあります。");
      return;
    }

    // Supabase の users テーブルに formData を挿入（パスワードは平文のまま）
    const result = await supabase.from("users").insert([formData]);
    if (!result) {
      setMessage("エラー: 挿入処理が失敗しました（result が undefined）");
      return;
    }

    // エラー判定
    const hasError = result.error !== null;

    if (hasError) {
      const errorMessage = result.error?.message || "エラーが発生しました";
      setMessage("エラー: " + errorMessage);
    } else {
      setMessage("succeeded");

      // フォーム初期化
      setFormData({
        username: "",
        email: "",
        role: "user",
        password: "",
      });

      setErrors({
        username: "",
        email: "",
        role: "",
        password: "",
      });

      setTimeout(() => {
        router.push("/signin"); // サインアップ後にサインインページへリダイレクト
      }, 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <dl className={styles.formItems}>
        {/* UserName 入力 */}
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="username">
              UserName
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <input className={styles.formItemsInput} id="username" type="text" name="username" value={formData.username} onChange={handleChange} />
            {errors.username && <strong className={styles.error}>{errors.username}</strong>}
          </dd>
        </div>

        {/* Email 入力 */}
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="email">
              Email
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <input className={styles.formItemsInput} id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
            {errors.email && <strong className={styles.error}>{errors.email}</strong>}
          </dd>
        </div>

        {/* Role 選択 */}
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="role">
              Role
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <select id="role" className={styles.formItemsSelect} name="role" value={formData.role} onChange={handleChange}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            {errors.role && <strong className={styles.error}>{errors.role}</strong>}
          </dd>
        </div>

        {/* Password 入力 */}
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="password">
              Password
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <input className={styles.formItemsInput} id="password" type="password" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" />
            {errors.password && <strong className={styles.error}>{errors.password}</strong>}
          </dd>
        </div>
      </dl>

      {/* 送信ボタン */}
      <button className={styles.submitButton} type="submit">
        Register
      </button>

      {/* 結果メッセージ表示 */}
      {message && <strong className={styles.succeeded}>{message}</strong>}
    </form>
  );
}
