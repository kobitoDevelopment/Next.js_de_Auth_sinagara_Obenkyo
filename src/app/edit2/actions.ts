"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { z } from "zod";

// --- バリデーションスキーマ定義（zod） ---
const updateSchema = z.object({
  username: z.string().min(1, "ユーザー名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
});

// --- 戻り値型: エラーがあれば配列、正常時はvoid ---
export type UpdateProfileResult = { errors?: string[] } | void;

/**
 * プロフィール編集処理
 * 入力フォームデータ
 * エラー配列 or 正常時はvoid
 */
export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // 入力値取得
  const username = formData.get("username");
  const email = formData.get("email");
  const current_password = formData.get("current_password");
  const new_password = formData.get("new_password");

  // --- 型チェック ---
  if (typeof username !== "string" || typeof email !== "string" || (current_password !== null && typeof current_password !== "string") || (new_password !== null && typeof new_password !== "string")) {
    return { errors: ["フォームの入力が不正です"] };
  }

  // --- バリデーション ---
  const parseResult = updateSchema.safeParse({
    username,
    email,
    current_password,
    new_password,
  });

  // バリデーションエラーはすべてエラー配列に追加
  const errors: string[] = [];
  if (!parseResult.success) {
    errors.push(...parseResult.error.errors.map((e) => e.message));
  }

  // --- 認証情報取得（クッキーからユーザーID） ---
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    errors.push("ログイン情報が取得できませんでした");
  }

  // --- DBから自分自身のユーザー情報取得 ---
  interface User {
    id: string;
    username: string;
    email: string;
    password: string;
  }

  let user: User | null = null;
  if (userId) {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
    user = data;
    if (error || !user) {
      errors.push("ユーザーが見つかりません");
    }
  }

  // --- パスワード変更に関するチェック（ユーザー情報取得前に実行するよう修正） ---
  if (new_password && new_password.trim() !== "" && new_password.length >= 6) {
    // 新しいパスワード入力がある場合は現在のパスワード必須
    if (!current_password || current_password.trim() === "") {
      errors.push("現在のパスワードを入力してください");
    } else if (user) {
      // 現在のパスワードが一致するか検証
      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        errors.push("現在のパスワードが正しくありません");
      }
    }
  }

  // --- メールアドレス・ユーザー名の重複チェック ---
  // 自分以外ですでに存在する場合はエラー追加
  let emailUsers: { id: string }[] = [];
  let usernameUsers: { id: string }[] = [];
  if (userId && typeof email === "string") {
    const { data: _emailUsers, error: emailCheckError } = await supabase.from("users").select("id").eq("email", email).neq("id", userId);
    if (!emailCheckError && Array.isArray(_emailUsers)) {
      emailUsers = _emailUsers;
      if (emailUsers.length > 0) {
        errors.push("このメールアドレスは既に登録されています");
      }
    }
  }
  if (userId && typeof username === "string") {
    const { data: _usernameUsers, error: usernameCheckError } = await supabase.from("users").select("id").eq("username", username).neq("id", userId);
    if (!usernameCheckError && Array.isArray(_usernameUsers)) {
      usernameUsers = _usernameUsers;
      if (usernameUsers.length > 0) {
        errors.push("このユーザー名は既に登録されています");
      }
    }
  }

  // --- パスワードのバリデーション（zodではoptionalなので手動チェック） ---
  // 6文字未満ならエラー追加
  if (new_password && new_password.trim() !== "" && new_password.length < 6) {
    errors.push("パスワードは6文字以上で入力してください");
  }

  // --- エラーがあれば全て返す ---
  if (errors.length > 0) {
    return { errors };
  }

  // --- ユーザー情報更新処理 ---
  const updatedFields: { username: string; email: string; password?: string } = {
    username,
    email,
  };

  // パスワード変更があれば追加
  if (new_password && new_password.trim() !== "" && new_password.length >= 6) {
    const hashed = await bcrypt.hash(new_password, 10);
    updatedFields.password = hashed;
  }

  // ユーザー情報更新
  if (userId) {
    const { error: updateError } = await supabase.from("users").update(updatedFields).eq("id", userId);

    if (updateError) {
      // DBから返されたエラー詳細があればすべて表示
      if (updateError.details && typeof updateError.details === "string" && updateError.details.trim() !== "") {
        errors.push(updateError.details);
        return { errors };
      }
      if (updateError.message && typeof updateError.message === "string" && updateError.message.trim() !== "") {
        errors.push(updateError.message);
        return { errors };
      }
      return { errors: ["ユーザー情報の更新に失敗しました"] };
    }

    // クッキーの再保存（セキュリティのため明示的に再設定）
    if (user) {
      cookieStore.set("user_id", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });
    }
  }
}

/**
 * useActionState用のラッパー
 */
export const updateProfileAction = async (prevState: UpdateProfileResult, formData: FormData): Promise<UpdateProfileResult> => {
  return await updateProfile(formData);
};
