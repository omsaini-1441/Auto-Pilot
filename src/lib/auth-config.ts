const WEAK_SECRET_FRAGMENTS = [
  "change-in-production",
  "dev-secret",
  "changeme",
];

export function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

/** Fail closed in production if AUTH_SECRET is missing or weak. */
export function assertAuthConfigured() {
  if (!isProduction()) return;

  const secret = process.env.AUTH_SECRET?.trim() || "";

  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters in production");
  }
  if (WEAK_SECRET_FRAGMENTS.some((f) => secret.toLowerCase().includes(f))) {
    throw new Error("AUTH_SECRET looks like a placeholder — set a strong random value");
  }
}
