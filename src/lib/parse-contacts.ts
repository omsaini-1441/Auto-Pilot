export type ParsedContact = {
  name: string;
  email: string;
  title: string;
};

/** Accepts lines like:
 * Jane Doe, jane@acme.com, Recruiter
 * Jane Doe <jane@acme.com>
 * jane@acme.com
 * name\temail\ttitle (TSV/CSV)
 */
export function parseContactDump(raw: string): ParsedContact[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out: ParsedContact[] = [];

  for (const line of lines) {
    const angle = line.match(/^(.+?)\s*<([^>]+@[^>]+)>\s*(?:,\s*(.+))?$/);
    if (angle) {
      out.push({
        name: angle[1].trim(),
        email: angle[2].trim(),
        title: (angle[3] || "").trim(),
      });
      continue;
    }

    const parts = line.split(/[,\t;|]/).map((p) => p.trim()).filter(Boolean);
    const emailPart = parts.find((p) => /@/.test(p));
    if (!emailPart) continue;
    const email = emailPart.replace(/^<|>$/g, "");
    const others = parts.filter((p) => p !== emailPart);
    const name = others[0] || email.split("@")[0];
    const title = others.slice(1).join(", ");
    out.push({ name, email, title });
  }

  // de-dupe by email
  const seen = new Set<string>();
  return out.filter((c) => {
    const key = c.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
