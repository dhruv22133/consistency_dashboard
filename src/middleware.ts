import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Never intercept or redirect API routes - let them return JSON responses!
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // 1. If user is authenticated but has not set a password yet, force them to /set-password
    if (token && token.hasPassword === false) {
      if (pathname !== "/set-password") {
        return NextResponse.redirect(new URL("/set-password", req.url));
      }
    }

    // 2. If user already has a password, prevent accessing /set-password
    if (token && token.hasPassword === true) {
      if (pathname === "/set-password") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // Allow public pages and all public assets
        if (
          pathname === "/login" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname === "/favicon.ico"
        ) {
          return true;
        }

        // All other paths require an active session
        return Boolean(token && token.id);
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
