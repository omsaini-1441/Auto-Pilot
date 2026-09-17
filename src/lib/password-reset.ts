import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { assertAuthConfigured } from "./auth-config";

const BCRYPT_ROUNDS = 12;

export function appBaseUrl() {
  return (
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: string) {
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const tokenHash = hashToken(token);
  const row = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  if (!row) return null;
  return row;
}

export async function markResetTokenUsed(id: string) {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export async function setUserPassword(userId: string, password: string) {
  assertAuthConfigured();
  if (password.trim().length < 12) {
    throw new Error("Password must be at least 12 characters");
  }
  const passwordHash = await bcrypt.hash(password.trim(), BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Outreach <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
      throw new Error("Email is not configured (RESEND_API_KEY). Cannot send reset link.");
    }
    console.info("[dev] Password reset link for", to, "→", resetUrl);
    return { mode: "dev-log" as const, resetUrl };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Outreach password",
      html: `<p>You requested a password reset.</p>
<p><a href="${resetUrl}">Reset password</a></p>
<p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send email: ${text}`);
  }

  return { mode: "email" as const };
}
