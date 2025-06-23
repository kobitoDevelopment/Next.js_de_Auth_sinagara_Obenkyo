import { Metadata } from 'next';
import Admin from '@/app/components/admin2/Admin';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: '管理者用画面',
  description: '管理者用画面',
};

export default async function AdminPage() {
  // サーバーコンポーネントでログインユーザーを取得して管理者かチェック
  const user = await getCurrentUser();

  // 未ログインまたは管理者でない場合はリダイレクト
  if (!user || user.role !== 'admin') {
    redirect('/'); // または適切なページへリダイレクト
  }

  return <Admin />;
}
