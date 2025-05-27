import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SignOutButton from "@/app/components/mypage/signout/Signout";

// サインアウト処理をテストするために関数をモック化
const mockSignOut = jest.fn();

// ページ遷移処理もテスト対象なので、useRouterのpush関数もモック化
const mockPush = jest.fn();

// AuthContextのuseAuthをモックし、signOut関数を返すようにする
jest.mock("@/app/context/AuthContext", () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

// next/navigationのuseRouterもモックし、push関数を返すようにする
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// 実際のテストケースを記述
describe("SignOutButton Component", () => {
  // 各テスト前にモック関数をリセット（前のテストの影響を受けないように）
  beforeEach(() => {
    mockSignOut.mockReset();
    mockPush.mockReset();
  });

  // ボタンが正しく表示されているか確認
  test("ボタンが正しくレンダリングされる", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });

  // ボタンをクリックしたときに、signOutとpushが呼ばれるかを検証
  test("クリック時に signOut と router.push が呼ばれる", () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    // サインアウト関数が1回実行されたかどうか
    expect(mockSignOut).toHaveBeenCalledTimes(1);

    // "/signin" への遷移が正しく行われたかどうか
    expect(mockPush).toHaveBeenCalledWith("/signin");
  });
});
