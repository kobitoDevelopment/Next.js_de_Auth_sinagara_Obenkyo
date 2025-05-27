import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, email, role, currentPassword, newPassword } = body;

    if (!userId || !username || !email || !role || !currentPassword) {
      return NextResponse.json({ error: "必要な情報が不足しています" }, { status: 400 });
    }

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

    // 更新データ準備
    type UpdateData = {
      username: string;
      email: string;
      role: string;
      password?: string;
    };

    const updateData: UpdateData = {
      username,
      email,
      role,
    };

    // 新パスワードが空でなければハッシュ化して設定
    if (newPassword && newPassword.trim() !== "") {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

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
