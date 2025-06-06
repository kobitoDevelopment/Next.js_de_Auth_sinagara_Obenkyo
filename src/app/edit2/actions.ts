"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const updateSchema = z.object({
  username: z.string().min(1, "ユーザー名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
});

export async function updateProfile(formData: FormData) {
  const username = formData.get("username");
  const email = formData.get("email");
  const current_password = formData.get("current_password");
  const new_password = formData.get("new_password");

  if (typeof username !== "string" || typeof email !== "string" || (current_password !== null && typeof current_password !== "string") || (new_password !== null && typeof new_password !== "string")) {
    throw new Error("フォームの入力が不正です");
  }

  const parseResult = updateSchema.safeParse({
    username,
    email,
    current_password,
    new_password,
  });

  if (!parseResult.success) {
    const errors = parseResult.error.format();
    throw new Error(JSON.stringify(errors));
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    throw new Error("ログイン情報が取得できませんでした");
  }

  // 現在のユーザー情報を取得
  const { data: user, error: getUserError } = await supabase.from("users").select("*").eq("id", userId).single();

  if (getUserError || !user) {
    throw new Error("ユーザーが見つかりません");
  }

  // パスワードの更新条件チェック
  type UpdateUserFields = {
    username: string;
    email: string;
    password?: string;
  };

  const updatedFields: UpdateUserFields = {
    username,
    email,
  };

  if (new_password && new_password.trim() !== "") {
    if (!current_password || current_password.trim() === "") {
      throw new Error("現在のパスワードを入力してください");
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      throw new Error("現在のパスワードが正しくありません");
    }

    const hashed = await bcrypt.hash(new_password, 10);
    updatedFields.password = hashed;
  }

  // 更新実行
  const { error: updateError } = await supabase.from("users").update(updatedFields).eq("id", userId);

  if (updateError) {
    throw new Error("ユーザー情報の更新に失敗しました");
  }

  // クッキーの更新（IDが変わるわけではないが、明示的に再保存）
  cookieStore.set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}
