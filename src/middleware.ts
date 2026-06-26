import { NextRequest, NextResponse } from "next/server";

// Routes that PENDING / INFORMATION_REQUIRED operators may access
const ALLOWED_FOR_NON_ACTIVE = [
  "/operator/application/status",
  "/operator/register",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/operator/")) return NextResponse.next();

  // Read vayo_user from cookie — middleware runs on the edge and cannot access
  // localStorage, so the login page must also mirror the value into a cookie.
  // Fall back to "allow" if no cookie is present (client-side gate in dashboard
  // will catch it before any data loads).
  const raw = request.cookies.get("vayo_user")?.value;
  if (!raw) return NextResponse.next();

  let user: { operatorStatus?: string } | null = null;
  try { user = JSON.parse(decodeURIComponent(raw)); } catch { /* ignore */ }

  if (!user?.operatorStatus) return NextResponse.next();
  if (user.operatorStatus === "ACTIVE") return NextResponse.next();

  // Non-ACTIVE operator: only allow the status page itself
  const allowed = ALLOWED_FOR_NON_ACTIVE.some((p) => pathname.startsWith(p));
  if (allowed) return NextResponse.next();

  return NextResponse.redirect(new URL("/operator/application/status", request.url));
}

export const config = {
  matcher: ["/operator/:path*"],
};
