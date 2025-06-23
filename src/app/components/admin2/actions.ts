'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { User } from '@/lib/auth';

// ページネーション用の型
export type PaginatedUsers = {
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  error?: string;
};

// ユーザー一覧を取得するアクション
export async function getUsers(page = 1, pageSize = 3): Promise<PaginatedUsers> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ログイン中のユーザーがadminかチェック
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return {
      users: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      error: '未ログインです',
    };
  }

  // ログインユーザーの情報を取得
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userError || !currentUser || currentUser.role !== 'admin') {
    return {
      users: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      error: '管理者権限がありません',
    };
  }

  // 全ユーザー数の取得
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return {
      users: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      error: 'ユーザー数の取得に失敗しました',
    };
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // ページネーションでユーザー取得
  // 0からのインデックスなのでページ番号から1を引く
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .range(from, to)
    .order('created_at', { ascending: false });

  if (usersError) {
    return {
      users: [],
      totalCount,
      currentPage: page,
      totalPages,
      error: 'ユーザーの取得に失敗しました',
    };
  }

  return {
    users: users as User[],
    totalCount,
    currentPage: page,
    totalPages,
    error: undefined,
  };
}

// ページを切り替えるアクション（useActionState用）
export async function changePage(
  prevState: PaginatedUsers,
  formData: FormData
): Promise<PaginatedUsers> {
  const page = parseInt(formData.get('page') as string);
  return await getUsers(page);
}
