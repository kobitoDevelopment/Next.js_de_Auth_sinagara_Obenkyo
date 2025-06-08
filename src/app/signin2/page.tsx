import { Metadata } from 'next';
import SignIn from '@/app/components/signin2/SignIn';

export const metadata: Metadata = {
  title: 'サインイン',
  description: 'サインイン',
};

export default function SignIn2Page() {
  return <SignIn />;
}
