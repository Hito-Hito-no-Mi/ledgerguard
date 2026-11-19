"use client";

import { LineItemAuditResult } from "@/lib/engine/types";
import { formatCurrency, formatPercent } from "@/lib/utils/currency";
import { AlertCircle, AlertTriangle, Check, Copy, TrendingUp } from "lucide-react";

interface LineItemsDiffTableProps {
  lineItems: LineItemAuditResult[];
  currency: string;
}

export function LineItemsDiffTable({ lineItems, currency }: LineItemsDiffTableProps) {
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#121215] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between bg-[#121215]">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-zinc-200 text-xs font-mono uppercase tracking-wider">
            Itemized Line Discrepancy Ledger
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[10px]">
            {lineItems.length} lines analyzed
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-zinc-400">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Math Variance</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Rate Spike</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span>Duplicate</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#27272A] bg-[#0E0E11] text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[200px]">SKU & Description</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Rate</th>
              <th className="py-2.5 px-3 text-right">Claimed</th>
              <th className="py-2.5 px-3 text-right">Recalculated</th>
              <th className="py-2.5 px-3 text-right">Variance</th>
              <th className="py-2.5 px-3 min-w-[220px]">Audit Flags & Findings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272A]/50">
            {lineItems.map((item) => {
              const hasIssue =
                item.hasMathError || item.isDuplicate || item.isPriceSpike;
              const isOvercharged = item.discrepancyAmount > 0.01;

              return (
                <tr
                  key={item.lineNumber}
                  className={`transition-colors font-mono ${
                    hasIssue
                      ? "bg-red-950/10 hover:bg-red-950/20"
                      : "hover:bg-[#17171C]"
                  }`}
                >
                  {/* Line Number */}
                  <td className="py-3 px-3 text-center text-zinc-500 font-medium text-[11px]">
                    {item.lineNumber}
                  </td>

                  {/* SKU & Description */}
                  <td className="py-3 px-3 font-sans">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] font-semibold text-indigo-300">
                          {item.sku || "N/A"}
                        </span>
                        {item.isDuplicate && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-orange-950/80 text-orange-400 border border-orange-500/40">
                            <Copy className="w-2.5 h-2.5 mr-0.5" /> Duplicate
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-300 text-xs leading-snug mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-3 text-right text-zinc-300">
                    {item.quantity}
                  </td>

                  {/* Unit Rate with Baseline Spike Detection */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-200">
                        {formatCurrency(item.unitPrice, currency)}
                      </span>
                      {item.isPriceSpike && item.baselinePrice !== null && (
                        <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-medium">
                          <TrendingUp className="w-2.5 h-2.5" />
                          <span>
                            {item.priceSpikePct ? `+${item.priceSpikePct}%` : "hike"} (vs ${item.baselinePrice.toFixed(2)})
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Claimed Line Total */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`${
                        item.hasMathError
                          ? "text-red-400 line-through decoration-red-500 font-medium"
                          : "text-zinc-300"
                      }`}
                    >
                      {formatCurrency(item.claimedLineTotal, currency)}
                    </span>
                  </td>

                  {/* Calculated Line Total */}
                  <td className="py-3 px-3 text-right font-medium">
                    <span
                      className={`${
                        item.hasMathError ? "text-emerald-400 font-bold" : "text-zinc-200"
                      }`}
                    >
                      {formatCurrency(item.calculatedLineTotal, currency)}
                    </span>
                  </td>

                  {/* Variance */}
                  <td className="py-3 px-3 text-right">
                    {Math.abs(item.discrepancyAmount) > 0.01 ? (
                      <span
                        className={`font-bold ${
                          isOvercharged ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {isOvercharged ? "+" : "-"}
                        {formatCurrency(Math.abs(item.discrepancyAmount), currency)}
                      </span>
                    ) : (
                      <span className="text-zinc-600 font-normal">0.00</span>
                    )}
                  </td>

                  {/* Flags / Audit findings */}
                  <td className="py-3 px-3 font-sans">
                    {item.flags.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {item.flags.map((flag, idx) => {
                          const isMath = flag.startsWith("MATH ERROR");
                          const isDup = flag.startsWith("DUPLICATE");
                          const isSpike = flag.startsWith("PRICE CREEP");

                          return (
                            <div
                              key={idx}
                              className={`px-2 py-1 rounded text-[11px] leading-tight flex items-start space-x-1.5 border ${
                                isMath
                                  ? "bg-red-950/40 text-red-300 border-red-500/30"
                                  : isDup
                                  ? "bg-orange-950/40 text-orange-300 border-orange-500/30"
                                  : isSpike
                                  ? "bg-amber-950/40 text-amber-300 border-amber-500/30"
                                  : "bg-zinc-800/60 text-zinc-300 border-zinc-700/40"
                              }`}
                            >
                              {isMath && <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />}
                              {isDup && <Copy className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />}
                              {isSpike && <TrendingUp className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />}
                              <span>{flag}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-emerald-400 text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        <span className="text-zinc-500 font-mono text-[10px]">VERIFIED (QTY × RATE)</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
