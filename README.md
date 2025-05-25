# Next.js_de_ToDo_sinagara_Obenkyo
## サイトマップ
```
host  
└ signup_scratch
└ signin_scratch
└ mypage 
  └ edit  
```

## 開発環境起動用コマンド
1. 
```
npm install
```
```
npm run dev
```

## テスト実行用コマンド
```
npx jest
```

## 留意点
supabase_authが色々やってくれすぎるのでusersテーブルを自作して構築しています。  
パスワードをハッシュ化してテーブルに保存したいが、フロントエンドでハッシュ化したくないので一旦平文のまま送信しています。(実際にバックエンドのAPIに送信するときはAPI側でハッシュ化するため、フロントエンド練習用をテーマにしたこのリポジトリでは平文のままでいいかぁ〜という心持ち)
