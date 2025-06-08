'use client';

// 必要なReactフックとコンポーネントをインポート
import { useState } from 'react'; // 状態管理のためのReactフック
import { useRouter } from 'next/navigation'; // ページ間のナビゲーション（リダイレクト）のためのNext.jsフック
import { deleteAccountAction } from './actions'; // サーバーアクションをインポート（サーバー側で実行される関数）

// DeleteAccountコンポーネントの定義 - アカウント削除機能を提供するUIコンポーネント
export default function DeleteAccount() {
  // useRouterフックを初期化 - プログラムによるページ遷移（リダイレクト）に使用
  const router = useRouter();

  // エラーメッセージを保持するための状態変数 - 初期値はnull（エラーなし）
  const [error, setError] = useState<string | null>(null);

  // 削除処理中かどうかを示すフラグ - ボタンの無効化やテキスト変更に使用
  const [isDeleting, setIsDeleting] = useState(false);

  // 削除ボタンがクリックされたときに実行される非同期関数
  const handleDelete = async () => {
    // ブラウザの標準確認ダイアログを表示 - OKならtrue、キャンセルならfalseを返す
    const isConfirmed = window.confirm(
      'アカウントを削除してもよろしいですか？この操作は取り消せません。'
    );

    // ユーザーが確認ダイアログでOKを選択した場合のみ処理を続行
    if (isConfirmed) {
      try {
        // 削除処理開始のフラグを設定 - UIに処理中であることを反映（ボタン無効化など）
        setIsDeleting(true);

        // サーバーアクションを呼び出し - この部分がサーバー側で実行される
        // awaitで非同期処理の完了を待ち、resultに結果オブジェクトを格納
        const result = await deleteAccountAction();

        // 成功ステータスによる条件分岐 - サーバーアクションからの応答に基づく処理
        if (result.success) {
          // 成功の場合：クライアント側でログインページにリダイレクト
          // サーバー側redirectとは異なり、クライアント側でページ遷移が行われる
          router.push('/signin2');
        } else if (result.errors) {
          // エラーがある場合：エラーメッセージを表示
          // 複数のエラーメッセージがある場合はカンマで結合して1つの文字列に
          setError(result.errors.join(', '));
          // 削除処理完了のフラグをリセット（失敗したため）
          setIsDeleting(false);
        }
      } catch (err) {
        // 予期せぬエラーが発生した場合（通信エラーなど）
        // コンソールにエラー詳細をログ出力（開発者向け）
        console.error('クライアント側エラー:', err);
        // ユーザー向けの一般的なエラーメッセージを設定
        setError('削除処理中にエラーが発生しました');
        // 削除処理完了のフラグをリセット
        setIsDeleting(false);
      }
    }
    // isConfirmedがfalseの場合（キャンセル時）は何もせず関数終了
  };

  // コンポーネントのレンダリング部分 - UIの構造を定義
  return (
    <div>
      {/* エラーがある場合のみエラーメッセージを表示する条件付きレンダリング */}
      {error && <p>{error}</p>}

      {/* 削除ボタン - クリック時にhandleDelete関数を実行 */}
      {/* isDeleting状態に基づいてボタンを無効化し、テキストを変更 */}
      <button onClick={handleDelete} disabled={isDeleting}>
        {/* 三項演算子を使用して、削除中かどうかでボタンのテキストを切り替え */}
        {isDeleting ? 'アカウント削除中...' : 'アカウントを削除する'}
      </button>
    </div>
  );
}
