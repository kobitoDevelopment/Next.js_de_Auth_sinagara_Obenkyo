import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react"; // actをインポート（非同期処理のテスト用）
import Form from "@/app/components/signup_supabase_auth/Form";
import { supabase } from "@/lib/supabase"; // Supabaseのクライアント（認証API等）
import { useRouter } from "next/navigation";

// supabase.auth.signUpをモックに置き換え（実際のAPIコールしないようにする）
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(), // jestのモック関数に置換
    },
  },
}));

// next/navigationのuseRouterをモックに置換
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// テストグループ「Form component」の開始
describe("Form component", () => {
  // ページ遷移用のpush関数のモック
  const mockPush = jest.fn();

  // 各テストの前に実行されるセットアップ処理
  beforeEach(() => {
    // タイマー処理をjestのモックタイマーに置き換える（setTimeoutなどを制御可能に）
    jest.useFakeTimers();
    // すべてのモック関数の呼び出し記録をリセット
    jest.clearAllMocks();
    // useRouterが返す値をセット（push関数にmockPushをセット）
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  // 初期表示が正しいことをテスト
  it("初期表示が正しい", () => {
    // Formコンポーネントを仮想DOMに描画
    render(<Form />);
    // UserNameの入力欄が空文字であることを期待
    expect(screen.getByLabelText("UserName")).toHaveValue("");
    // Emailの入力欄が空文字であることを期待
    expect(screen.getByLabelText("Email")).toHaveValue("");
    // Roleのselectが初期値"user"を選択していることを期待
    expect(screen.getByLabelText("Role")).toHaveValue("user");
    // Passwordの入力欄が空文字であることを期待
    expect(screen.getByLabelText("Password")).toHaveValue("");
    // 「入力に誤りがあります。」というテキストが存在しないことを期待（エラー表示なし）
    expect(screen.queryByText("入力に誤りがあります。")).toBeNull();
  });

  // バリデーションエラーが正しく表示されるかのテスト
  it("バリデーションエラーが表示される", async () => {
    render(<Form />);

    // UserNameに空白のみの値を入力（バリデーションエラーを発生させるため）
    fireEvent.change(screen.getByLabelText("UserName"), { target: { value: " " } });
    // Emailに不正な文字列を入力
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalidemail" } });
    // Passwordに短すぎる値を入力（3文字）
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123" } });
    // Roleに存在しない値を入力（無効な値）
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "invalidrole" } });

    // Registerボタンをクリックしてフォーム送信をトリガー
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    // 非同期で各バリデーションエラーメッセージが画面に表示されることを期待
    expect(await screen.findByText("ユーザー名を入力してください")).toBeInTheDocument();
    expect(await screen.findByText("正しいメールアドレスを入力してください")).toBeInTheDocument();
    expect(await screen.findByText("パスワードは6文字以上必要です")).toBeInTheDocument();
    expect(await screen.findByText("役割を選択してください")).toBeInTheDocument();

    // バリデーションエラーがあるので、supabase.auth.signUpは呼ばれていないことを確認
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  // サインアップ成功時の挙動テスト
  it("サインアップ成功時にメッセージ表示とリダイレクトが呼ばれる", async () => {
    // supabase.auth.signUpのモックに成功（error:null）を返すように設定
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });

    render(<Form />);

    // 各入力欄に正常な値を入力
    fireEvent.change(screen.getByLabelText("UserName"), { target: { value: "testuser" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "user" } });

    // Registerボタンをクリックし送信
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    // supabase.auth.signUpが正しいパラメータで呼ばれるのを待つ
    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          data: {
            username: "testuser",
            role: "user",
          },
        },
      });
      // 成功メッセージが画面に表示されることを期待
      expect(screen.getByText("登録に成功しました！確認メールを送信しました。")).toBeInTheDocument();
    });

    // タイマーを3秒進める（3秒後のリダイレクト処理を実行）
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // 3秒後にmockPush("/signin")が呼ばれることを待つ（ページ遷移確認）
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/signin_supabase_auth");
    });
  });

  // サインアップ失敗時のエラーメッセージ表示テスト
  it("サインアップエラー時にエラーメッセージを表示する", async () => {
    // signUpのモックにエラーオブジェクトを返すように設定（メール重複エラー）
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      error: { message: "既に登録済みのメールアドレスです" },
    });

    render(<Form />);

    // 入力欄に値をセット（重複メールのパターン）
    fireEvent.change(screen.getByLabelText("UserName"), { target: { value: "testuser" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "duplicate@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "user" } });

    // Registerボタンをクリックし送信
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    // エラーメッセージが画面に表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText("エラー: 既に登録済みのメールアドレスです")).toBeInTheDocument();
    });
  });
});
