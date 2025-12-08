import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirects root traffic to the design entry point so Squarespace handoff lands in Scene 1.
 * Other routes, assets, and API paths continue untouched.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/design";

  return NextResponse.redirect(redirectUrl, 307);
}

export const config = {
  matcher: ["/"],
};
