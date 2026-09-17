import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/AppNav";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outreach",
  description: "Mobile job outreach drafts — capture, dump contacts, rich-copy to Gmail",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Outreach" },
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] antialiased">
        <AppNav />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-24">{children}</main>
      </body>
    </html>
  );
}
