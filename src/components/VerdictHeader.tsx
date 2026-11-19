"use client";

import { DeterministicAuditResult } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils/currency";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface VerdictHeaderProps {
  audit: DeterministicAuditResult;
}

export function VerdictHeader({ audit }: VerdictHeaderProps) {
  const isPass = audit.status === "PASS";
  const overcharge = audit.reconciliation.netCustomerOvercharge;

  // Extract concise, scannable root causes
  const rootCauses: string[] = [];

  if (!isPass) {
    // 1. Math errors
    audit.lineItems
      .filter((l) => l.hasMathError)
      .forEach((l) => {
        rootCauses.push(
          `Line ${l.lineNumber} math mismatch: ${l.quantity} × ${formatCurrency(
            l.unitPrice,
            audit.currency
          )} billed as ${formatCurrency(l.claimedLineTotal, audit.currency)} (+${formatCurrency(
            l.discrepancyAmount,
            audit.currency
          )} variance)`
        );
      });

    // 2. Unit price baseline hikes
    audit.lineItems
      .filter((l) => l.isPriceSpike)
      .forEach((l) => {
        rootCauses.push(
          `Line ${l.lineNumber} rate creep: Billed at ${formatCurrency(
            l.unitPrice,
            audit.currency
          )} (${l.priceSpikePct ? `+${l.priceSpikePct.toFixed(1)}%` : "spike"} above contract baseline of ${formatCurrency(
            l.baselinePrice ?? 0,
            audit.currency
          )})`
        );
      });

    // 3. Duplicate charges
    audit.lineItems
      .filter((l) => l.isDuplicate)
      .forEach((l) => {
        rootCauses.push(
          `Line ${l.lineNumber} duplicate charge: SKU "${l.sku || "N/A"}" (${l.description}) billed multiple times`
        );
      });

    // 4. Tax error
    if (Math.abs(audit.reconciliation.taxVariance) > 0.01) {
      rootCauses.push(
        `Tax calculation error: Billed ${formatCurrency(
          audit.reconciliation.claimedTax,
          audit.currency
        )} vs expected ${formatCurrency(audit.reconciliation.calculatedTax, audit.currency)} ${
          audit.reconciliation.taxRatePercent ? `at stated ${audit.reconciliation.taxRatePercent}% rate` : ""
        } (+${formatCurrency(audit.reconciliation.taxVariance, audit.currency)} bloat)`
      );
    }
  } else {
    rootCauses.push(
      `All ${audit.lineItems.length} line items verified (Quantity × Unit Price arithmetic is 100% exact)`
    );
    rootCauses.push("All unit prices match approved SQLite contract baseline rates");
    rootCauses.push(
      `Subtotal (${formatCurrency(
        audit.reconciliation.calculatedSubtotal,
        audit.currency
      )}) and tax (${formatCurrency(
        audit.reconciliation.calculatedTax,
        audit.currency
      )}) reconciled with zero variance`
    );
  }

  return (
    <div
      className={`rounded-xl border p-5 sm:p-6 transition-all ${
        isPass
          ? "border-emerald-500/30 bg-[#0C1510] shadow-glow-emerald"
          : "border-red-500/40 bg-[#160D0E] shadow-glow-crimson"
      }`}
    >
      <div className="flex items-start space-x-3.5">
        <div
          className={`p-2 rounded-lg border mt-0.5 shrink-0 ${
            isPass
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {isPass ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Main Verdict Headline */}
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <h2
              className={`font-mono font-bold tracking-tight text-base sm:text-xl ${
                isPass ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPass
                ? "PASS (No Overcharges Found)"
                : `OVERCHARGE DETECTED: -${formatCurrency(overcharge, audit.currency)}`}
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                isPass
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-red-500/20 text-red-300 border-red-500/40"
              }`}
            >
              {isPass ? "100% Exact" : `${rootCauses.length} Issues Flagged`}
            </span>
          </div>

          {/* Scannable Root Cause Bullets */}
          <ul className="mt-3.5 space-y-1.5 text-xs sm:text-sm font-sans">
            {rootCauses.map((cause, index) => (
              <li
                key={index}
                className={`flex items-start space-x-2 leading-relaxed ${
                  isPass ? "text-emerald-200/90" : "text-red-200/90"
                }`}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                    isPass ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <span className="font-mono text-xs">{cause}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
