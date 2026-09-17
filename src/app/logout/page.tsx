"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      if (!cancelled) {
        setDone(true);
        router.replace("/login");
        router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-[var(--muted)]">{done ? "Signed out." : "Signing out…"}</p>
    </div>
  );
}
