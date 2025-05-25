"use client";

import Layout from "@/app/components/layouts/Layout";
import Form from "@/app/components/mypage_scratch/edit/Form";
import styles from "./page.module.css";

export default function MyPage() {
  return (
    <Layout>
      <h1 className={styles.title}>Edit</h1>
      <Form />
    </Layout>
  );
}
