import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { assertAuthConfigured, isProduction } from "./auth-config";
import { soloEmailFromEnv } from "./password-reset";

const COOKIE = "outreach_session";
const BCRYPT_ROUNDS = 12;
const SESSION_DAYS = 7;

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

const LEGACY_DEFAULT_PASSWORD = "outreach";

function soloPasswordFromEnv() {
  assertAuthConfigured();
  const password = process.env.SOLO_PASSWORD?.trim();
  if (isProduction() && !password) {
    throw new Error("SOLO_PASSWORD is required in production");
  }
  // Dev-only seed when SOLO_PASSWORD is unset; never accepted alongside a real SOLO_PASSWORD.
  return password || LEGACY_DEFAULT_PASSWORD;
}

/** If the DB still has the old default hash and SOLO_PASSWORD is set to something else, replace it. */
async function retireLegacyDefaultPassword(userId: string, passwordHash: string) {
  const configured = process.env.SOLO_PASSWORD?.trim();
  if (!configured || configured === LEGACY_DEFAULT_PASSWORD) return passwordHash;
  if (!(await bcrypt.compare(LEGACY_DEFAULT_PASSWORD, passwordHash))) return passwordHash;

  const nextHash = await bcrypt.hash(configured, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: nextHash },
  });
  return nextHash;
}

export async function ensureSoloUser() {
  const email = soloEmailFromEnv();

  let existing = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  // Migrate legacy solo@local row to configured email
  if (!existing && email !== "solo@local") {
    const legacy = await prisma.user.findUnique({
      where: { email: "solo@local" },
      include: { profile: true },
    });
    if (legacy) {
      existing = await prisma.user.update({
        where: { id: legacy.id },
        data: { email },
        include: { profile: true },
      });
    }
  }

  if (existing) {
    const passwordHash = await retireLegacyDefaultPassword(existing.id, existing.passwordHash);
    if (passwordHash !== existing.passwordHash) {
      return { ...existing, passwordHash };
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(soloPasswordFromEnv(), BCRYPT_ROUNDS);

  try {
    return await prisma.user.create({
      data: {
        email,
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
      where: { email },
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

export async function verifyCredentials(email: string, password: string) {
  if (!email?.trim() || !password) return false;
  const user = await ensureSoloUser();
  const normalized = email.trim().toLowerCase();
  if (user.email.toLowerCase() !== normalized) {
    // Timing-ish: still hash to avoid email oracle speed difference
    await bcrypt.compare(password, user.passwordHash);
    return false;
  }

  // Single source of truth: stored hash only (no env / legacy dual-accept).
  return bcrypt.compare(password, user.passwordHash);
}

/** @deprecated use verifyCredentials */
export async function verifySoloPassword(password: string) {
  return verifyCredentials(soloEmailFromEnv(), password);
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

export function loginPageHints() {
  return {
    showDefaultHint: !isProduction(),
    defaultEmail: !isProduction() ? soloEmailFromEnv() : "",
  };
}
