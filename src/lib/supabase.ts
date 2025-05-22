import { createClient } from "@supabase/supabase-js";

// URLとキーは環境変数から読み込む(絶対にソース内に残さない&.envはgitに追加しない)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
