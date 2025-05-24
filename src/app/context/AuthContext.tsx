import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ユーザー情報（User型）と、Contextの型（AuthContextType）をインポート
import { User, AuthContextType } from "@/app/types/signin/auth";

// Supabaseのクライアントを作成する関数。これでDBとの通信ができるようになる
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Context（共有データの箱）を作成。
// `undefined`を初期値にしておき、必ずProvider内で使用されることを強制する
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookieを扱うためのヘルパー関数を定義
// Cookieにデータを保存する
const setCookie = (name: string, value: string, days = 7) => {
  // 有効期限（日数）を指定してCookieを設定する
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

// Cookieからデータを取得する
const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, val] = cookie.split("=");
    if (key === name) return decodeURIComponent(val);
  }
  return null;
};

// Cookieを削除する（サインアウト時に使用）
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};

// 認証情報をアプリ全体で共有するためのProvider（囲った子コンポーネントにデータを渡す役目）
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ユーザー情報を保存するstate。nullなら「未ログイン」、User型のデータが入っていれば「ログイン中」
  const [user, setUser] = useState<User | null>(null);

  // 認証情報を読み込み中かどうかを表すstate。trueならまだ処理中
  const [isLoading, setIsLoading] = useState(true);

  // Supabaseのクライアントを作成。これでDBへ問い合わせが可能になる
  const supabase = createClientComponentClient();

  // 初回マウント時にCookieからユーザー情報を取得し、あればセットする
  useEffect(() => {
    const loadUserFromCookie = () => {
      // Cookieからユーザー情報を取得（存在すれば文字列として返る）
      const userStr = getCookie("auth_user");

      // ユーザー情報があれば、JSONとしてパースしてstateにセット
      if (userStr) {
        try {
          const parsedUser: User = JSON.parse(userStr);
          setUser(parsedUser);
        } catch (e) {
          console.error("cookieをParseできませんでした。", e);
          deleteCookie("auth_user"); // パースできない場合は削除
        }
      }

      // Cookieのチェックが終わったのでローディング終了
      setIsLoading(false);
    };

    loadUserFromCookie();
  }, []);

  // サインイン処理
  const signIn = async (email: string, password: string) => {
    // Supabaseで「users」テーブルから、emailが一致するレコードを1件だけ取得する
    const { data, error } = await supabase
      .from("users") // 「users」はあなたが作成したユーザーテーブルの名前
      .select("id, email, username, password, role") // 必要なカラムだけ指定して取得
      .eq("email", email) // emailが一致するレコードを検索
      .single(); // 結果が1件だけであることを前提とする

    // 取得に失敗した場合（該当ユーザーがいない、エラーなど）はfalseを返して終了
    if (error || !data) return false;

    // パスワードが一致するかどうかを確認
    if (data.password !== password) {
      return false;
    }

    // 認証成功 → ユーザー情報をstateに保存（ログイン状態にする）
    const loggedInUser: User = {
      id: data.id,
      email: data.email,
      username: data.username,
      role: data.role,
    };
    setUser(loggedInUser);

    // --- ユーザー情報をJSON形式でCookieに保存する ---
    // セキュリティに配慮し、保存する情報はパスワードを含めないように注意
    setCookie("auth_user", JSON.stringify(loggedInUser));

    // サインイン成功を呼び出し元に伝える
    return true;
  };

  // サインアウト処理
  const signOut = () => {
    setUser(null); // userをnullにすることで「未ログイン状態」に戻す

    // Cookieも削除してセッションを無効化する
    deleteCookie("auth_user");
  };

  // 子コンポーネントにContextの値（user, isLoading, signIn, signOut）を提供する
  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>;
};

// useAuthというカスタムフックを作成
export const useAuth = () => {
  const context = useContext(AuthContext); // Contextから現在の状態を取得

  // Contextが未設定（Providerで囲まれていない）場合はエラーを出す
  if (!context) throw new Error("useAuthを使用する場合はAuthProviderで囲む必要があります。");

  // 正常なContext情報を返す
  return context;
};
