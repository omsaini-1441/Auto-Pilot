"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Jobs", match: (p: string) => p === "/" },
  { href: "/jobs/new", label: "Add job", match: (p: string) => p.startsWith("/jobs/new") },
  { href: "/apollo", label: "Apollo", match: (p: string) => p.startsWith("/apollo") },
  { href: "/templates", label: "Templates", match: (p: string) => p.startsWith("/templates") },
  { href: "/profile", label: "Profile", match: (p: string) => p.startsWith("/profile") },
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
  const menuId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function logout() {
    setOpen(false);
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/login");
    router.refresh();
  }

  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/logout"
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="min-w-0 truncate font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]"
        >
          {title}
        </Link>

        {/* Desktop / wide: inline links */}
        <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Main">
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
            Log out
          </button>
        </nav>

        {/* Mobile: hamburger */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-white text-[var(--ink)] sm:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          <span className="relative block h-3.5 w-4" aria-hidden>
            <span
              className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition-transform duration-200 ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] h-0.5 w-4 bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-[12px] h-0.5 w-4 bg-current transition-transform duration-200 ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel */}
      {open ? (
        <div id={menuId} className="sm:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[var(--ink)]/35"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            className="absolute inset-x-0 top-full z-50 border-b border-[var(--border)] bg-[var(--bg)] shadow-sm"
            aria-label="Main"
          >
            <div className="mx-auto max-w-lg px-2 py-2">
              {links.map((l) => {
                const active = l.match(pathname);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`block rounded-md px-3 py-3 text-base ${
                      active
                        ? "bg-[var(--ink)] text-white"
                        : "text-[var(--ink)] hover:bg-white/70"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={logout}
                className="mt-1 block w-full rounded-md px-3 py-3 text-left text-base text-[var(--muted)] underline"
              >
                Log out
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
