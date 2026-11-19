"use client";

import { useState } from "react";
import { DeterministicAuditResult } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils/currency";
import { generateDisputeEmail } from "@/lib/utils/disputeEmail";
import { generateAuditCsv } from "@/lib/utils/csvExport";
import { Mail, Check, FileSpreadsheet, ChevronDown, ChevronUp, Copy, ExternalLink } from "lucide-react";

interface CleanLineItemsTableProps {
  audit: DeterministicAuditResult;
}

export function CleanLineItemsTable({ audit }: CleanLineItemsTableProps) {
  const [copied, setCopied] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const emailData = generateDisputeEmail(audit);

  const handleCopyEmail = async () => {
    try {
      const fullText = `Subject: ${emailData.subject}\n\n${emailData.body}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Clipboard copy error:", e);
    }
  };

  const handleExportCsv = () => {
    const csvContent = generateAuditCsv(audit);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `LedgerGuard_Audit_${audit.invoiceNumber}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOvercharged = audit.reconciliation.netCustomerOvercharge > 0.01;

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border border-[#27272A] bg-[#111113] overflow-hidden">
        {/* Table Header Info */}
        <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between text-xs font-mono bg-[#141417]">
          <span className="text-zinc-300 font-medium">
            Line Items Diff ({audit.lineItems.length} lines)
          </span>
          <span className="text-zinc-500 text-[11px]">
            Claimed: {formatCurrency(audit.reconciliation.claimedSubtotal, audit.currency)} • Recalculated:{" "}
            {formatCurrency(audit.reconciliation.calculatedSubtotal, audit.currency)}
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#27272A] bg-[#0E0E11] text-zinc-500 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 min-w-[200px]">Vendor Item</th>
                <th className="py-2.5 px-3 text-right w-16">Qty</th>
                <th className="py-2.5 px-3 text-right min-w-[90px]">Unit Price</th>
                <th className="py-2.5 px-3 text-right min-w-[95px]">Billed Total</th>
                <th className="py-2.5 px-3 text-right min-w-[95px]">Expected Total</th>
                <th className="py-2.5 px-3 text-right min-w-[130px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]/40">
              {audit.lineItems.map((item) => {
                const isFlagged =
                  item.hasMathError || item.isDuplicate || item.isPriceSpike;

                return (
                  <tr
                    key={item.lineNumber}
                    className={`transition-colors ${
                      isFlagged
                        ? "bg-red-950/20 text-zinc-200 border-l-2 border-l-red-500"
                        : "text-zinc-400 hover:bg-zinc-900/30"
                    }`}
                  >
                    {/* 1. Vendor Item (SKU + Description + Error Tag) */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`font-semibold ${
                              isFlagged ? "text-red-300" : "text-zinc-300"
                            }`}
                          >
                            {item.sku || `ITEM-${item.lineNumber}`}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-sans mt-0.5 line-clamp-2">
                          {item.description}
                        </span>
                      </div>
                    </td>

                    {/* 2. Quantity */}
                    <td className="py-3 px-3 text-right text-zinc-300">
                      {item.quantity}
                    </td>

                    {/* 3. Unit Price with Baseline comparison if spiked */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={isFlagged && item.isPriceSpike ? "text-amber-300 font-medium" : "text-zinc-300"}>
                          {formatCurrency(item.unitPrice, audit.currency)}
                        </span>
                        {item.isPriceSpike && item.baselinePrice !== null && (
                          <span className="text-[10px] text-amber-400 font-sans">
                            +{item.priceSpikePct?.toFixed(1)}% vs ${item.baselinePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Billed Total */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className={
                          item.hasMathError
                            ? "text-red-400 line-through decoration-red-500 font-medium"
                            : "text-zinc-300"
                        }
                      >
                        {formatCurrency(item.claimedLineTotal, audit.currency)}
                      </span>
                    </td>

                    {/* 5. Expected Total */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-medium ${
                          item.hasMathError ? "text-emerald-400 font-bold" : "text-zinc-200"
                        }`}
                      >
                        {formatCurrency(item.calculatedLineTotal, audit.currency)}
                      </span>
                    </td>

                    {/* 6. Status */}
                    <td className="py-3 px-3 text-right">
                      {item.hasMathError ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/80 text-red-400 border border-red-500/30">
                          +{formatCurrency(item.discrepancyAmount, audit.currency)} Math Error
                        </span>
                      ) : item.isPriceSpike ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
                          Rate Spike (+{item.priceSpikePct?.toFixed(1)}%)
                        </span>
                      ) : item.isDuplicate ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950/80 text-orange-400 border border-orange-500/30">
                          Duplicate Surcharge
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">
                          ✓ Verified
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prominent Action Bar below table */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <button
          onClick={handleCopyEmail}
          className={`flex-1 flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] ${
            copied
              ? "bg-emerald-600 text-white border border-emerald-500"
              : isOvercharged
              ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/40"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>Copy Dispute Email</span>
            </>
          )}
        </button>

        <div className="flex items-center space-x-2 self-end sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setShowEmailPreview(!showEmailPreview)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-3 rounded-xl bg-[#141417] hover:bg-[#1A1A1E] text-zinc-300 hover:text-white border border-[#27272A] text-xs font-medium transition-colors"
          >
            <span>Preview Letter</span>
            {showEmailPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-3 rounded-xl bg-[#141417] hover:bg-[#1A1A1E] text-zinc-300 hover:text-white border border-[#27272A] text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Expandable Dispute Letter Preview */}
      {showEmailPreview && (
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4 text-xs font-mono space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
            <span className="text-zinc-400 font-sans font-medium">Dispute Draft Preview</span>
            <span className="text-zinc-500 text-[11px]">Ready for Accounts Payable</span>
          </div>
          <div className="text-zinc-400 text-[11px]">
            <span className="text-zinc-500">Subject: </span>
            <span className="text-zinc-200">{emailData.subject}</span>
          </div>
          <textarea
            readOnly
            value={emailData.body}
            rows={10}
            className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0C] p-3 text-xs font-mono text-zinc-300 leading-relaxed focus:outline-none resize-none select-all"
          />
        </div>
      )}
    </div>
  );
}
