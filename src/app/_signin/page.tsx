import Layout from '@/app/components/layouts/Layout';
import Form from '@/app/components/signin/Form';
import styles from './page.module.css';

export const metadata = {
  title: 'sign in',
  description: 'sign in',
};

export default function SignIn() {
  return (
    <Layout>
      <h1 className={styles.title}>Sign In</h1>
      <Form />
    </Layout>
  );
}
