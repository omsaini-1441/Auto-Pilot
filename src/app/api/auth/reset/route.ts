import { NextResponse } from "next/server";
import {
  consumePasswordResetToken,
  markResetTokenUsed,
  setUserPassword,
} from "@/lib/password-reset";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json()) as { token?: string; password?: string };
  const token = String(body.token || "");
  const password = String(body.password || "");

  if (!token || password.trim().length < 12) {
    return NextResponse.json(
      { error: "Valid token and password (12+ characters) required" },
      { status: 400 },
    );
  }

  const row = await consumePasswordResetToken(token);
  if (!row) {
    return NextResponse.json({ error: "Reset link is invalid or expired" }, { status: 400 });
  }

  try {
    await setUserPassword(row.userId, password);
    await markResetTokenUsed(row.id);
    await createSession(row.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reset password";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
