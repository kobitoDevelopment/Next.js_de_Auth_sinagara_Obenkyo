/*
 * ハッシュ化されたパスワードを使用してユーザーのサインインを行う
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  try {
    // usersテーブルからemailに合致するユーザーを取得
    const { data: users, error } = await supabase
      .from("users")
      .select("id, password") // パスワードハッシュだけ取得
      .eq("email", email)
      .single();

    if (error || !users) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // bcrypt.compareで生パスワードとハッシュを照合
    const isValid = await bcrypt.compare(password, users.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // ここでトークン発行やセッション設定などを行うことも可能

    return NextResponse.json({ message: "Sign in successful" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: `Internal Server Error. code:${error}` }, { status: 500 });
  }
}
