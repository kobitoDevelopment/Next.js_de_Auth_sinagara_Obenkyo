/*
route handlerで作成したsignup/と違い、server actionを使ってsignup処理を作ってみる
*/

import { registerUser } from "./actions";

export const metadata = {
  title: "sign up2",
  description: "sign up2",
};

export default function SignUp2() {
  return (
    <form action={registerUser}>
      <label>
        ユーザー名
        <input type="text" name="username" required />
      </label>
      <label>
        メールアドレス
        <input type="email" name="email" required />
      </label>
      <label>
        ロール
        <select name="role" required>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label>
        パスワード
        <input type="password" name="password" required />
      </label>
      <button type="submit">登録</button>
    </form>
  );
}
