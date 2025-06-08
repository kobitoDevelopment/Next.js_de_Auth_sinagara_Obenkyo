'use server';

// Supabaseクライアント作成用
import { createClient } from '@supabase/supabase-js';
// Next.jsのリダイレクト用
import { redirect } from 'next/navigation';
// パスワードハッシュ化用
import bcrypt from 'bcryptjs';
// 型安全バリデーション
import { z } from 'zod';

// --- 入力値バリデーション用のZodスキーマを定義 ---
// 必須チェックや形式チェックのエラーメッセージもここで定義
const RegisterSchema = z.object({
  username: z.string().min(1, 'ユーザー名は必須です'),
  email: z.string().email('メールアドレスの形式が正しくありません'),
  role: z.string().min(1, 'ロールは必須です'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

// --- 戻り値型: エラーがあれば配列で返す、正常時はvoidでリダイレクト ---
export type RegisterResult = { errors?: string[] } | void;

/**
 * ユーザー登録処理
 * @param formData - フォーム送信データ
 * @returns エラー配列 or 正常時はvoid
 */
export async function registerUser(formData: FormData): Promise<RegisterResult> {
  // --- Supabaseクライアントを関数内で生成 ---
  // ・テスト時のモック差し替えのためグローバルではなくlocal生成
  // ・本番でも都度生成で十分高速・安全
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- フォームデータをオブジェクト化 ---
  // ・FormData.getで得た値をstring化し、空欄は""に
  const rawData = {
    username: formData.get('username')?.toString() || '',
    email: formData.get('email')?.toString() || '',
    role: formData.get('role')?.toString() || '',
    password: formData.get('password')?.toString() || '',
  };

  // --- 1. バリデーションエラーをすべて集める ---
  // ・Zodでチェックし、エラーはすべてerrors配列へ
  const parsed = RegisterSchema.safeParse(rawData);
  const errors: string[] = [];
  if (!parsed.success) {
    errors.push(...parsed.error.errors.map((e) => e.message));
  }

  // --- 2. Supabaseで重複チェック（バリデーションエラーがあってもDBは問い合わせ） ---
  // ・メールとユーザー名が入力された場合のみ問い合わせ
  const username = rawData.username;
  const email = rawData.email;
  const password = rawData.password;
  const role = rawData.role;

  const checkEmail = email.length > 0;
  const checkUsername = username.length > 0;

  // DB問い合わせチェーンを配列で構築（空欄なら空配列で返す）
  const checkers = [];
  if (checkEmail) checkers.push(supabase.from('users').select('id').eq('email', email));
  else checkers.push(Promise.resolve({ data: [], error: null }));

  if (checkUsername) checkers.push(supabase.from('users').select('id').eq('username', username));
  else checkers.push(Promise.resolve({ data: [], error: null }));

  // DB問い合わせを並列で実行
  const dbCheckResults = await Promise.all(checkers);

  // --- undefined安全化でTypeErrorを防止 ---
  const emailUsers = dbCheckResults[0]?.data ?? [];
  const usernameUsers = dbCheckResults[1]?.data ?? [];

  // --- 重複があればエラーに追加 ---
  if (checkEmail && emailUsers.length > 0) {
    errors.push('このメールアドレスは既に登録されています');
  }
  if (checkUsername && usernameUsers.length > 0) {
    errors.push('このユーザー名は既に登録されています');
  }

  // --- 3. 問題なければユーザーをinsert ---
  if (errors.length === 0) {
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    // Supabaseにユーザー情報を登録
    const { error } = await supabase.from('users').insert([
      {
        username,
        email,
        role,
        password: hashedPassword,
      },
    ]);
    // DBエラーがあればエラー配列に追加
    if (error) {
      errors.push('ユーザー登録に失敗しました');
    }
  }

  // --- 4. エラーが1つでもあれば配列で返す ---
  if (errors.length > 0) {
    return { errors };
  }

  // --- 5. 正常時はサインイン画面にリダイレクト ---
  redirect('/signin2');
}

// --- useActionState用ラッパー（Reactでフォーム状態管理する際に使用） ---
export const registerUserAction = async (
  prevState: RegisterResult,
  formData: FormData
): Promise<RegisterResult> => {
  return await registerUser(formData);
};
