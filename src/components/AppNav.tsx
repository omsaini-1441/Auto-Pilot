"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Jobs", match: (p: string) => p === "/" },
  { href: "/jobs/new", label: "Add", match: (p: string) => p.startsWith("/jobs/new") },
  { href: "/apollo", label: "Apollo", match: (p: string) => p.startsWith("/apollo") },
  { href: "/templates", label: "Templates", match: (p: string) => p.startsWith("/templates") },
  { href: "/profile", label: "Me", match: (p: string) => p.startsWith("/profile") },
];

function pageTitle(pathname: string) {
  if (pathname === "/") return "Jobs";
  if (pathname.startsWith("/jobs/new")) return "Add job";
  if (pathname.startsWith("/jobs/")) return "Job";
  if (pathname.startsWith("/apollo")) return "Apollo";
  if (pathname.startsWith("/templates")) return "Templates";
  if (pathname.startsWith("/profile")) return "Profile";
  return "Outreach";
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitle(pathname);

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
        <Link
          href="/"
          className="min-w-0 font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]"
        >
          {title}
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-2 py-1.5 text-sm ${
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
