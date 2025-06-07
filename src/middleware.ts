/*
 * Cookieにuser_idが存在しているかどうかでアクセスできるページを制限する
 * root/appの場合はルートにmiddleware.tsを配置し、
 * src/appの場合はroot/src/にmiddleware.tsを配置する
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cookieからユーザーidを取得
  const userId = request.cookies.get('user_id')?.value;

  // 現在のパスを取得
  const { pathname } = request.nextUrl;

  // 保護されていないパス（サインイン/サインアップページ）
  const publicPaths = ['/signin2', '/signup2'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // 認証されていないかつ保護されたパスへのアクセスの場合
  if (!userId && !isPublicPath) {
    // サインインページにリダイレクト
    const url = new URL('/signin2', request.url);
    return NextResponse.redirect(url);
  }

  // 認証済みでサインインページなどにアクセスした場合はマイページへリダイレクト
  if (userId && isPublicPath) {
    const url = new URL('/mypage2', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定（静的ファイルなどは除外）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
