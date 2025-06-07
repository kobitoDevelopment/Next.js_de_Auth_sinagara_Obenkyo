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

## Authまわり
supabase_auth が色々やってくれすぎるので users テーブルを自作してアカウント周りを構築しています。

## 使用していないディレクトリ
DBへのアクセスをroute handler(fetch)で行うかserver actions(form)で行うかを両方試したくて以下のディレクトリを作成しています。
### route handler(使用していない)
signin/
signup/
mypage/
mypage/edit

### server actions(使用している)
signin2/
signup2/
mypage2/
mypage2/edit2/

route handlerを使用する場合はcomponents/layout.tsxでサインイン状態判定+リダイレクトを実施しており、
server actionsを使用する場合はsrc/middleware.tsでサインイン状態判定+リダイレクトを実施しています。
