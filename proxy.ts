import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|sign-in|sign-up|_next/static|_next/image|favicon.ico).*)",
  ],
};

// Proxy handles users without a session, validity of the session is not checked.
// Users that pass proxy must still be verified.
