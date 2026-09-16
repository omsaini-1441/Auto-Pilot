import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "outreach_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function ensureSoloUser() {
  const existing = await prisma.user.findUnique({
    where: { email: "solo@local" },
    include: { profile: true },
  });
  if (existing) return existing;

  const password = process.env.SOLO_PASSWORD || "outreach";
  const passwordHash = await bcrypt.hash(password, 10);

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
            subject: "Quick note — {{role}} at {{company}}",
            bodyHtml: `<p>Hi {{first_name}},</p>
<p>I noticed <strong>{{company}}</strong> is hiring for <strong>{{role}}</strong>{{#location}} in {{location}}{{/location}}.</p>
<p>I'm {{my_name}}{{#my_headline}} — {{my_headline}}{{/my_headline}}. I'd love to briefly connect about the role.</p>
<p>Would you be open to a short chat this week?</p>
<p>Thanks,<br/>{{my_name}}</p>`,
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
    .setExpirationTime("30d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser() {
  await ensureSoloUser();
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
  const user = await ensureSoloUser();
  return bcrypt.compare(password, user.passwordHash);
}
