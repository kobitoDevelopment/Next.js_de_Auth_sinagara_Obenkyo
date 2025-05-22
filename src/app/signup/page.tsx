import Layout from "@/app/components/layouts/Layout";
import Form from "@/app/components/signup/Form";

export const metadata = {
  title: "sign up",
  description: "sign up",
};

export default function TestPage() {
  return (
    <Layout>
      <h1>ユーザー登録</h1>
      <Form />
    </Layout>
  );
}
