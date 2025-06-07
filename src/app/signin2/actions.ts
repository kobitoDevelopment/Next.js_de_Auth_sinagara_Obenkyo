'use server';

// Next.jsでサーバー側のCookie操作用
import { cookies } from 'next/headers';
// Supabaseクライアント生成用
import { createClient } from '@supabase/supabase-js';
// パスワードハッシュの比較用
import bcrypt from 'bcryptjs';
// Next.jsでリダイレクト用
import { redirect } from 'next/navigation';
// 型安全なバリデーションライブラリ
import { z } from 'zod';

// サインインの結果型: エラーがある場合はerrors配列で返す
export type SignInResult = { errors?: string[] } | void;

// zodでサインイン用バリデーションスキーマを定義
const signInSchema = z.object({
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
  password: z.string().min(6, { message: 'パスワードは6文字以上で入力してください' }),
});

/**
 * サインイン処理本体
 * @param formData - フォームから送られてきたデータ
 * @returns エラーがあれば { errors: string[] } を返す。正常時はvoid（リダイレクトする）。
 */
export async function signIn(formData: FormData): Promise<SignInResult> {
  // --- ここでsupabaseクライアントを生成する理由 ---
  // ・グローバルで1回だけ生成すると、テストのjest.mockで差し替えが効かず、テストでTypeErrorになるため
  // ・この関数内で都度生成すれば、実行ごとにモックを差し込める（テストしやすい）
  // ・また、リクエスト/レスポンスごとに状態を切り分けやすくなる
  // ※ 本番運用でも十分高速。コネクションプール等は内部で最適化されている
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // フォームから入力値を取得
  const email = formData.get('email');
  const password = formData.get('password');

  // エラーを全て格納する配列
  const errors: string[] = [];

  // 型チェック（nullやstring以外は弾く）
  if (typeof email !== 'string' || typeof password !== 'string') {
    errors.push('フォームの入力が不正です');
    return { errors };
  }

  // 入力値のバリデーション（形式・長さなど）
  const parseResult = signInSchema.safeParse({ email, password });
  if (!parseResult.success) {
    // zodエラーは配列でまとめて追加
    errors.push(...parseResult.error.errors.map((e) => e.message));
  }

  // DB問い合わせとパスワード照合にも備える
  let user: { id: string; email: string; password: string } | null = null;
  let validEmail = email;
  let validPassword = password;

  // zodバリデーションが通っていれば正規化された値を利用
  if (parseResult.success) {
    validEmail = parseResult.data.email;
    validPassword = parseResult.data.password;
  }

  // email・passwordが入力されていればDB問い合わせ
  if (email && password) {
    // メールアドレスでユーザーを検索
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', validEmail)
      .single();
    user = data;

    // ユーザーが見つからなければエラー
    if (error || !user) {
      errors.push('ユーザーが見つかりません');
    } else {
      // パスワードの比較（bcryptでハッシュ照合）
      const isValid = await bcrypt.compare(validPassword, user.password);
      if (!isValid) {
        errors.push('パスワードが正しくありません');
      }
    }
  }

  // エラーがあれば配列で返す
  if (errors.length > 0) {
    return { errors };
  }

  // --- サインイン成功: セッション情報をCookieに保存 ---
  const cookieStore = await cookies();
  cookieStore.set('user_id', user!.id, {
    httpOnly: true, // クライアントJSからアクセス不可
    secure: process.env.NODE_ENV === 'production', // 本番環境のみHTTPS限定
    path: '/', // サイト全体で有効
    sameSite: 'lax', // CSRF対策
  });

  // マイページにリダイレクト
  redirect('/mypage2');
}

/**
 * useActionState用ラッパー
 * ReactのuseActionStateでフォーム送信時に呼び出す用
 */
export const signInAction = async (
  prevState: SignInResult,
  formData: FormData
): Promise<SignInResult> => {
  return await signIn(formData);
};
