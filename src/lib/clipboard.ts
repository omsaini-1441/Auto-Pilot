"use client";

export async function copyRich(html: string, plain: string) {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return { ok: true as const, mode: "rich" as const };
    }
  } catch {
    // fall through
  }

  try {
    await navigator.clipboard.writeText(plain);
    return { ok: true as const, mode: "plain" as const };
  } catch {
    return { ok: false as const, mode: "failed" as const };
  }
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
