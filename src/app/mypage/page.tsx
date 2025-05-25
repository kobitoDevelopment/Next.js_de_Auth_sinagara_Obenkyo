"use client";

import Layout from "@/app/components/layouts/Layout";
import Information from "@/app/components/mypage/information/Information";
import Signout from "@/app/components/mypage/signout/Signout";
import Link from "next/link";
import styles from "./page.module.css";

export default function MyPage() {
  return (
    <Layout>
      <h1 className={styles.title}>My Page</h1>
      <Information />
      <Link href="/mypage/edit" className={styles.edit}>
        Edit
      </Link>
      <Signout />
    </Layout>
  );
}
