// src/proxy.ts
// Edge Runtime — intercept request
// Redirect ke /login kalau belum punya session valid

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

// Route halaman yang tidak perlu auth
const PUBLIC_ROUTES = ["/login", "/register"];

// Route yang selalu boleh diakses
const ALWAYS_ALLOWED = [
  "/_next",
  "/favicon.ico",
  "/api/health",

  // Tambahkan ini jika endpoint login/register kamu lewat API
  "/api/auth",
  "/api/login",
  "/api/register",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan asset, static, dan route internal
  if (ALWAYS_ALLOWED.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Izinkan public routes tanpa wajib token
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (token) {
      try {
        const payload = await verifyToken(token);

        if (payload) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        // Kalau token rusak, tetap izinkan masuk ke /login
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  }

  // Semua route lain wajib token
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyToken(token);

    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};