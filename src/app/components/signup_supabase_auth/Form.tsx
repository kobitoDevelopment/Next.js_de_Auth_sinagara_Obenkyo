"use client"; // Next.jsのApp Routerでクライアントコンポーネントとして動作させる指示

import { useState } from "react"; // ReactのuseStateフックをインポート
import { supabase } from "@/lib/supabase"; // Supabaseクライアント（認証など用）をインポート
import { useRouter } from "next/navigation"; // Next.jsのルーターをインポート（ページ遷移用）
import { FormData, FormErrors } from "@/app/types/form/form"; // 型定義をインポート（型安全のため）
import styles from "./Form.module.css"; // CSSモジュールをインポート（スタイル適用用）

// メールの簡易バリデーション。@が含まれていれば空文字（エラーなし）、なければエラーメッセージを返す
const validateEmail = (email: string) => {
  if (email.includes("@")) {
    return "";
  } else {
    return "正しいメールアドレスを入力してください";
  }
};

// パスワードの簡易バリデーション。6文字以上なら空文字、未満ならエラーメッセージ
const validatePassword = (pw: string) => {
  if (pw.length >= 6) {
    return "";
  } else {
    return "パスワードは6文字以上必要です";
  }
};

// ユーザー名が空でなければエラーなし、空ならエラーメッセージ
const validateUsername = (name: string) => {
  const trimmed = name.trim();
  if (trimmed) {
    return "";
  } else {
    return "ユーザー名を入力してください";
  }
};

// roleが"user"か"admin"ならエラーなし、それ以外はエラーメッセージ
const validateRole = (role: string) => {
  if (["user", "admin"].includes(role)) {
    return "";
  } else {
    return "役割を選択してください";
  }
};

// フォームコンポーネントのメイン関数
export default function Form() {
  const router = useRouter(); // ページ遷移を行うためのルーターを初期化

  // フォームの入力値を管理する状態（初期値は空文字など）
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    username: "",
    role: "user", // デフォルトの役割は"user"
  });

  // 各フォーム項目のエラーメッセージを管理する状態（初期は空文字）
  const [errors, setErrors] = useState<FormErrors>({
    email: "",
    password: "",
    username: "",
    role: "",
  });

  // 処理の成功や失敗メッセージを表示するための状態
  const [message, setMessage] = useState("");

  // 項目名と値を受け取り、それぞれに応じたバリデーション関数を呼ぶ関数
  const validate = (name: string, value: string): string => {
    if (name === "email") {
      return validateEmail(value);
    }

    if (name === "password") {
      return validatePassword(value);
    }

    if (name === "username") {
      return validateUsername(value);
    }

    if (name === "role") {
      return validateRole(value);
    }

    // 想定外の名前ならエラーなし
    return "";
  };

  // フォームの入力が変わったときに呼ばれる関数
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; // 変更されたフォーム要素のname属性とvalue属性を取得

    // formDataの対応するプロパティだけ更新（他はそのまま保持）
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 入力値のバリデーションを実行し、その結果をerrorsにセットしてエラー表示を制御
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  // フォーム送信時に呼ばれる関数（非同期処理）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // デフォルトのページリロードを防ぐ

    // 全フォーム項目に対してバリデーションを実行し、その結果をまとめてerrorsにセット
    const newErrors: FormErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      username: validateUsername(formData.username),
      role: validateRole(formData.role),
    };
    setErrors(newErrors);

    // エラーが一つでもあれば送信処理は中断し、メッセージをセットしてフォームに戻る
    if (Object.values(newErrors).some((err) => err !== "")) {
      setMessage("入力に誤りがあります。");
      return;
    }

    // Supabaseの認証APIを使って新規登録を行う
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
          role: formData.role,
        },
      },
    });

    // 登録に失敗した場合はエラーメッセージを表示して終了
    if (error) {
      setMessage(`エラー: ${error.message}`);
      return;
    }

    // 登録成功したら成功メッセージをセット（確認メール送信もSupabaseが自動で行う）
    setMessage("登録に成功しました！確認メールを送信しました。");

    // フォームを初期化して空に戻す
    setFormData({ email: "", password: "", username: "", role: "user" });
    setErrors({ email: "", password: "", username: "", role: "" });

    // 3秒後にログインページへリダイレクト（任意の遷移先に変更可能）
    setTimeout(() => router.push("/signin_supabase_auth"), 3000);
  };

  // 実際のフォームの描画部分
  return (
    <form onSubmit={handleSubmit}>
      {/* dlで定義リストを作り、フォーム項目を行ごとに表示 */}
      <dl className={styles.formItems}>
        {/* ユーザー名入力欄 */}
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            {/* ラベルと入力を関連付けるためhtmlForを指定 */}
            <label className={styles.formItemsLabel} htmlFor="username">
              UserName
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            {/* 入力欄。valueはstateで管理、変更時はhandleChange呼び出し */}
            <input className={styles.formItemsInput} id="username" name="username" type="text" value={formData.username} onChange={handleChange} />
            {errors.username && <strong className={styles.error}>{errors.username}</strong>}
          </dd>
        </div>

        {/* Email入力欄 */}
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="email">
              Email
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <input className={styles.formItemsInput} id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            {errors.email && <strong className={styles.error}>{errors.email}</strong>}
          </dd>
        </div>

        {/* Role選択欄 */}
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="role">
              Role
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <select id="role" name="role" className={styles.formItemsSelect} value={formData.role} onChange={handleChange}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            {errors.role && <strong className={styles.error}>{errors.role}</strong>}
          </dd>
        </div>

        {/* パスワード入力欄 */}
        <div className={styles.formItemsRow}>
          <dt className={styles.formItemsTerm}>
            <label className={styles.formItemsLabel} htmlFor="password">
              Password
            </label>
          </dt>
          <dd className={styles.formItemsDescription}>
            <input
              className={styles.formItemsInput}
              id="password"
              name="password"
              type="password"
              autoComplete="new-password" // 新規登録時の自動補完防止用
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <strong className={styles.error}>{errors.password}</strong>}
          </dd>
        </div>
      </dl>

      {/* 送信ボタン */}
      <button className={styles.submitButton} type="submit">
        Register
      </button>

      {/* メッセージ表示（成功時・エラー時） */}
      {message && <strong className={styles.succeeded}>{message}</strong>}
    </form>
  );
}
