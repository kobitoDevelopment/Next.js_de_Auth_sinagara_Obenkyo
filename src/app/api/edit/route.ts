import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { z } from "zod";

// バリデーションスキーマ（全部必須。newPasswordも必須で空不可）
const schema = z.object({
  userId: z.number(),
  username: z.string().min(1, "usernameは必須です"),
  email: z.string().email("emailの形式が不正です"),
  role: z.string().min(1, "roleは必須です"),
  currentPassword: z.string().min(1, "現在のパスワードは必須です"),
  newPassword: z.string().min(1, "新しいパスワードは必須です"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      // エラー内容を返す
      return NextResponse.json({ error: parsed.error.errors.map((e) => e.message).join(", ") }, { status: 400 });
    }

    const { userId, username, email, role, currentPassword, newPassword } = parsed.data;

    // 現在のパスワードのハッシュをDBから取得
    const { data: userData, error: fetchError } = await supabase.from("users").select("password").eq("id", userId).single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: "ユーザー情報の取得に失敗しました" }, { status: 500 });
    }

    // 現在のパスワード（平文）とDB上のハッシュを比較
    const match = await bcrypt.compare(currentPassword, userData.password);
    if (!match) {
      return NextResponse.json({ error: "現在のパスワードが間違っています" }, { status: 401 });
    }

    // 新パスワードは必須なので空文字チェック不要。必ずハッシュ化して更新
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新データ
    const updateData = {
      username,
      email,
      role,
      password: hashedPassword,
    };

    // DB更新
    const { error: updateError } = await supabase.from("users").update(updateData).eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 更新後のユーザー情報取得（passwordは含めない）
    const { data: updatedUser, error: updatedUserError } = await supabase.from("users").select("id, username, email, role").eq("id", userId).single();

    if (updatedUserError || !updatedUser) {
      return NextResponse.json({ error: "ユーザー情報の再取得に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: `Internal Server Error. code:${error}` }, { status: 500 });
  }
}
