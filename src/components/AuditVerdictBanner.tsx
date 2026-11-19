"use client";

import { DeterministicAuditResult } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils/currency";
import { AlertTriangle, CheckCircle2, Copy, FileSpreadsheet, Mail, TrendingUp, AlertCircle } from "lucide-react";

interface AuditVerdictBannerProps {
  audit: DeterministicAuditResult;
  onOpenDisputeEmail: () => void;
  onExportCsv: () => void;
}

export function AuditVerdictBanner({
  audit,
  onOpenDisputeEmail,
  onExportCsv,
}: AuditVerdictBannerProps) {
  const isPass = audit.status === "PASS";
  const overcharge = audit.reconciliation.netCustomerOvercharge;
  const issues = audit.issueCounts;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
        isPass
          ? "border-emerald-500/30 bg-emerald-950/20 shadow-glow-emerald"
          : "border-red-500/40 bg-red-950/25 shadow-glow-crimson"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Verdict Details */}
        <div className="flex items-start space-x-3.5">
          <div
            className={`p-2.5 rounded-lg border mt-0.5 ${
              isPass
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {isPass ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-400" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span
                className={`font-mono font-bold tracking-tight text-lg sm:text-xl ${
                  isPass ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {audit.verdictTitle}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border uppercase tracking-wider ${
                  isPass
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-red-500/20 text-red-300 border-red-500/40"
                }`}
              >
                {isPass ? "100% Compliant" : `${issues.total} Issues Detected`}
              </span>
            </div>

            <p className="mt-1 text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              {audit.verdictDescription}
            </p>

            {/* Categorized Issue Pills */}
            {!isPass && (
              <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
                {issues.mathErrors > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-red-900/40 border border-red-500/30 text-red-300 font-mono text-[11px]">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span>{issues.mathErrors} Math Error{issues.mathErrors > 1 ? "s" : ""}</span>
                  </span>
                )}
                {issues.duplicates > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-orange-900/40 border border-orange-500/30 text-orange-300 font-mono text-[11px]">
                    <Copy className="w-3 h-3 text-orange-400" />
                    <span>{issues.duplicates} Duplicate Surcharge</span>
                  </span>
                )}
                {issues.priceSpikes > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-900/40 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    <span>{issues.priceSpikes} Price Creep Spike</span>
                  </span>
                )}
                {issues.taxErrors > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-900/40 border border-rose-500/30 text-rose-300 font-mono text-[11px]">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Tax Calculation Error</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-2.5 shrink-0 pt-2 lg:pt-0">
          {!isPass && (
            <button
              onClick={onOpenDisputeEmail}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mail className="w-4 h-4" />
              <span>Draft Dispute Email</span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#18181B] hover:bg-[#202024] text-zinc-200 border border-[#27272A] hover:border-zinc-500 text-xs sm:text-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
