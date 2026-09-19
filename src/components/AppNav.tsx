"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

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
  const [loggingOut, setLoggingOut] = useState(false);
  const [pending, startTransition] = useTransition();

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

  function navigate(href: string) {
    setOpen(false);
    startTransition(() => {
      router.push(href);
    });
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setOpen(false);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/logout"
  ) {
    return null;
  }

  return (
    <header className="relative sticky top-0 z-30 border-b border-(--border) bg-(--bg)/95 backdrop-blur">
      {pending ? (
        <div className="nav-progress" aria-hidden>
          <div className="nav-progress-bar" />
        </div>
      ) : null}
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 lg:max-w-6xl lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="min-w-0 truncate text-left font-(family-name:--font-display) text-lg tracking-tight text-(--ink) lg:text-xl"
        >
          <span className="lg:hidden">{title}</span>
          <span className="hidden lg:inline">Outreach</span>
        </button>

        <nav className="hidden items-center gap-1 sm:flex lg:gap-1.5" aria-label="Main">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <button
                key={l.href}
                type="button"
                onClick={() => navigate(l.href)}
                className={`rounded-md px-2.5 py-1.5 text-sm lg:px-3 ${
                  active
                    ? "bg-(--ink) text-white"
                    : "text-(--muted) hover:bg-white/70 hover:text-(--ink)"
                }`}
              >
                {l.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="ml-2 inline-flex items-center gap-1.5 text-xs text-(--muted) underline disabled:opacity-55 lg:ml-3"
          >
            {loggingOut ? <Spinner size="sm" /> : null}
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-(--border) bg-white text-(--ink) sm:hidden"
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

      {open ? (
        <div id={menuId} className="sm:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-(--ink)/35"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            className="absolute inset-x-0 top-full z-50 border-b border-(--border) bg-(--bg) shadow-sm"
            aria-label="Main"
          >
            <div className="mx-auto max-w-lg px-2 py-2">
              {links.map((l) => {
                const active = l.match(pathname);
                return (
                  <button
                    key={l.href}
                    type="button"
                    onClick={() => navigate(l.href)}
                    className={`block w-full rounded-md px-3 py-3 text-left text-base ${
                      active
                        ? "bg-(--ink) text-white"
                        : "text-(--ink) hover:bg-white/70"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-3 text-left text-base text-(--muted) underline disabled:opacity-55"
              >
                {loggingOut ? <Spinner size="sm" /> : null}
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
