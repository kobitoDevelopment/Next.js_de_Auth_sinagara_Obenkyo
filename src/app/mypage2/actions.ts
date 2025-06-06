"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signOut() {
  const cookieStore = await cookies();
  // クッキーを削除するには、有効期限を過去に設定するか、値を空にする
  cookieStore.set({
    name: "user_id", // クッキーの名前を指定
    value: "", // クッキーの値を空にする
    path: "/", // クッキーのパスを設定
    expires: new Date(0), // 過去日付で無効化
    httpOnly: true, // クライアントサイドからアクセスできないようにする
    secure: process.env.NODE_ENV === "production", // 本番環境ではsecure属性をtrueに設定
    sameSite: "lax", // CSRF対策のため、SameSite属性を設定
  });

  // サインアウト後、サインインページにリダイレクト
  redirect("/signin2");
}
