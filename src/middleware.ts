import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 인증이 설정된 환경(프로덕션)에서만 보호. 로컬(미설정)은 통과.
export async function middleware(req: NextRequest) {
  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    return NextResponse.next();
  }
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session && !req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/api/auth/signin", req.nextUrl.origin));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons).*)"],
};
