"use client";

import { ReconciliationBreakdown } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils/currency";
import { ArrowRight, Calculator, Check, AlertOctagon } from "lucide-react";

interface ReconciliationSummaryProps {
  reconciliation: ReconciliationBreakdown;
  currency: string;
}

export function ReconciliationSummary({
  reconciliation: r,
  currency,
}: ReconciliationSummaryProps) {
  const hasSubtotalVariance = Math.abs(r.subtotalVariance) > 0.01;
  const hasTaxVariance = Math.abs(r.taxVariance) > 0.01;
  const hasGrandTotalVariance = Math.abs(r.grandTotalVariance) > 0.01;

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#121215] p-4 text-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27272A]/70">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px] font-mono">
            Deterministic Reconciliation Summary
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Pure TS Verification • Zero LLM Math
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Subtotal Check */}
        <div
          className={`p-3 rounded-lg border ${
            hasSubtotalVariance
              ? "bg-red-950/20 border-red-500/30"
              : "bg-[#18181B] border-[#27272A]"
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span>Subtotal Arithmetic</span>
            {hasSubtotalVariance ? (
              <span className="text-red-400 font-mono text-[10px] uppercase font-bold">Variance</span>
            ) : (
              <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center">
                <Check className="w-3 h-3 mr-0.5" /> Match
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <div>
              <span className="text-zinc-500 text-[10px] block">Claimed on Bill</span>
              <span className="text-zinc-300 font-medium">{formatCurrency(r.claimedSubtotal, currency)}</span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-600 self-center" />
            <div className="text-right">
              <span className="text-zinc-500 text-[10px] block">Recalculated</span>
              <span className="text-zinc-100 font-bold">{formatCurrency(r.calculatedSubtotal, currency)}</span>
            </div>
          </div>
          {hasSubtotalVariance && (
            <div className="mt-2 pt-1.5 border-t border-red-500/20 text-right font-mono text-red-400 font-semibold text-[11px]">
              Variance: {formatCurrency(r.subtotalVariance, currency)}
            </div>
          )}
        </div>

        {/* Tax Calculation Check */}
        <div
          className={`p-3 rounded-lg border ${
            hasTaxVariance
              ? "bg-red-950/20 border-red-500/30"
              : "bg-[#18181B] border-[#27272A]"
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span>Tax Rate Computation</span>
            {hasTaxVariance ? (
              <span className="text-red-400 font-mono text-[10px] uppercase font-bold">Variance</span>
            ) : (
              <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center">
                <Check className="w-3 h-3 mr-0.5" /> Match
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <div>
              <span className="text-zinc-500 text-[10px] block">
                Claimed {r.taxRatePercent ? `(${r.taxRatePercent}%)` : ""}
              </span>
              <span className="text-zinc-300 font-medium">{formatCurrency(r.claimedTax, currency)}</span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-600 self-center" />
            <div className="text-right">
              <span className="text-zinc-500 text-[10px] block">True Rate Tax</span>
              <span className="text-zinc-100 font-bold">{formatCurrency(r.calculatedTax, currency)}</span>
            </div>
          </div>
          {hasTaxVariance && (
            <div className="mt-2 pt-1.5 border-t border-red-500/20 text-right font-mono text-red-400 font-semibold text-[11px]">
              Tax Bloat: {formatCurrency(r.taxVariance, currency)}
            </div>
          )}
        </div>

        {/* Grand Total Comparison */}
        <div
          className={`p-3 rounded-lg border ${
            hasGrandTotalVariance
              ? "bg-red-950/25 border-red-500/40"
              : "bg-emerald-950/20 border-emerald-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="font-medium text-zinc-200">Grand Total Audit</span>
            {hasGrandTotalVariance ? (
              <span className="text-red-400 font-mono text-[10px] uppercase font-bold flex items-center">
                <AlertOctagon className="w-3 h-3 mr-0.5" /> Overcharge
              </span>
            ) : (
              <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center">
                <Check className="w-3 h-3 mr-0.5" /> Exact
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <div>
              <span className="text-zinc-500 text-[10px] block">Claimed Invoice</span>
              <span className="text-zinc-300 line-through text-[11px]">
                {formatCurrency(r.claimedGrandTotal, currency)}
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-600 self-center" />
            <div className="text-right">
              <span className="text-zinc-500 text-[10px] block">True Payable</span>
              <span className="text-emerald-400 font-bold text-sm">
                {formatCurrency(r.calculatedGrandTotal, currency)}
              </span>
            </div>
          </div>
          {hasGrandTotalVariance && (
            <div className="mt-2 pt-1.5 border-t border-red-500/25 flex items-center justify-between font-mono">
              <span className="text-zinc-400 text-[10px]">Customer Overcharge:</span>
              <span className="text-red-400 font-bold text-xs">
                -{formatCurrency(r.netCustomerOvercharge, currency)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
