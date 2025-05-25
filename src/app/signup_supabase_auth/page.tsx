import Layout from "@/app/components/layouts/Layout";
import Form from "@/app/components/signup_supabase_auth/Form";
import styles from "./page.module.css";

export const metadata = {
  title: "sign up",
  description: "sign up",
};

export default function SignUp() {
  return (
    <Layout>
      <h1 className={styles.title}>Sign Up</h1>
      <Form />
    </Layout>
  );
}
