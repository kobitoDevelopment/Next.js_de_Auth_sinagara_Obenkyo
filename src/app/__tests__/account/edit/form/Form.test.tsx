import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Form from "@/app/components/mypage/edit/Form";
import { useAuth, setCookie } from "@/app/context/AuthContext";
import "@testing-library/jest-dom";
import fetchMock from "jest-fetch-mock"; // jest-fetch-mockを使用してAPIモックを作成

// jest-fetch-mockの設定
fetchMock.enableMocks();

// AuthContextのモック
jest.mock("@/app/context/AuthContext", () => ({
  useAuth: jest.fn(),
  setCookie: jest.fn(),
}));

// Supabaseのモック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                id: 1,
                username: "taro",
                email: "taro@example.com",
                role: "user",
              },
              error: null,
            }),
          }),
        }),
      }),
    }),
  },
}));

describe("Form", () => {
  const setUserMock = jest.fn(); // setUserのモック

  beforeEach(() => {
    jest.clearAllMocks(); // すべてのモックをクリア
    fetchMock.resetMocks(); // fetchMockのモックをリセット

    // useAuthのモックを設定
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        username: "taro",
        email: "taro@example.com",
      },
      setUser: setUserMock,
    });
  });

  test("初期レンダリングでフォーム項目が表示される", async () => {
    render(<Form />);

    await waitFor(() => {
      expect(screen.getByLabelText("Username")).toHaveValue("taro");
      expect(screen.getByLabelText("Email")).toHaveValue("taro@example.com");
      expect(screen.getByLabelText("Role")).toBeInTheDocument();
    });
  });

  test("バリデーションエラーが表示される（空で送信）", async () => {
    render(<Form />);

    await waitFor(() => screen.getByLabelText("Username"));

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: " " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "" } });

    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(screen.getByText("必要な情報が不足しています")).toBeInTheDocument();
    });
  });

  test("正しい入力でAPIに送信され成功メッセージ表示", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ user: { id: 1, username: "taro", email: "taro@example.com", role: "admin" } }), { status: 200 });

    render(<Form />);

    await waitFor(() => screen.getByLabelText("Username"));

    // フォームの値を変更
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "currentPass123" } });
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "newPass123" } });

    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      // 成功メッセージが表示されることを確認
      expect(screen.getByText("更新に成功しました")).toBeInTheDocument();

      // ContextのsetUserが呼ばれていることを確認
      expect(setUserMock).toHaveBeenCalledWith({
        id: 1,
        username: "taro",
        email: "taro@example.com",
        role: "admin",
      });

      // Cookie設定が呼ばれていることを確認
      expect(setCookie).toHaveBeenCalledWith(
        "auth_user",
        JSON.stringify({
          id: 1,
          username: "taro",
          email: "taro@example.com",
          role: "admin",
        })
      );

      // currentPassword, newPasswordがクリアされていること
      expect(screen.getByLabelText("Current Password")).toHaveValue("");
      expect(screen.getByLabelText("New Password")).toHaveValue("");
    });
  });

  test("APIエラー時にエラーメッセージが表示される", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ error: "更新に失敗しました" }), { status: 500 });

    render(<Form />);

    await waitFor(() => screen.getByLabelText("Username"));

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "taro" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "user" } });
    fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "currentPass123" } });
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "newPass123" } });

    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(screen.getByText("更新に失敗しました")).toBeInTheDocument();
    });
  });

  test("バリデーションエラー時はAPI送信されずメッセージが表示される", async () => {
    render(<Form />);

    await waitFor(() => screen.getByLabelText("Username"));

    // 意図的に不正な値をセット（空文字など）
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalidemail" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "" } });

    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(screen.getByText("必要な情報が不足しています")).toBeInTheDocument();
      // fetchが呼ばれていないこと
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
