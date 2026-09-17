import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_EXACT = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/logout",
  "/manifest.webmanifest",
]);

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function authSecretBytes() {
  const secret = process.env.AUTH_SECRET?.trim() || "";
  if (isProduction()) {
    if (secret.length < 32 || secret.toLowerCase().includes("change-in-production")) {
      return null;
    }
  }
  return new TextEncoder().encode(secret || "dev-secret-change-in-production");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    PUBLIC_EXACT.has(pathname)
  ) {
    return NextResponse.next();
  }

  const secret = authSecretBytes();
  if (!secret) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Server auth misconfigured" }, { status: 503 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const token = req.cookies.get("outreach_session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const res = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("outreach_session", "", { path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
