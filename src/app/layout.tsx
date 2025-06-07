'use client';
// import { AuthProvider } from "@/app/context/AuthContext";
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* route handlerで構築したコード群を使用する場合 */}
        {/* <AuthProvider>{children}</AuthProvider> */}
        {/* server actionsで構築したコード群を使用する場合 */}
        {children}
      </body>
    </html>
  );
}
