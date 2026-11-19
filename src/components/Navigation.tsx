"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, History, Database, Sparkles, Zap, CreditCard } from "lucide-react";

interface NavigationProps {
  userState?: {
    isPro: boolean;
    auditCount: number;
    maxFreeAudits: number;
  };
  onOpenUpgrade?: () => void;
}

export function Navigation({ userState, onOpenUpgrade }: NavigationProps) {
  const pathname = usePathname();

  const isPro = userState?.isPro ?? false;
  const count = userState?.auditCount ?? 0;
  const max = userState?.maxFreeAudits ?? 3;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white tracking-tight text-base">LedgerGuard</span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                Audit Engine
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === "/"
                  ? "bg-[#18181B] text-white border border-[#27272A]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]"
              }`}
            >
              Auditor
            </Link>
            <Link
              href="/ledger"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === "/ledger"
                  ? "bg-[#18181B] text-white border border-[#27272A]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Ledger History</span>
            </Link>
            <Link
              href="/baselines"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === "/baselines"
                  ? "bg-[#18181B] text-white border border-[#27272A]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Vendor Baselines</span>
            </Link>
          </nav>
        </div>

        {/* Right side quota & pro upgrade */}
        <div className="flex items-center space-x-3">
          {isPro ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono uppercase tracking-wider text-[11px]">Pro Unlimited</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-1 text-xs text-zinc-400">
                <span className="text-zinc-500">Tier:</span>
                <span className="font-mono text-zinc-300 font-medium">
                  {count} of {max} free audits used
                </span>
              </div>
              <button
                onClick={onOpenUpgrade}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-medium transition-all shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Upgrade to Pro</span>
              </button>
            </div>
          )}

          {/* Quick billing modal trigger */}
          <button
            onClick={onOpenUpgrade}
            title="Billing & Webhook Settings"
            className="p-1.5 rounded-md border border-[#27272A] bg-[#121215] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
