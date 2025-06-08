import { Metadata } from 'next';
import SignUp from '@/app/components/signup2/SignUp';

export const metadata: Metadata = {
  title: 'サインアップ',
  description: 'サインアップ',
};

export default function SignUp2Page() {
  return <SignUp />;
}
