import { NextResponse } from "next/server";
import {
  createSession,
  destroySession,
  ensureSoloUser,
  verifySoloPassword,
} from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json()) as { password?: string; action?: string };
  if (body.action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  await ensureSoloUser();
  const ok = await verifySoloPassword(body.password || "");
  if (!ok) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const user = await ensureSoloUser();
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
