import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Google OAuth 환경변수가 있을 때만 인증 활성화. 없으면(로컬 개발) 바이패스.
export const authEnabled = !!(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? "dev-only-secret",
  trustHost: true,
  providers: authEnabled ? [Google] : [],
  callbacks: {
    // 화이트리스트: ALLOWED_EMAIL 한 계정만 통과
    signIn({ user }) {
      const allowed = (process.env.ALLOWED_EMAIL ?? "").trim().toLowerCase();
      return !!allowed && user.email?.toLowerCase() === allowed;
    },
  },
});
