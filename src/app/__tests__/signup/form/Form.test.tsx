import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Form from "@/app/components/signup/Form";

// Supabaseをモック
const insertMock = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      insert: insertMock,
    }),
  },
}));

describe("SignUp Form", () => {
  beforeEach(() => {
    insertMock.mockReset();
  });

  test("初期表示でフォームが存在する", () => {
    render(<Form />);
    expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("ロール")).toBeInTheDocument();
    expect(screen.getByText("登録")).toBeInTheDocument();
  });

  test("すべて未入力で送信時にバリデーションエラー", async () => {
    render(<Form />);
    fireEvent.click(screen.getByText("登録"));

    await waitFor(() => {
      expect(screen.getByText("ユーザー名は必須です。")).toBeInTheDocument();
      expect(screen.getByText("メールアドレスは必須です。")).toBeInTheDocument();
    });
  });

  test("メールアドレスが無効形式だとエラー表示", async () => {
    render(<Form />);
    fireEvent.change(screen.getByLabelText("ユーザー名"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByText("登録"));

    await waitFor(() => {
      expect(screen.getByText("有効なメールアドレスを入力してください。")).toBeInTheDocument();
    });
  });

  test("ロールが空の場合にエラー（select要素の追加テスト）", async () => {
    render(<Form />);
    fireEvent.change(screen.getByLabelText("ユーザー名"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByLabelText("ロール"), { target: { value: "" } });
    fireEvent.click(screen.getByText("登録"));

    await waitFor(() => {
      expect(screen.getByText("ロールは'user'または'admin'を選択してください。")).toBeInTheDocument();
    });
  });

  test("正しい入力で登録が成功し、フォームがリセットされる", async () => {
    insertMock.mockResolvedValue({ error: null });

    render(<Form />);
    fireEvent.change(screen.getByLabelText("ユーザー名"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByLabelText("ロール"), { target: { value: "user" } });
    fireEvent.click(screen.getByText("登録"));

    await waitFor(() => {
      expect(screen.getByText("登録完了しました！")).toBeInTheDocument();
      expect(screen.getByLabelText("ユーザー名")).toHaveValue("");
      expect(screen.getByLabelText("メールアドレス")).toHaveValue("");
      expect(screen.getByLabelText("ロール")).toHaveValue("user");
    });
  });

  test("Supabaseがエラーを返した場合、エラーメッセージを表示", async () => {
    insertMock.mockResolvedValue({ error: { message: "DBに登録できませんでした" } });

    render(<Form />);
    fireEvent.change(screen.getByLabelText("ユーザー名"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByLabelText("ロール"), { target: { value: "admin" } });
    fireEvent.click(screen.getByText("登録"));

    await waitFor(() => {
      expect(screen.getByText("エラー: DBに登録できませんでした")).toBeInTheDocument();
    });
  });

  test("フォーム入力がstateに正しく反映される", () => {
    render(<Form />);
    const usernameInput = screen.getByLabelText("ユーザー名");
    const emailInput = screen.getByLabelText("メールアドレス");
    const roleSelect = screen.getByLabelText("ロール");

    fireEvent.change(usernameInput, { target: { value: "suzuki" } });
    fireEvent.change(emailInput, { target: { value: "suzuki@example.com" } });
    fireEvent.change(roleSelect, { target: { value: "admin" } });

    expect(usernameInput).toHaveValue("suzuki");
    expect(emailInput).toHaveValue("suzuki@example.com");
    expect(roleSelect).toHaveValue("admin");
  });
});
