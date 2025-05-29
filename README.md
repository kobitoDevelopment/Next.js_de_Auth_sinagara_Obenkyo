# Next.js_de_ToDo_sinagara_Obenkyo

## サイトマップ

```
host
└ signup(アカウント登録)
└ signin(サインイン)
└ mypage
  └ edit(アカウント情報編集)
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

## バックエンド(DB)

supabase

## 留意点

supabase_auth が色々やってくれすぎるので users テーブルを自作してアカウント周りを構築しています。
