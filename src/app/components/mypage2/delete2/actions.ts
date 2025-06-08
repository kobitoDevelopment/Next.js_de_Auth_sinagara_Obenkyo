'use server';

// 必要なライブラリとモジュールのインポート
import { cookies } from 'next/headers'; // Next.jsのサーバー側でCookieを操作するためのAPIをインポート
import { createClient } from '@supabase/supabase-js'; // Supabaseクライアントを作成するための関数

// 関数の戻り値の型定義 - TypeScriptで型安全なコードを書くため
export type DeleteAccountResult = {
  success?: boolean; // 処理が成功したかどうかを示すフラグ（オプショナル）
  errors?: string[]; // エラーメッセージの配列（オプショナル）
};

// アカウント削除機能の主要な実装 - 非同期関数として定義
export async function deleteAccount(): Promise<DeleteAccountResult> {
  // Supabaseクライアントをインスタンス化 - データベース操作のため
  // 環境変数から接続情報を取得し、!でnullではないことを断言
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // Supabaseプロジェクトのエンドポイント
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // 匿名認証用のAPIキー
  );

  // Next.jsのcookiesヘルパーを使ってCookieストアにアクセス
  const cookieStore = await cookies();
  // 'user_id'という名前のCookieから値を取得（ログインセッション用）
  // オプショナルチェーン（?.）でCookieが存在しない場合はundefinedを返す
  const userId = cookieStore.get('user_id')?.value;

  // ユーザーIDが取得できなかった場合（ログインしていない場合）
  if (!userId) {
    // エラー情報を含むオブジェクトを返して早期リターン
    return {
      success: false, // 処理失敗を示す
      errors: ['ログインセッションが無効です。再度ログインしてください。'], // ユーザー向けエラーメッセージ
    };
  }

  // 例外処理のためのtry-catchブロック
  try {
    // Supabaseを使ってユーザーデータを削除
    // from('users')でテーブルを指定、delete()で削除操作、eq('id', userId)で条件指定
    const { error } = await supabase.from('users').delete().eq('id', userId);

    // Supabaseから返されたエラーがある場合
    if (error) {
      // 開発者向けにコンソールにエラー詳細を出力
      console.error('アカウント削除エラー:', error);
      // ユーザー向けのエラーメッセージを含む結果オブジェクトを返す
      return {
        success: false, // 処理失敗を示す
        errors: ['アカウントの削除に失敗しました。時間をおいて再度お試しください。'], // ユーザーフレンドリーなエラーメッセージ
      };
    }

    // ここまで来たら削除成功 - セッションCookieを削除して完全にログアウトさせる
    cookieStore.delete('user_id');

    // 成功を示す結果オブジェクトを返す
    // クライアント側でこの成功フラグに基づいてリダイレクトなどの処理が行われる
    return { success: true };
  } catch (error) {
    // 予期せぬ例外が発生した場合の処理（ネットワークエラーなど）
    // 開発者向けにコンソールにエラー詳細を出力
    console.error('予期せぬエラー:', error);
    // 一般的なエラーメッセージを含む結果オブジェクトを返す
    return {
      success: false,
      errors: ['システムエラーが発生しました。管理者にお問い合わせください。'], // より一般的なエラーメッセージ
    };
  }
}

// useFormStateなどのReactフックと連携するためのラッパー関数
// クライアントコンポーネントからインポートして使用するための関数
export const deleteAccountAction = async (): Promise<DeleteAccountResult> => {
  // 内部で実装した関数を呼び出すだけのシンプルなラッパー
  // フレームワークの要件に合わせた形で関数を提供するためのパターン
  return await deleteAccount();
};
