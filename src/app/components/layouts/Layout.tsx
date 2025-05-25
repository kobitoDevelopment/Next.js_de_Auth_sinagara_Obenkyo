"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContextScratch";
import Header from "@/app/components/common/header/Header";
import Footer from "@/app/components/common/footer/Footer";
import styles from "./Layout.module.css";

export default function TestLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/signin_scratch" || pathname === "/signup_scratch";
  // const isAuthPage = pathname === "/signin_supabase_auth" || pathname === "/signup_supabase_auth";

  const isProtectedPage = !isAuthPage;

  useEffect(() => {
    if (isLoading) return;

    // 未ログインかつ認証が必要なページにいたらサインインへリダイレクト
    if (!user && isProtectedPage) {
      router.push("/signin_scratch");
      // router.push("/signin_supabase_auth");
    }
  }, [user, isLoading, isProtectedPage, router]);

  // ローディング中は何も表示しない
  if (isLoading) return null;

  // 未ログインで保護ページにいる間は描画しない（リダイレクト中）
  if (!user && isProtectedPage) return null;

  return (
    <div className="wrap">
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
