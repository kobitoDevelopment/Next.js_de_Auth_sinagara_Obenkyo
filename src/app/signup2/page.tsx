import { Metadata } from 'next';
import SignUp from '@/app/components/signup2/SignUp';
import PrivacyPolicy from '@/app/components/privacy_policy/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'サインアップ',
  description: 'サインアップ',
};

export default function SignUp2Page() {
  return (
    <>
      <SignUp />
      <PrivacyPolicy />
    </>
  );
}
