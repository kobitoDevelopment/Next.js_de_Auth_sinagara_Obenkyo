"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FormData, FormErrors } from "@/app/types/edit/form";
import { validateEmail, validateUsername, validateRole, validatePassword } from "@/app/utils/form/validation";
import styles from "./Form.module.css";
import { useAuth } from "@/app/context/AuthContext";
import { setCookie } from "@/app/context/AuthContext";

export default function EditUserForm() {
  // 認証済みのユーザー情報とユーザー状態更新関数をContextから取得
  const { user, setUser } = useAuth();

  // 入力フォームの初期状態を定義
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    role: "user",
    currentPassword: "",
    newPassword: "",
  });

  // 各入力項目のバリデーションエラーを格納する状態
  const [errors, setErrors] = useState<FormErrors>({
    username: "",
    email: "",
    role: "",
    currentPassword: "",
    newPassword: "",
  });

  // 成功・エラーなどのメッセージ表示用
  const [message, setMessage] = useState("");

  // SupabaseのユーザーID（DB上のID）を保持
  const [userId, setUserId] = useState<number | null>(null);

  // 初回マウント時にユーザー情報を取得してフォームを初期化
  useEffect(() => {
    if (!user) return;

    const fetchUser = async () => {
      // Supabaseのusersテーブルから現在のユーザー情報を取得
      const { data, error } = await supabase.from("users").select("*").eq("username", user.username).eq("email", user.email).single();

      if (error || !data) {
        setMessage("ユーザー情報の取得に失敗しました");
        return;
      }

      // ユーザーIDを保存して、フォームに初期値をセット
      setUserId(data.id);
      setFormData({
        username: data.username,
        email: data.email,
        role: data.role,
        currentPassword: "",
        newPassword: "",
      });
    };

    fetchUser();
  }, [user]);

  // 入力値に応じたバリデーション関数を呼び出す
  const validate = (name: string, value: string): string => {
    if (name === "username") return validateUsername(value);
    if (name === "email") return validateEmail(value);
    if (name === "role") return validateRole(value);
    if (name === "currentPassword") return validatePassword(value);
    if (name === "newPassword") return validatePassword(value);
    return "";
  };

  // 入力フォームの変更時にフォームデータとバリデーションを更新
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  // フォーム送信時の処理

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      username: validate("username", formData.username),
      email: validate("email", formData.email),
      role: validate("role", formData.role),
      currentPassword: validate("currentPassword", formData.currentPassword),
      newPassword: validate("newPassword", formData.newPassword),
    };
    setErrors(newErrors);

    // バリデーションエラーが1つでもあれば処理を中断しメッセージを表示
    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    if (hasErrors) {
      setMessage("必要な情報が不足しています");
      return;
    }

    if (!userId) {
      setMessage("ユーザーIDが不明です");
      return;
    }

    // APIに送信するデータを整形
    const res = await fetch("/api/edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setMessage(result.error || "更新に失敗しました");
      return;
    }

    // 成功時はContextとCookieを更新
    const updatedUser = result.user;
    setUser(updatedUser);

    setCookie("auth_user", JSON.stringify(updatedUser));

    setMessage("更新に成功しました");
    setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
  };
  // 入力フォームの描画
  return (
    <form onSubmit={handleSubmit}>
      <dl className={styles.formItems}>
        {/* username, email, role の入力フィールドをループで生成 */}
        {["username", "email", "role"].map((field) => (
          <div className={styles.formItemsRow} key={field}>
            <dt className={styles.formItemsTerm}>
              <label className={styles.formItemsLabel} htmlFor={field}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
            </dt>
            <dd className={styles.formItemsDescription}>
              {field === "role" ? (
                <select id={field} name={field} value={formData[field as keyof FormData]} onChange={handleChange} className={styles.formItemsSelect}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              ) : (
                <input className={styles.formItemsInput} id={field} name={field} type="text" value={formData[field as keyof FormData]} onChange={handleChange} />
              )}
              {errors[field as keyof FormErrors] && <strong className={styles.error}>{errors[field as keyof FormErrors]}</strong>}
            </dd>
          </div>
        ))}

        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="currentPassword">
              Current Password
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <input className={styles.formItemsInput} id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} />
            {errors.currentPassword && <strong className={styles.error}>{errors.currentPassword}</strong>}
          </dd>
        </div>

        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="newPassword">
              New Password
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <input className={styles.formItemsInput} id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} />
            {errors.newPassword && <strong className={styles.error}>{errors.newPassword}</strong>}
          </dd>
        </div>
      </dl>

      <button type="submit" className={styles.submitButton}>
        Update
      </button>

      {message && <strong className={styles.succeeded}>{message}</strong>}
    </form>
  );
}
