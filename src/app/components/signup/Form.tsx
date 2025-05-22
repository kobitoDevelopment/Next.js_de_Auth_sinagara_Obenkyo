"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { FormData, FormErrors } from "@/app/types/signup/form";
import { validateEmail, validateUsername, validateRole } from "@/app/utils/form/validation";

export default function Form() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    role: "user",
  });
  const [errors, setErrors] = useState<FormErrors>({
    username: "",
    email: "",
    role: "",
  });

  const [message, setMessage] = useState("");

  function validate(name: string, value: string): string {
    if (name === "username") {
      return validateUsername(value);
    }

    if (name === "email") {
      return validateEmail(value);
    }

    if (name === "role") {
      return validateRole(value);
    }

    return "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const name = e.target.name;
    const value = e.target.value;

    setFormData(function (prev: FormData) {
      return { ...prev, [name]: value };
    });

    setErrors(function (prev: FormErrors) {
      const newError = validate(name, value);
      return { ...prev, [name]: newError };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const usernameError = validate("username", formData.username);
    const emailError = validate("email", formData.email);
    const roleError = validate("role", formData.role);

    const newErrors = {
      username: usernameError,
      email: emailError,
      role: roleError,
    };

    setErrors(newErrors);

    const hasError = usernameError !== "" || emailError !== "" || roleError !== "";

    if (hasError) {
      return;
    }

    const { error } = await supabase.from("users").insert([formData]);

    if (error) {
      setMessage("エラー: " + error.message);
    } else {
      setMessage("登録完了しました！");
      setFormData({
        username: "",
        email: "",
        role: "user",
      });
      setErrors({
        username: "",
        email: "",
        role: "",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        ユーザー名
        <input type="text" name="username" value={formData.username} onChange={handleChange} />
        {errors.username !== "" && <p style={{ color: "red" }}>{errors.username}</p>}
      </label>
      <br />

      <label>
        メールアドレス
        <input type="email" name="email" value={formData.email} onChange={handleChange} />
        {errors.email !== "" && <p style={{ color: "red" }}>{errors.email}</p>}
      </label>
      <br />

      <label>
        ロール
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        {errors.role !== "" && <p style={{ color: "red" }}>{errors.role}</p>}
      </label>
      <br />

      <button type="submit">登録</button>
      {message !== "" && <p>{message}</p>}
    </form>
  );
}
