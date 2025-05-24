"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FormData, FormErrors } from "@/app/types/edit/form";
import { validateEmail, validateUsername, validateRole, validatePassword } from "@/app/utils/form/validation";
import styles from "./Form.module.css";
import { useAuth } from "@/app/context/AuthContext";

export default function EditUserForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    role: "user",
    currentPassword: "", // 追加
    newPassword: "", // 追加
  });

  const [errors, setErrors] = useState<FormErrors>({
    username: "",
    email: "",
    role: "",
    currentPassword: "", // 追加
    newPassword: "", // 追加
  });

  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchUser = async () => {
      const { data, error } = await supabase.from("users").select("*").eq("username", user.username).eq("email", user.email).single();

      if (error || !data) {
        setMessage("ユーザー情報の取得に失敗しました");
        return;
      }

      setUserId(data.id);
      setFormData({
        username: data.username,
        email: data.email,
        role: data.role,
        currentPassword: "", // 空欄にしておく
        newPassword: "", // 空欄にしておく
      });
    };

    fetchUser();
  }, [user]);
  const validate = (name: string, value: string): string => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 入力バリデーション
    const newErrors = {
      username: validate("username", formData.username),
      email: validate("email", formData.email),
      role: validate("role", formData.role),
      currentPassword: validate("currentPassword", formData.currentPassword),
      newPassword: validate("newPassword", formData.newPassword),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err !== "")) {
      setMessage("入力内容に誤りがあります");
      return;
    }

    if (!userId) {
      setMessage("ユーザーIDが不明です");
      return;
    }

    // DBから現在のパスワードを取得して照合
    const { data: currentUserData, error: fetchError } = await supabase.from("users").select("password").eq("id", userId).single();

    if (fetchError || !currentUserData) {
      setMessage("ユーザー情報の取得に失敗しました");
      return;
    }

    if (currentUserData.password !== formData.currentPassword) {
      setMessage("現在のパスワードが間違っています");
      return;
    }

    // 問題なければ更新（パスワードはnewPasswordに差し替え）
    const updateData = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
      password: formData.newPassword,
    };

    const { error: updateError } = await supabase.from("users").update(updateData).eq("id", userId);

    if (updateError) {
      setMessage("更新に失敗しました: " + updateError.message);
    } else {
      setMessage("更新に成功しました");
      // 更新後はcurrentPasswordとnewPasswordを空にするなど
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <dl className={styles.formItems}>
        {/* username, email, role */}
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

        {/* currentPassword */}
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

        {/* newPassword */}
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
