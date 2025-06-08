import { Metadata } from 'next';
import MyPage from '@/app/components/mypage2/MyPage';

export const metadata: Metadata = {
  title: 'マイページ',
  description: 'マイページ',
};

export default function SignUp2Page() {
  return <MyPage />;
}
