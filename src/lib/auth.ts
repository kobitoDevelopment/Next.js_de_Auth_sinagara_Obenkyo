import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// ユーザー型定義
export type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

// 現在のログインユーザーを取得する関数
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error || !data) {
    return null;
  }

  return data as User;
}
