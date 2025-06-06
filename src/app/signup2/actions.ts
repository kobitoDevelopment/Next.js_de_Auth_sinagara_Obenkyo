"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Supabaseクライアント
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// zodスキーマ定義
const RegisterSchema = z.object({
  username: z.string().min(1, "ユーザー名は必須です"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  role: z.string().min(1, "ロールは必須です"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
});

export async function registerUser(formData: FormData) {
  // FormData からオブジェクトへ変換
  const rawData = {
    username: formData.get("username"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  };

  // zod で検証（安全に string に変換＆バリデーション）
  const parsed = RegisterSchema.safeParse(rawData);

  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join("\n");
    throw new Error(`バリデーションエラー:\n${message}`);
  }

  const { username, email, role, password } = parsed.data;

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("users").insert([
    {
      username,
      email,
      role,
      password: hashedPassword,
    },
  ]);

  if (error) {
    console.error(error);
    throw new Error("ユーザー登録に失敗しました");
  }

  redirect("/signin2");
}
