// Supabase クライアントを作成するための関数を読み込む
import { createClient } from "@supabase/supabase-js";

// .env.localに記述した環境変数から Supabase のプロジェクトURLと匿名キー（公開用APIキー）を読み込む
// ・セキュリティ上、これらのキーはコード内に直接書かず、バージョン管理対象から除外する(.envはgitignoreに追加しておく)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Supabase クライアントを初期化してエクスポート
// これを使うことで、アプリ全体から Supabase の機能（例：DB操作、認証、ストレージ）が利用できるようになる
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
