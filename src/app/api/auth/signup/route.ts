import { NextResponse } from "next/server";
import {
  assertAuthConfigured,
  assertLoginAllowed,
  clearLoginFailures,
  createSession,
  createUserAccount,
  getClientIp,
  recordLoginFailure,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    assertAuthConfigured();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth misconfigured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const ip = getClientIp(req);
  try {
    assertLoginAllowed(ip);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Too many attempts";
    return NextResponse.json({ error: message }, { status: 429 });
  }

  const body = (await req.json()) as { email?: string; password?: string };
  const email = String(body.email || "");
  const password = String(body.password || "");

  try {
    const user = await createUserAccount(email, password);
    clearLoginFailures(ip);
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    recordLoginFailure(ip);
    const message = err instanceof Error ? err.message : "Could not create account";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
