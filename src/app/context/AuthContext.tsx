/**
 * AuthContext.tsx
 * ユーザーのアカウント情報・状態を管理するためのコンテキスト
 *
 * ## 提供機能
 * - AuthProvider：アプリ全体にアカウント情報・認証状態（user, isLoading, signIn, signOut, setUser, deleteAccount）を提供するコンポーネント
 * - setCookie / getCookie / deleteCookie：クライアント側のCookie操作ユーティリティ関数
 *
 * ## 利用方法
 * - page.tsxやlayout.tsxなどで<AuthProvider>でラップする
 * - 子コンポーネントでuseContext(AuthContext)を使ってユーザー情報などにアクセスする
 *
 * ## Contextが提供する値（AuthContextType）
 * - user: 現在サインインしているユーザー情報（未サインイン時はnull）
 * - isLoading: 認証状態の読み込み中かどうか(サインインが必要なページが未サインインでも一瞬見えてしまわないように)
 * - signIn(email, password): メールアドレスとパスワードでサインイン処理
 * - signOut(): サインアウト処理
 * - setUser(user | null): 手動でユーザー状態を更新（例：プロフィール編集時など）
 * - deleteAccount(): サインイン中のユーザーアカウントを削除する処理
 */
import bcrypt from "bcryptjs"; // bcryptを使ってパスワードのハッシュ化と照合を行うためにインポート
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ユーザー情報（User型）と、Contextの型（AuthContextType）をインポート
import { User, AuthContextType } from "@/app/types/signin/auth";

// Supabaseのクライアントを作成する関数。これでDBとの通信ができるようになる
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Next.jsのルーターを使うためのフック（クライアントサイドでページ遷移を行うため）
import { useRouter } from "next/navigation";

// Context（共有データの箱）を作成。
// `undefined`を初期値にしておき、必ずProvider内で使用されることを強制する
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookieを扱うためのヘルパー関数を定義
// Cookieにデータを保存する
export const setCookie = (name: string, value: string, days = 7) => {
  // 有効期限（日数）を指定してCookieを設定する
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

// Cookieからデータを取得する
export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, val] = cookie.split("=");
    if (key === name) return decodeURIComponent(val);
  }
  return null;
};

// Cookieを削除する（サインアウト時に使用）
export const deleteCookie = (name: string) => {
  // 有効期限を過去にしてCookieを削除する
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};

// 認証情報をアプリ全体で共有するためのProvider（囲った子コンポーネントにデータを渡す役目）
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ユーザー情報を保存するstate。nullなら「未サインイン」、User型のデータが入っていれば「サインイン中」
  const [user, setUser] = useState<User | null>(null);

  // 認証情報を読み込み中かどうかを表すstate。trueならまだ処理中
  const [isLoading, setIsLoading] = useState(true);

  // Supabaseのクライアントを作成。これでDBへ問い合わせが可能になる
  const supabase = createClientComponentClient();

  // Next.jsのクライアントサイドルーターを取得（リダイレクトなどに使用）
  const router = useRouter();

  // 初回マウント時にCookieからユーザー情報を取得し、あればセットする
  useEffect(() => {
    const loadUserFromCookie = () => {
      // Cookieからユーザー情報を取得（存在すれば文字列として返る）
      const userStr = getCookie("auth_user");

      // ユーザー情報があれば、JSONとしてパースしてstateにセット
      if (userStr) {
        try {
          const parsedUser: User = JSON.parse(userStr);
          setUser(parsedUser); // 正常にパースできればサインイン状態に復元
        } catch (e) {
          console.error("cookieをParseできませんでした。", e);

          // JSON.parseに失敗した場合（不正な形式など）はCookieを削除して安全に処理する
          deleteCookie("auth_user");
        }
      }

      // Cookieのチェックが終わったのでローディング終了
      setIsLoading(false);
    };

    loadUserFromCookie();
  }, []);

  //  認証されていない場合に自動でサインインページへリダイレクトする処理
  useEffect(() => {
    // ローディングが完了していて、かつuserがnullなら未サインイン状態
    if (!isLoading && user === null) {
      // 現在のパスが/signinもしくは/signupでない場合にリダイレクト
      if (window.location.pathname !== "/signin" && window.location.pathname !== "/signup") {
        router.push("/signin"); // サインインページへリダイレクト
      }
    }
  }, [isLoading, user, router]);

  // サインイン処理
  const signIn = async (email: string, password: string) => {
    // Supabaseの"users"テーブルから、指定されたemailのユーザー情報を取得する
    // 取得するカラムはid, email, username, password（ハッシュ化済み）, role
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username, password, role")
      .eq("email", email) // emailが一致するレコードを検索
      .single(); // 結果は単一のレコードのみを期待

    // エラー発生、またはデータが存在しなければ、falseを返してログイン失敗
    if (error || !data) return false;

    // bcrypt.compareを使い、入力されたパスワードと
    // DBに保存されているハッシュ化されたパスワードを比較
    const isValid = await bcrypt.compare(password, data.password);

    // パスワードが一致しなければ、falseを返してログイン失敗
    if (!isValid) return false;

    // パスワードが一致したら、ログイン成功として
    // ユーザー情報をUser型のオブジェクトにまとめる
    const loggedInUser: User = {
      id: data.id,
      email: data.email,
      username: data.username,
      role: data.role,
    };

    // ログイン中のユーザー情報を状態管理（setUser）にセット
    setUser(loggedInUser);

    // クッキーにもユーザー情報をJSON文字列として保存し、
    // セッションの維持や認証に使う
    setCookie("auth_user", JSON.stringify(loggedInUser));

    // ログイン成功を示すtrueを返す
    return true;
  };

  // サインアウト処理
  const signOut = () => {
    setUser(null); // userをnullにすることで「未サインイン状態」に戻す

    // Cookieも削除してセッションを無効化する
    // リロードしてもサインイン情報が復元されないようにするために必要
    deleteCookie("auth_user");
  };

  // アカウント削除処理
  const deleteAccount = async () => {
    // Cookie から user 情報を取得
    const userStr = getCookie("auth_user");

    if (!userStr) {
      console.error("Cookie にユーザー情報が存在しません。");
      return false;
    }

    try {
      const parsedUser: User = JSON.parse(userStr);

      // Supabase でユーザーを削除
      const { error } = await supabase.from("users").delete().eq("id", parsedUser.id);

      if (error) {
        console.error("アカウント削除に失敗しました:", error);
        return false;
      }

      // Cookie と認証状態をリセット
      deleteCookie("auth_user");
      setUser(null);

      // アカウント削除後にサインインページへリダイレクトする処理
      router.push("/signin");

      return true;
    } catch (e) {
      console.error("Cookie のパースに失敗しました:", e);
      deleteCookie("auth_user");
      return false;
    }
  };

  // 子コンポーネントにContextの値（user, isLoading, signIn, signOut, deleteAccount）を提供する
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        setUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// useAuthというカスタムフックを作成
export const useAuth = () => {
  const context = useContext(AuthContext); // Contextから現在の状態を取得

  // Contextが未設定（Providerで囲まれていない）場合はエラーを出す
  if (!context) throw new Error("useAuthを使用する場合はAuthProviderで囲む必要があります。");

  // 正常なContext情報を返す
  return context;
};
