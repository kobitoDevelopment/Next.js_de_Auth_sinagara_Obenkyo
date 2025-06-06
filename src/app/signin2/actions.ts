"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

// Supabaseクライアント作成
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Zodスキーマを定義
const signInSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(6, { message: "パスワードは6文字以上で入力してください" }),
});

export async function signIn(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  //  ここでnullやstring以外をチェック
  if (typeof email !== "string" || typeof password !== "string") {
    throw new Error("フォームの入力が不正です");
  }

  // Zodでバリデーション
  const parseResult = signInSchema.safeParse({ email, password });
  if (!parseResult.success) {
    const errors = parseResult.error.format();
    throw new Error(JSON.stringify(errors));
  }

  const { email: validEmail, password: validPassword } = parseResult.data;

  // Supabaseからユーザー情報を取得
  const { data: user, error } = await supabase.from("users").select("*").eq("email", validEmail).single();

  if (error || !user) {
    throw new Error("ユーザーが見つかりません");
  }

  // パスワード比較時にundefinedが入らないよう確認
  const isValid = await bcrypt.compare(validPassword, user.password);
  if (!isValid) {
    throw new Error("パスワードが正しくありません");
  }

  const cookieStore = await cookies();
  cookieStore.set("user_id", user.id, {
    httpOnly: true, // クライアントサイドからアクセスできないようにする
    secure: process.env.NODE_ENV === "production", // 本番環境ではsecure属性をtrueに設定
    path: "/", // クッキーのパスを設定
    sameSite: "lax", // CSRF対策のため、SameSite属性を設定
  });

  // サインイン後、マイページにリダイレクト
  redirect("/mypage2");
}
