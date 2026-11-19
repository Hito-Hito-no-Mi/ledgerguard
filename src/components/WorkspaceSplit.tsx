"use client";

import { useState } from "react";
import { DeterministicAuditResult, RawExtractedInvoice } from "@/lib/engine/types";
import { FileUploader } from "./FileUploader";
import { AuditVerdictBanner } from "./AuditVerdictBanner";
import { ReconciliationSummary } from "./ReconciliationSummary";
import { LineItemsDiffTable } from "./LineItemsDiffTable";
import { DisputeEmailModal } from "./DisputeEmailModal";
import { generateAuditCsv } from "@/lib/utils/csvExport";
import { ArrowRight, FileCheck, Layers, Loader2, Sparkles, AlertTriangle } from "lucide-react";

interface WorkspaceSplitProps {
  initialAudit?: DeterministicAuditResult | null;
  userState?: {
    isPro: boolean;
    auditCount: number;
    maxFreeAudits: number;
  };
  onUserStateUpdate?: (state: any) => void;
  onOpenUpgrade?: () => void;
}

export function WorkspaceSplit({
  initialAudit = null,
  userState,
  onUserStateUpdate,
  onOpenUpgrade,
}: WorkspaceSplitProps) {
  const [currentAudit, setCurrentAudit] = useState<DeterministicAuditResult | null>(initialAudit);
  const [rawExtracted, setRawExtracted] = useState<RawExtractedInvoice | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger audit on sample
  const handleAuditSample = async (sampleType: "broken" | "clean") => {
    setIsAuditing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleType }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "FREE_TIER_LIMIT_REACHED") {
          onOpenUpgrade?.();
        }
        throw new Error(data.message || "Audit failed");
      }

      setCurrentAudit(data.auditResult);
      setRawExtracted(data.rawExtracted);
      if (data.userState && onUserStateUpdate) {
        onUserStateUpdate(data.userState);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to audit sample invoice");
    } finally {
      setIsAuditing(false);
    }
  };

  // Trigger audit on uploaded file
  const handleAuditFile = async (file: File) => {
    setIsAuditing(true);
    setErrorMsg(null);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "application/pdf",
          fileBufferBase64: base64Data,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "FREE_TIER_LIMIT_REACHED") {
          onOpenUpgrade?.();
        }
        throw new Error(data.message || "Audit failed");
      }

      setCurrentAudit(data.auditResult);
      setRawExtracted(data.rawExtracted);
      if (data.userState && onUserStateUpdate) {
        onUserStateUpdate(data.userState);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload and audit document");
    } finally {
      setIsAuditing(false);
    }
  };

  // Trigger audit on pasted text
  const handleAuditText = async (text: string) => {
    setIsAuditing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "FREE_TIER_LIMIT_REACHED") {
          onOpenUpgrade?.();
        }
        throw new Error(data.message || "Audit failed");
      }

      setCurrentAudit(data.auditResult);
      setRawExtracted(data.rawExtracted);
      if (data.userState && onUserStateUpdate) {
        onUserStateUpdate(data.userState);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to audit invoice text");
    } finally {
      setIsAuditing(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!currentAudit) return;
    const csvContent = generateAuditCsv(currentAudit);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `LedgerGuard_Audit_${currentAudit.invoiceNumber}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full">
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/40 bg-red-950/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-white font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Single-Screen Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (Uploader & Demo Trigger) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4">
          <FileUploader
            onAuditSample={handleAuditSample}
            onAuditFile={handleAuditFile}
            onAuditText={handleAuditText}
            isAuditing={isAuditing}
            userState={userState}
            onOpenUpgrade={onOpenUpgrade}
          />
        </div>

        {/* Right Pane (Live Audit Verdict & Diff Ledger) */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          {isAuditing ? (
            <div className="rounded-xl border border-[#27272A] bg-[#121215] p-12 flex flex-col items-center justify-center text-center min-h-[460px]">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-zinc-100 mt-4">
                Executing Deterministic Audit...
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Recalculating unit rates, querying historical SQLite vendor baselines, and cross-referencing subtotal & tax formulas.
              </p>
            </div>
          ) : currentAudit ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Verdict Banner */}
              <AuditVerdictBanner
                audit={currentAudit}
                onOpenDisputeEmail={() => setDisputeModalOpen(true)}
                onExportCsv={handleExportCsv}
              />

              {/* Reconciliation Breakdown Card */}
              <ReconciliationSummary
                reconciliation={currentAudit.reconciliation}
                currency={currentAudit.currency}
              />

              {/* Itemized Line Items Diff Table */}
              <LineItemsDiffTable
                lineItems={currentAudit.lineItems}
                currency={currentAudit.currency}
              />
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-[#27272A] bg-[#121215] p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[460px]">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
                <FileCheck className="w-7 h-7 text-zinc-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-100">
                Awaiting Invoice for Audit
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-md leading-relaxed">
                Upload a supplier bill on the left or click{" "}
                <span className="text-red-400 font-medium">
                  &quot;Load Sample Broken Invoice&quot;
                </span>{" "}
                to see how LedgerGuard catches overcharges, duplicate line items, and sneaky unit-price hikes.
              </p>

              <button
                onClick={() => handleAuditSample("broken")}
                className="mt-6 flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02]"
              >
                <span>Click to Run Instant Live Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Email Modal */}
      <DisputeEmailModal
        audit={currentAudit}
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
      />
    </div>
  );
}
