"use client";

import { useEffect, useState } from "react";
import { MinimalTopBar } from "@/components/MinimalTopBar";
import { CleanInputBar } from "@/components/CleanInputBar";
import { VerdictHeader } from "@/components/VerdictHeader";
import { CleanLineItemsTable } from "@/components/CleanLineItemsTable";
import { PastAuditsDrawer, PastAuditSummary } from "@/components/PastAuditsDrawer";
import { DeterministicAuditResult } from "@/lib/engine/types";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function HomePage() {
  const [currentAudit, setCurrentAudit] = useState<DeterministicAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pastAudits, setPastAudits] = useState<PastAuditSummary[]>([]);
  const [totalRecovered, setTotalRecovered] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch past audits from SQLite on mount
  const fetchAuditsHistory = async () => {
    try {
      const res = await fetch("/api/audits");
      const data = await res.json();
      if (res.ok) {
        setPastAudits(data.audits || []);
        setTotalRecovered(data.stats?.totalSaved || 0);
      }
    } catch (e) {
      console.error("Failed to fetch past audits:", e);
    }
  };

  useEffect(() => {
    fetchAuditsHistory();
  }, []);

  // Handle audit triggered on sample invoice
  const handleAuditSample = async (sampleType: "broken" | "clean") => {
    setIsAuditing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to audit invoice.");
      }

      setCurrentAudit(data.auditResult);
      fetchAuditsHistory(); // Refresh history counter
    } catch (err: any) {
      setErrorMessage(err.message || "Audit failed");
    } finally {
      setIsAuditing(false);
    }
  };

  // Handle audit triggered on uploaded file
  const handleAuditFile = async (file: File) => {
    setIsAuditing(true);
    setErrorMessage(null);
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
        throw new Error(data.message || "Failed to audit invoice.");
      }

      setCurrentAudit(data.auditResult);
      fetchAuditsHistory();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process document");
    } finally {
      setIsAuditing(false);
    }
  };

  // Handle audit triggered on pasted raw text
  const handleAuditText = async (text: string) => {
    setIsAuditing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to audit text.");
      }

      setCurrentAudit(data.auditResult);
      fetchAuditsHistory();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to audit text");
    } finally {
      setIsAuditing(false);
    }
  };

  // Load a past audit from the drawer into the active view
  const handleSelectPastAudit = async (id: string) => {
    try {
      const res = await fetch(`/api/audits/${id}`);
      const data = await res.json();
      if (res.ok && data.audit) {
        const fullAudit: DeterministicAuditResult = {
          vendorName: data.audit.vendorName,
          invoiceNumber: data.audit.invoiceNumber,
          invoiceDate: data.audit.invoiceDate,
          currency: data.audit.currency,
          status: data.audit.status,
          verdictTitle: data.audit.verdictSummary,
          verdictDescription: "",
          reconciliation: {
            claimedSubtotal: data.audit.claimedSubtotal,
            calculatedSubtotal: data.audit.calculatedSubtotal,
            subtotalVariance: data.audit.claimedSubtotal - data.audit.calculatedSubtotal,
            claimedTax: data.audit.claimedTax,
            calculatedTax: data.audit.calculatedTax,
            taxVariance: data.audit.claimedTax - data.audit.calculatedTax,
            taxRatePercent: 5.0,
            claimedShipping: 0,
            claimedDiscount: 0,
            claimedGrandTotal: data.audit.claimedGrandTotal,
            calculatedGrandTotal: data.audit.calculatedGrandTotal,
            grandTotalVariance: data.audit.claimedGrandTotal - data.audit.calculatedGrandTotal,
            netCustomerOvercharge: data.audit.totalDiscrepancy,
          },
          lineItems: data.lineItems || [],
          issueCounts: {
            total: data.audit.discrepancyCount,
            mathErrors: data.lineItems.filter((l: any) => l.hasMathError).length,
            duplicates: data.lineItems.filter((l: any) => l.isDuplicate).length,
            priceSpikes: data.lineItems.filter((l: any) => l.isPriceSpike).length,
            taxErrors: Math.abs(data.audit.claimedTax - data.audit.calculatedTax) > 0.01 ? 1 : 0,
          },
        };
        setCurrentAudit(fullAudit);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete a past audit
  const handleDeleteAudit = async (id: string) => {
    try {
      await fetch(`/api/audits/${id}`, { method: "DELETE" });
      if (currentAudit?.invoiceNumber && pastAudits.find((a) => a.id === id)?.invoiceNumber === currentAudit.invoiceNumber) {
        setCurrentAudit(null);
      }
      fetchAuditsHistory();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewAudit = () => {
    setCurrentAudit(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* 1. Minimal Top Bar */}
      <MinimalTopBar
        totalRecovered={totalRecovered}
        auditCount={pastAudits.length}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      {/* Main Unified Top-to-Bottom Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Error Banner if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-950/30 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white font-mono px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Zone 1: Clean Input Bar (Compact dropzone or collapsed active invoice bar) */}
        <CleanInputBar
          currentAudit={currentAudit}
          isAuditing={isAuditing}
          onAuditSample={handleAuditSample}
          onAuditFile={handleAuditFile}
          onAuditText={handleAuditText}
          onNewAudit={handleNewAudit}
        />

        {/* Loading Spinner */}
        {isAuditing && (
          <div className="rounded-xl border border-[#27272A] bg-[#111113] p-10 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-200">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="text-sm font-medium text-zinc-200">
              Auditing invoice against contract baselines & formulas...
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Recalculating unit rates, duplicate lines, and tax calculations
            </p>
          </div>
        )}

        {/* Zone 2: Clear Verdict Header */}
        {!isAuditing && currentAudit && (
          <VerdictHeader audit={currentAudit} />
        )}

        {/* Zone 3: Clean Line-Item Table & One-Click Action */}
        {!isAuditing && currentAudit && (
          <CleanLineItemsTable audit={currentAudit} />
        )}
      </main>

      {/* Slide-over Past Audits Drawer */}
      <PastAuditsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        audits={pastAudits}
        onSelectAudit={handleSelectPastAudit}
        onDeleteAudit={handleDeleteAudit}
      />
    </div>
  );
}
