"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Jobs" },
  { href: "/jobs/new", label: "Add" },
  { href: "/templates", label: "Templates" },
  { href: "/profile", label: "Profile" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
          Outreach
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-2.5 py-1.5 text-sm ${
                  active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button type="button" onClick={logout} className="ml-1 text-xs text-[var(--muted)] underline">
            Out
          </button>
        </nav>
      </div>
    </header>
  );
}
