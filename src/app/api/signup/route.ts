/*
 * クライアント側でパスワードのハッシュ化を行なってしまうと、ハッシュ化されたパスワードがネットワーク上に平文で送信されることになるため
 * サーバー側でパスワードをハッシュ化する。
 */

// zod
import { z } from 'zod';
// Next.jsのAPIルートでレスポンスを返すためのユーティリティ
import { NextResponse } from 'next/server';

// Supabaseクライアントをインポート（DB操作に使用）
import { supabase } from '@/lib/supabase';

// パスワードを安全に保存するためのハッシュ化ライブラリ
import bcrypt from 'bcryptjs';

// バリデーションのためのスキーマを定義
const signupSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// POSTリクエストを受け取ったときに実行される非同期関数
export async function POST(req: Request) {
  // リクエストのJSONボディを取得
  const body = await req.json();

  // Zodスキーマでバリデーションを実行
  const parsed = signupSchema.safeParse(body);

  // バリデーションに失敗した場合はエラーを返す
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // バリデーション済みのデータを取得
  const { username, email, role, password } = parsed.data;

  try {
    // パスワードをハッシュ化（10はソルトのコスト。大きいほど計算が重くなるが安全性が上がる）
    const hashedPassword = await bcrypt.hash(password, 10);

    // Supabaseのusersテーブルに新しいユーザーを挿入
    const { error } = await supabase.from('users').insert([
      {
        username, // ユーザー名
        email, // メールアドレス
        role, // ユーザーの役割（例: admin, userなど）
        password: hashedPassword, // ハッシュ化されたパスワードを保存
      },
    ]);

    // Supabaseからエラーが返ってきた場合は500エラーとしてクライアントに返す
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 成功時に200ステータスでメッセージを返す
    return NextResponse.json({ message: 'User registered successfully' }, { status: 200 });
  } catch (error) {
    // 予期せぬエラー（例：ハッシュ化処理やDB接続エラー）が発生した場合の処理
    return NextResponse.json({ error: `Internal Server Error. code:${error}` }, { status: 500 });
  }
}
