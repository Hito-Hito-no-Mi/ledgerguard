import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LedgerGuard — Automated B2B Invoice & PO Discrepancy Auditor",
  description:
    "Catch supplier overcharges, math errors, duplicate line items, and unapproved price hikes in seconds with deterministic audit verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090B] text-zinc-100 antialiased min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
