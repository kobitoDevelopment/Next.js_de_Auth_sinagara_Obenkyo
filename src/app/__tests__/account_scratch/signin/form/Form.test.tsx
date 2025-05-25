import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Form from "@/app/components/signin_scratch/Form";

// useAuth と useRouter のモック化
const mockSignIn = jest.fn();
const mockPush = jest.fn();

jest.mock("@/app/context/AuthContextScratch", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Form Component", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockPush.mockReset();
  });

  test("フォームの初期表示", () => {
    render(<Form />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("PassWord")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  test("ログイン成功時にmypageへ遷移する", async () => {
    mockSignIn.mockResolvedValue(true); // 成功を返す

    render(<Form />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("PassWord"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockPush).toHaveBeenCalledWith("/mypage_scratch");
      expect(screen.queryByText("メールアドレスかパスワードが間違っています")).not.toBeInTheDocument();
    });
  });

  test("ログイン失敗時にエラーメッセージを表示する", async () => {
    mockSignIn.mockResolvedValue(false); // 失敗を返す

    render(<Form />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByLabelText("PassWord"), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("wrong@example.com", "wrongpassword");
      expect(screen.getByText("メールアドレスかパスワードが間違っています")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test("メールとパスワードが未入力の場合はrequiredのバリデーションが効く", () => {
    render(<Form />);
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("PassWord");
    const submitBtn = screen.getByRole("button", { name: "Sign In" });

    // 空欄でsubmit
    fireEvent.change(emailInput, { target: { value: "" } });
    fireEvent.change(passwordInput, { target: { value: "" } });
    fireEvent.click(submitBtn);

    // requiredで止まるので、signInは呼ばれない
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
