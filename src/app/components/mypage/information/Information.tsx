"use client";

import { useAuth } from "@/app/context/AuthContext";
import styles from "./Information.module.css";

export default function MyPage() {
  const { user } = useAuth(); // AuthContextからuser情報を取得

  return (
    <dl className={styles.information}>
      {/* ユーザー名 */}
      <div className={styles.informationRow}>
        <dt className={styles.informationTerm}>UserName</dt>
        <dd className={styles.informationDescription}>{user?.username}</dd>
      </div>
      {/* ロール */}
      <div className={styles.informationRow}>
        <dt className={styles.informationTerm}>Role</dt>
        <dd className={styles.informationDescription}>{user?.role}</dd>
      </div>
    </dl>
  );
}
