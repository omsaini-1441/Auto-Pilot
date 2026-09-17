const WEAK_SECRET_FRAGMENTS = [
  "change-in-production",
  "dev-secret",
  "changeme",
];

export function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

/** Fail closed in production if secrets are missing or weak. */
export function assertAuthConfigured() {
  if (!isProduction()) return;

  const secret = process.env.AUTH_SECRET?.trim() || "";
  const password = process.env.SOLO_PASSWORD?.trim() || "";
  const email = process.env.SOLO_EMAIL?.trim() || "";

  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters in production");
  }
  if (WEAK_SECRET_FRAGMENTS.some((f) => secret.toLowerCase().includes(f))) {
    throw new Error("AUTH_SECRET looks like a placeholder — set a strong random value");
  }
  if (password.length < 12) {
    throw new Error("SOLO_PASSWORD must be at least 12 characters in production");
  }
  if (password === "outreach" || password.toLowerCase() === "password") {
    throw new Error("SOLO_PASSWORD is too common for production");
  }
  if (!email || !email.includes("@") || email.endsWith("@local")) {
    throw new Error("SOLO_EMAIL must be a real email in production");
  }
}
