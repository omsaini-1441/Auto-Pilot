import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "outreach_session";
const BCRYPT_ROUNDS = 12;
const SESSION_DAYS = 7;

const WEAK_SECRET_FRAGMENTS = [
  "change-in-production",
  "dev-secret",
  "changeme",
  "secret",
];

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

/** Fail closed in production if secrets are missing or weak. */
export function assertAuthConfigured() {
  if (!isProduction()) return;

  const secret = process.env.AUTH_SECRET?.trim() || "";
  const password = process.env.SOLO_PASSWORD?.trim() || "";

  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters in production");
  }
  if (WEAK_SECRET_FRAGMENTS.some((f) => secret.toLowerCase().includes(f))) {
    throw new Error("AUTH_SECRET looks like a placeholder — set a strong random value");
  }
  if (password.length < 12) {
    throw new Error("SOLO_PASSWORD must be at least 12 characters in production");
  }
  if (password === "outreach" || password.toLowerCase() === "password") {
    throw new Error("SOLO_PASSWORD is too common for production");
  }
}

function secretKey() {
  assertAuthConfigured();
  const secret =
    process.env.AUTH_SECRET ||
    (isProduction() ? "" : "dev-secret-change-in-production");
  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }
  return new TextEncoder().encode(secret);
}

function soloPasswordFromEnv() {
  assertAuthConfigured();
  const password = process.env.SOLO_PASSWORD?.trim();
  if (isProduction() && !password) {
    throw new Error("SOLO_PASSWORD is required in production");
  }
  return password || "outreach";
}

export async function ensureSoloUser() {
  const existing = await prisma.user.findUnique({
    where: { email: "solo@local" },
    include: { profile: true },
  });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(soloPasswordFromEnv(), BCRYPT_ROUNDS);

  try {
    return await prisma.user.create({
      data: {
        email: "solo@local",
        passwordHash,
        profile: {
          create: {
            fullName: "",
            headline: "",
          },
        },
        templates: {
          create: {
            name: "Cold intro",
            subject: "Quick note — [role] at [company name]",
            bodyHtml: `<p>Hi [person name],</p>
<p>I noticed <strong>[company name]</strong> is hiring for <strong>[role]</strong>{{#location}} in {{location}}{{/location}}.</p>
<p>I'm [my name]{{#my_headline}} — {{my_headline}}{{/my_headline}}. I'd love to briefly connect about the role.</p>
<p>Would you be open to a short chat this week?</p>
<p>Thanks,<br/>[my name]</p>`,
            isDefault: true,
          },
        },
      },
      include: { profile: true },
    });
  } catch {
    const again = await prisma.user.findUnique({
      where: { email: "solo@local" },
      include: { profile: true },
    });
    if (!again) throw new Error("Failed to ensure solo user");
    return again;
  }
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
    if (!userId) return null;
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function verifySoloPassword(password: string) {
  if (!password) return false;
  const user = await ensureSoloUser();
  if (await bcrypt.compare(password, user.passwordHash)) {
    return true;
  }

  // Env is source of truth — allow rotating SOLO_PASSWORD without wiping the DB.
  const expected = soloPasswordFromEnv();
  if (password === expected) {
    const passwordHash = await bcrypt.hash(expected, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return true;
  }
  return false;
}

/** Simple per-IP lockout (best-effort on serverless). */
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export function assertLoginAllowed(ip: string) {
  const row = loginAttempts.get(ip);
  if (!row) return;
  if (row.lockedUntil > Date.now()) {
    const mins = Math.ceil((row.lockedUntil - Date.now()) / 60000);
    throw new Error(`Too many attempts. Try again in ${mins}m`);
  }
}

export function recordLoginFailure(ip: string) {
  const now = Date.now();
  const row = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (row.lockedUntil && row.lockedUntil < now) {
    row.count = 0;
    row.lockedUntil = 0;
  }
  row.count += 1;
  if (row.count >= 5) {
    row.lockedUntil = now + 15 * 60 * 1000;
    row.count = 0;
  }
  loginAttempts.set(ip, row);
}

export function clearLoginFailures(ip: string) {
  loginAttempts.delete(ip);
}

export function loginPageHints() {
  return {
    showDefaultHint: !isProduction(),
  };
}
