"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FormData, FormErrors } from "@/app/types/edit/form";
import { validateEmail, validateUsername, validateRole, validatePassword } from "@/app/utils/form/validation";
import styles from "./Form.module.css";
import { useAuth } from "@/app/context/AuthContextScratch";
import { setCookie } from "@/app/context/AuthContextScratch";

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
    if (name === "password") return validatePassword(value);
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

    // 全項目を再バリデーションし、エラーをセット
    const newErrors = {
      username: validate("username", formData.username),
      email: validate("email", formData.email),
      role: validate("role", formData.role),
      currentPassword: validate("currentPassword", formData.currentPassword),
      newPassword: validate("newPassword", formData.newPassword),
    };
    setErrors(newErrors);

    // エラーが1つでもあれば処理中断
    if (Object.values(newErrors).some((err) => err !== "")) {
      setMessage("入力内容に誤りがあります");
      return;
    }

    // ユーザーIDが取得できていない場合はエラー
    if (!userId) {
      setMessage("ユーザーIDが不明です");
      return;
    }

    // 現在のパスワードが正しいか確認（サーバーから取得）
    const { data: currentUserData, error: fetchError } = await supabase.from("users").select("password").eq("id", userId).single();

    if (fetchError || !currentUserData) {
      setMessage("ユーザー情報の取得に失敗しました");
      return;
    }

    // 入力された現在のパスワードとDB上のパスワードを比較
    if (currentUserData.password !== formData.currentPassword) {
      setMessage("現在のパスワードが間違っています");
      return;
    }

    // 更新データを準備
    const updateData = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
      password: formData.newPassword,
    };

    // Supabaseに対してユーザー情報を更新
    const { error: updateError } = await supabase.from("users").update(updateData).eq("id", userId);

    if (updateError) {
      setMessage("更新に失敗しました: " + updateError.message);
    } else {
      // 更新後、最新のユーザーデータを取得
      const { data: updatedUser, error: updatedError } = await supabase.from("users").select("*").eq("id", userId).single();

      if (updatedError || !updatedUser) {
        setMessage("ユーザー情報の再取得に失敗しました");
        return;
      }

      // Context上のユーザー情報を更新
      setUser({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
      });

      // Cookie も更新して最新のユーザー情報を保存
      setCookie(
        "auth_user",
        JSON.stringify({
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
        })
      );

      // フォームを初期状態に（パスワード欄のみ）
      setMessage("更新に成功しました");
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
    }
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
