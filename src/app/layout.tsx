// 'use client' ディレクティブを削除
import './globals.css';
import { DotGothic16 } from 'next/font/google';

// google fontsの読み込み - exportを削除
const dotGothic = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dotgothic', // フォント変数名を定義
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={dotGothic.variable}>
      <body>
        {/* route handlerで構築したコード群を使用する場合 */}
        {/* <AuthProvider>{children}</AuthProvider> */}
        {/* server actionsで構築したコード群を使用する場合 */}
        {children}
      </body>
    </html>
  );
}
