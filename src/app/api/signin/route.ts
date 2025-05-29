/*
 * ハッシュ化されたパスワードを使用してユーザーのサインインを行う
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Zodスキーマの定義
const SignInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 入力値のバリデーション
    const parsed = SignInSchema.safeParse(body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: errorMessages.join(", ") }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Supabaseからユーザーを取得
    const { data: users, error } = await supabase.from("users").select("id, password").eq("email", email).single();

    if (error || !users) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // パスワードの照合
    const isValid = await bcrypt.compare(password, users.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 認証成功時のレスポンス
    return NextResponse.json({ message: "Sign in successful" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: `Internal Server Error. code:${error}` }, { status: 500 });
  }
}
