import { Metadata } from 'next';
import Edit from '@/app/components/mypage2/edit2/Edit';

export const metadata: Metadata = {
  title: 'アカウント情報編集',
  description: 'アカウント情報編集',
};

export default function EditProfilePage() {
  return <Edit />;
}
