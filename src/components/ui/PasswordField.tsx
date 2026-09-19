"use client";

import { useState, type ComponentProps } from "react";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10.5 10.5 0 0121 12c-.6 1.1-1.4 2.1-2.3 2.9M6.1 6.1C4.7 7.3 3.6 8.8 3 12c1.7 4.3 5.5 7 9 7a9.3 9.3 0 004.1-.9"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

type PasswordFieldProps = Omit<ComponentProps<"input">, "type">;

export function PasswordField({ className = "", ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        className={`field pr-11 ${className}`.trim()}
        type={visible ? "text" : "password"}
      />
      <button
        type="button"
        className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-[var(--muted)] hover:text-[var(--ink)]"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}
