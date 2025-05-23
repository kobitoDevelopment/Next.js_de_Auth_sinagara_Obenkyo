import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ユーザー情報（User型）と、Contextの型（AuthContextType）をインポート
import { User, AuthContextType } from "@/app/types/signin/auth";

// Supabaseのクライアントを作成する関数。これでDBとの通信ができるようになる
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Context（共有データの箱）を作成。
// `undefined`を初期値にしておき、必ずProvider内で使用されることを強制する
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証情報をアプリ全体で共有するためのProvider（囲った子コンポーネントにデータを渡す役目）
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ユーザー情報を保存するstate。nullなら「未ログイン」、User型のデータが入っていれば「ログイン中」
  const [user, setUser] = useState<User | null>(null);

  // 認証情報を読み込み中かどうかを表すstate。trueならまだ処理中
  const [isLoading, setIsLoading] = useState(true);

  // Supabaseのクライアントを作成。これでDBへ問い合わせが可能になる
  const supabase = createClientComponentClient();

  // 初回マウント時にSupabaseからログイン済みユーザーを取得する処理
  useEffect(() => {
    const fetchUser = async () => {
      // 現在ログイン中のユーザーを取得
      const { data } = await supabase.auth.getUser();

      // ユーザーがいれば、DBからそのユーザーの詳細を取得
      if (data.user) {
        const { data: userData } = await supabase.from("users").select("id, email, username, role").eq("id", data.user.id).single();

        // 取得できた場合はstateにセット
        if (userData) {
          setUser(userData);
        }
      }

      // 認証チェックが完了したので、ローディング終了
      setIsLoading(false);
    };

    fetchUser(); // 上記関数を実行
  }, [supabase]);

  // サインイン処理。メールとパスワードでユーザー情報をDBから取得・確認する
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
    setUser({ id: data.id, email: data.email, username: data.username, role: data.role });

    // サインイン成功を呼び出し元に伝える
    return true;
  };

  // サインアウト処理。ユーザー情報を削除してログアウト状態にする
  const signOut = () => {
    setUser(null); // userをnullにすることで「未ログイン状態」に戻す
  };

  // 子コンポーネントにContextの値（user, isLoading, signIn, signOut）を提供する
  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>;
};

// useAuthというカスタムフックを作成
export const useAuth = () => {
  const context = useContext(AuthContext); // Contextから現在の状態を取得

  // Contextが未設定（Providerで囲まれていない）場合はエラーを出す
  if (!context) throw new Error("useAuth must be used within an AuthProvider");

  // 正常なContext情報を返す
  return context;
};
