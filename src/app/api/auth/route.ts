import { NextResponse } from "next/server";
import {
  assertAuthConfigured,
  assertLoginAllowed,
  clearLoginFailures,
  createSession,
  destroySession,
  ensureSoloUser,
  getClientIp,
  recordLoginFailure,
  verifySoloPassword,
} from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json()) as { password?: string; action?: string };
  if (body.action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

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

  const password = String(body.password || "");
  const ok = await verifySoloPassword(password);
  if (!ok) {
    recordLoginFailure(ip);
    // Constant-ish delay to slow password spraying
    await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 400)));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  clearLoginFailures(ip);
  const user = await ensureSoloUser();
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
