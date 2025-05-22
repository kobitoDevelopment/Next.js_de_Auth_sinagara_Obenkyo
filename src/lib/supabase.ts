import { createClient } from "@supabase/supabase-js";

// URLとキーは環境変数から読み込むのがベスト（.env.local に定義）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
