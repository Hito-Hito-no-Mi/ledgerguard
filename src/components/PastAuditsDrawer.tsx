"use client";

import { useEffect } from "react";
import { X, Trash2, ArrowUpRight, History, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

export interface PastAuditSummary {
  id: string;
  documentName: string;
  invoiceNumber: string;
  vendorName: string;
  invoiceDate: string;
  currency: string;
  claimedGrandTotal: number;
  calculatedGrandTotal: number;
  totalDiscrepancy: number;
  discrepancyCount: number;
  status: string;
  verdictSummary: string;
  createdAt: number;
}

interface PastAuditsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  audits: PastAuditSummary[];
  onSelectAudit: (id: string) => void;
  onDeleteAudit: (id: string) => void;
}

export function PastAuditsDrawer({
  isOpen,
  onClose,
  audits,
  onSelectAudit,
  onDeleteAudit,
}: PastAuditsDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#111113] border-l border-[#27272A] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272A] flex items-center justify-between bg-[#141417]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Past Audits</h2>
              <p className="text-xs text-zinc-400">
                {audits.length} document{audits.length === 1 ? "" : "s"} stored in SQLite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {audits.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-2">
              <History className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs font-medium text-zinc-400">No past audits recorded</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                Audits ran on uploaded invoices or sample documents will automatically appear here.
              </p>
            </div>
          ) : (
            audits.map((item) => {
              const isPass = item.status === "PASS";
              const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-[#27272A] bg-[#141417] p-3.5 hover:border-zinc-500/70 transition-all cursor-pointer"
                  onClick={() => {
                    onSelectAudit(item.id);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 pr-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-xs text-zinc-200 group-hover:text-white transition-colors">
                          {item.vendorName}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 flex items-center space-x-1.5">
                        <span className="text-indigo-400">{item.invoiceNumber}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAudit(item.id);
                      }}
                      title="Delete from SQLite ledger"
                      className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Verdict & Amounts */}
                  <div className="mt-3 pt-2.5 border-t border-[#27272A]/60 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-1.5">
                      {isPass ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span
                        className={`text-[11px] font-medium ${
                          isPass ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {isPass ? "PASS" : `-${formatCurrency(item.totalDiscrepancy, item.currency)}`}
                      </span>
                    </div>

                    <span className="text-zinc-400 text-[11px] flex items-center space-x-1 group-hover:text-zinc-200">
                      <span>View audit</span>
                      <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272A] bg-[#141417] text-center">
          <p className="text-[11px] font-mono text-zinc-500">
            Audit logs & vendor baselines persisted locally in SQLite
          </p>
        </div>
      </div>
    </div>
  );
}
