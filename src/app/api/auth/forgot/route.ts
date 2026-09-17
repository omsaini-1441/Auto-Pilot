import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  assertLoginAllowed,
  getClientIp,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/auth";
import {
  appBaseUrl,
  createPasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/password-reset";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string };
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const ip = getClientIp(req);

  try {
    assertLoginAllowed(ip);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Too many attempts";
    return NextResponse.json({ error: message }, { status: 429 });
  }

  // Always return the same message to avoid account enumeration
  const generic = {
    ok: true,
    message: "If that email is registered, a reset link has been sent.",
  };

  if (!email || !email.includes("@") || email.endsWith("@local")) {
    return NextResponse.json(generic);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    recordLoginFailure(ip);
    await new Promise((r) => setTimeout(r, 300));
    return NextResponse.json(generic);
  }

  try {
    const token = await createPasswordResetToken(user.id);
    const resetUrl = `${appBaseUrl()}/reset-password?token=${token}`;
    const sent = await sendPasswordResetEmail(email, resetUrl);
    clearLoginFailures(ip);

    if (sent.mode === "dev-log") {
      return NextResponse.json({
        ...generic,
        devResetUrl: resetUrl,
      });
    }

    return NextResponse.json(generic);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start reset";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
