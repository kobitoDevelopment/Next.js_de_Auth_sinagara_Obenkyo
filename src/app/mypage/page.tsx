"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import Layout from "@/app/components/layouts/Layout";
import styles from "./page.module.css";

export default function MyPage() {
  const { user } = useAuth();

  return (
    <Layout>
      <h1 className={styles.formItemsDescription}>マイページ</h1>
      <p>ユーザー名: {user?.username}</p>
      <p>役割（role）: {user?.role}</p>
    </Layout>
  );
}
