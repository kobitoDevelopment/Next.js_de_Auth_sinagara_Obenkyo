import { render } from '@testing-library/react';
import SignOut from '@/app/components/mypage2/signout2/SignOut';
import { signOut } from '@/app/components/mypage2/signout2/actions';

// アクションのモック
jest.mock('@/app/components/mypage2/signout2/actions', () => ({
  signOut: jest.fn(),
}));

describe('SignOut Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('サインアウトボタンを含むフォームがレンダリングされる', async () => {
    // サーバーコンポーネントのレンダリング結果を取得
    const component = await SignOut();

    // レンダリング
    const { getByRole } = render(component);

    // サインアウトボタンが存在することを確認
    const button = getByRole('button', { name: /サインアウト/i });
    expect(button).toBeInTheDocument();

    // フォームが正しいアクションを持っていることを確認
    const form = button.closest('form');
    expect(form).toBeInTheDocument();

    // action属性は実際のDOMではなくJSXのプロパティとして設定されるため、
    // action属性の値を直接確認することはできないが、
    // フォームが存在することは確認できる
  });

  it('サーバーコンポーネントとしての特性を持つ', async () => {
    // サーバーコンポーネントのレンダリング結果を取得
    const component = await SignOut();

    // レンダリング結果がReactエレメントであることを確認
    expect(component).toBeDefined();
    expect(component.type).toBe('form');
    expect(component.props.action).toBe(signOut);

    // 子要素（ボタン）が存在することを確認
    const buttonElement = component.props.children;
    expect(buttonElement.type).toBe('button');
    expect(buttonElement.props.type).toBe('submit');
    expect(buttonElement.props.children).toBe('サインアウト');
  });
});
