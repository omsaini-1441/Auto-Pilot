import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { apolloAccounts } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await apolloAccounts.findMany({
    where: { userId: user.id },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const label = String(body.label || "").trim();
  if (!label) return NextResponse.json({ error: "Label required" }, { status: 400 });

  const count = await apolloAccounts.count({ where: { userId: user.id } });
  const makeActive = body.isActive === true || count === 0;
  if (makeActive) {
    await apolloAccounts.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });
  }

  const account = await apolloAccounts.create({
    data: {
      userId: user.id,
      label,
      loginHint: String(body.loginHint || ""),
      notes: String(body.notes || ""),
      isActive: makeActive,
    },
  });
  return NextResponse.json({ account });
}
