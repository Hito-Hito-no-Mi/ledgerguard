"use client";

import { ShieldCheck, History } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface MinimalTopBarProps {
  totalRecovered: number;
  auditCount: number;
  onOpenDrawer: () => void;
}

export function MinimalTopBar({
  totalRecovered,
  auditCount,
  onOpenDrawer,
}: MinimalTopBarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Minimal LedgerGuard wordmark */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-zinc-100" />
          </div>
          <span className="font-semibold text-white tracking-tight text-sm sm:text-base">
            LedgerGuard
          </span>
        </div>

        {/* Center / Right: Total Recovered Pill + Past Audits Trigger */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-medium">
            <span className="text-zinc-500 hidden xs:inline text-[11px] font-sans">
              Total Recovered:
            </span>
            <span>{formatCurrency(totalRecovered)}</span>
          </div>

          <button
            onClick={onOpenDrawer}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141417] hover:bg-[#1A1A1E] text-zinc-300 hover:text-white border border-[#27272A] text-xs font-medium transition-colors"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>Past Audits ({auditCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
