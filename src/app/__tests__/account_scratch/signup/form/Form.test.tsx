import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Form from "@/app/components/signup_scratch/Form";

// Supabaseをモック
const insertMock = jest.fn();

// router.push をモック
const pushMock = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      insert: insertMock,
    }),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("SignUp Form", () => {
  beforeEach(() => {
    insertMock.mockReset();
    pushMock.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("初期表示でフォームが存在する", () => {
    render(<Form />);
    expect(screen.getByLabelText("UserName")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument(); // 追加
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  test("すべて未入力で送信時にバリデーションエラー", async () => {
    render(<Form />);
    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByText("ユーザー名は必須です。")).toBeInTheDocument();
      expect(screen.getByText("メールアドレスは必須です。")).toBeInTheDocument();
      expect(screen.getByText("パスワードは必須です。")).toBeInTheDocument(); // 追加
    });
  });

  test("メールアドレスが無効形式だとエラー表示", async () => {
    render(<Form />);
    fireEvent.change(screen.getByLabelText("UserName"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "validPass123" } }); // 追加
    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByText("有効なメールアドレスを入力してください。")).toBeInTheDocument();
    });
  });

  test("ロールが空の場合にエラー（select要素の追加テスト）", async () => {
    render(<Form />);
    fireEvent.change(screen.getByLabelText("UserName"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "validPass123" } }); // 追加
    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByText("ロールは'user'または'admin'を選択してください。")).toBeInTheDocument();
    });
  });

  test("正しい入力で登録が成功し、フォームがリセット & 3秒後に/signin_scratchへ遷移", async () => {
    insertMock.mockResolvedValue({ error: null });

    render(<Form />);
    fireEvent.change(screen.getByLabelText("UserName"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "user" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "validPass123" } }); // 追加
    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByText("succeeded")).toBeInTheDocument();
      expect(screen.getByLabelText("UserName")).toHaveValue("");
      expect(screen.getByLabelText("Email")).toHaveValue("");
      expect(screen.getByLabelText("Role")).toHaveValue("user");
      expect(screen.getByLabelText("Password")).toHaveValue(""); // 追加
    });

    // タイマーを進める
    jest.advanceTimersByTime(3000);
    expect(pushMock).toHaveBeenCalledWith("/signin_scratch");
  });

  test("Supabaseがエラーを返した場合、エラーメッセージを表示", async () => {
    insertMock.mockResolvedValue({ error: { message: "登録に失敗しました" } });

    render(<Form />);
    fireEvent.change(screen.getByLabelText("UserName"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "user" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "validPass123" } }); // 追加
    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByText("エラー: 登録に失敗しました")).toBeInTheDocument();
    });

    // router.push は呼び出されない
    jest.advanceTimersByTime(3000);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
