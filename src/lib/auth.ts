import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { assertAuthConfigured, isProduction } from "./auth-config";

const COOKIE = "outreach_session";
const BCRYPT_ROUNDS = 12;
const SESSION_DAYS = 7;
/** Fixed valid bcrypt hash so failed logins still pay a compare cost. */
const DUMMY_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

export { assertAuthConfigured, isProduction } from "./auth-config";

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  const e = normalizeEmail(email);
  if (!e.includes("@") || e.length < 5) return false;
  if (e.endsWith("@local")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function validatePassword(password: string) {
  const p = password.trim();
  if (p.length < 12) return "Password must be at least 12 characters";
  if (p.toLowerCase() === "outreach" || p.toLowerCase() === "password") {
    return "Password is too common";
  }
  return null;
}

const DEFAULT_TEMPLATE = {
  name: "Cold intro",
  subject: "Quick note — [role] at [company name]",
  bodyHtml: `<p>Hi [person name],</p>
<p>I noticed <strong>[company name]</strong> is hiring for <strong>[role]</strong>{{#location}} in {{location}}{{/location}}.</p>
<p>I'm [my name]{{#my_headline}} — {{my_headline}}{{/my_headline}}. I'd love to briefly connect about the role.</p>
<p>Would you be open to a short chat this week?</p>
<p>Thanks,<br/>[my name]</p>`,
  isDefault: true,
};

export async function createUserAccount(email: string, password: string) {
  assertAuthConfigured();
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error("Enter a valid email address");
  }
  const pwErr = validatePassword(password);
  if (pwErr) throw new Error(pwErr);

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password.trim(), BCRYPT_ROUNDS);
  return prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      profile: {
        create: { fullName: "", headline: "" },
      },
      templates: {
        create: DEFAULT_TEMPLATE,
      },
    },
    include: { profile: true },
  });
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

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { profile: true },
  });
}

export async function verifyCredentials(email: string, password: string) {
  if (!email?.trim() || !password) return false;
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(password, user.passwordHash);
}

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
