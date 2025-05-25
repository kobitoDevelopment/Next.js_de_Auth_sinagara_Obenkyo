import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Form from "@/app/components/mypage/edit/Form";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabase";

// useAuth と setCookie のモック
jest.mock("@/app/context/AuthContext", () => ({
  useAuth: jest.fn(),
  setCookie: jest.fn(),
}));

// supabase のモック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    })),
  },
}));

const mockUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "user",
};

describe("Form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("初期表示にフォーム項目が表示される", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      setUser: jest.fn(),
    });

    // ユーザーデータ取得成功（初期フォーム表示）
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => ({
              data: {
                id: 1,
                username: "testuser",
                email: "test@example.com",
                role: "user",
                password: "oldpassword",
              },
              error: null,
            }),
          }),
        }),
      }),
    });
    render(<Form />);
    expect(await screen.findByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  test("正常にユーザー情報を更新できる", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      setUser: jest.fn(),
    });

    // ユーザーデータ取得成功（初期フォーム表示）
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => ({
              data: {
                id: 1,
                username: "testuser",
                email: "test@example.com",
                role: "user",
                password: "oldpassword",
              },
              error: null,
            }),
          }),
        }),
      }),
    });
    // パスワード確認と更新成功
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { password: "oldpassword" },
            error: null,
          }),
        }),
      }),
    });

    // update 成功
    (supabase.from as jest.Mock).mockReturnValueOnce({
      update: () => ({
        eq: () => ({ error: null }),
      }),
    });

    // 更新後のユーザー情報取得成功
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: {
              id: 1,
              username: "updateduser",
              email: "updated@example.com",
              role: "admin",
            },
            error: null,
          }),
        }),
      }),
    });

    render(<Form />);

    fireEvent.change(await screen.findByLabelText("Username"), { target: { value: "updateduser" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "updated@example.com" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "oldpassword" } });
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "newpassword123" } });

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(screen.getByText("更新に成功しました")).toBeInTheDocument();
    });
  });

  test("バリデーションエラー時にエラーメッセージを表示する", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      setUser: jest.fn(),
    });

    // ユーザーデータ取得成功（初期フォーム表示）
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => ({
              data: {
                id: 1,
                username: "testuser",
                email: "test@example.com",
                role: "user",
                password: "oldpassword",
              },
              error: null,
            }),
          }),
        }),
      }),
    });
    render(<Form />);

    fireEvent.change(await screen.findByLabelText("Email"), { target: { value: "invalid-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(screen.getByText("入力内容に誤りがあります")).toBeInTheDocument();
    });
  });

  test("パスワード不一致時にエラーを表示する", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      setUser: jest.fn(),
    });

    // ユーザーデータ取得成功（初期フォーム表示）
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => ({
              data: {
                id: 1,
                username: "testuser",
                email: "test@example.com",
                role: "user",
                password: "oldpassword",
              },
              error: null,
            }),
          }),
        }),
      }),
    });
    // DB上のパスワードと一致しない
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { password: "correctpass" },
            error: null,
          }),
        }),
      }),
    });

    render(<Form />);

    fireEvent.change(await screen.findByLabelText("Current Password"), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(screen.getByText("現在のパスワードが間違っています")).toBeInTheDocument();
    });
  });

  test("supabaseからのエラー時に失敗メッセージを表示する", async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => ({
              data: null,
              error: { message: "DB error" },
            }),
          }),
        }),
      }),
    });

    render(<Form />);

    await waitFor(() => {
      expect(screen.getByText("ユーザー情報の取得に失敗しました")).toBeInTheDocument();
    });
  });
});
