"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { UpgradeModal } from "@/components/UpgradeModal";
import { formatCurrency } from "@/lib/utils/currency";
import {
  DollarSign,
  FileCheck2,
  AlertTriangle,
  History,
  TrendingDown,
  Trash2,
  FileSpreadsheet,
  Mail,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { DisputeEmailModal } from "@/components/DisputeEmailModal";
import { DeterministicAuditResult } from "@/lib/engine/types";

interface AuditRecord {
  id: string;
  documentName: string;
  invoiceNumber: string;
  vendorName: string;
  invoiceDate: string;
  currency: string;
  claimedSubtotal: number;
  claimedTax: number;
  claimedGrandTotal: number;
  calculatedSubtotal: number;
  calculatedTax: number;
  calculatedGrandTotal: number;
  totalDiscrepancy: number;
  discrepancyCount: number;
  status: string;
  verdictSummary: string;
  createdAt: number;
}

export default function LedgerPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [stats, setStats] = useState({
    totalSaved: 0,
    totalAudited: 0,
    totalDiscrepancies: 0,
    discrepancyRate: 0,
  });
  const [userState, setUserState] = useState({
    isPro: false,
    auditCount: 0,
    maxFreeAudits: 3,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedAuditForDispute, setSelectedAuditForDispute] = useState<DeterministicAuditResult | null>(null);

  const fetchAudits = async () => {
    try {
      const res = await fetch("/api/audits");
      const data = await res.json();
      if (res.ok) {
        setAudits(data.audits || []);
        setStats(data.stats || { totalSaved: 0, totalAudited: 0, totalDiscrepancies: 0, discrepancyRate: 0 });
        setUserState(data.user || { isPro: false, auditCount: 0, maxFreeAudits: 3 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this audit from the ledger?")) return;
    try {
      await fetch(`/api/audits/${id}`, { method: "DELETE" });
      fetchAudits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDispute = async (audit: AuditRecord) => {
    try {
      const res = await fetch(`/api/audits/${audit.id}`);
      const data = await res.json();
      if (res.ok) {
        const fullAudit: DeterministicAuditResult = {
          vendorName: audit.vendorName,
          invoiceNumber: audit.invoiceNumber,
          invoiceDate: audit.invoiceDate,
          currency: audit.currency,
          status: audit.status as any,
          verdictTitle: audit.verdictSummary,
          verdictDescription: `Audit for ${audit.invoiceNumber}`,
          reconciliation: {
            claimedSubtotal: audit.claimedSubtotal,
            calculatedSubtotal: audit.calculatedSubtotal,
            subtotalVariance: audit.claimedSubtotal - audit.calculatedSubtotal,
            claimedTax: audit.claimedTax,
            calculatedTax: audit.calculatedTax,
            taxVariance: audit.claimedTax - audit.calculatedTax,
            taxRatePercent: 5.0,
            claimedShipping: 0,
            claimedDiscount: 0,
            claimedGrandTotal: audit.claimedGrandTotal,
            calculatedGrandTotal: audit.calculatedGrandTotal,
            grandTotalVariance: audit.claimedGrandTotal - audit.calculatedGrandTotal,
            netCustomerOvercharge: audit.totalDiscrepancy,
          },
          lineItems: data.lineItems || [],
          issueCounts: {
            total: audit.discrepancyCount,
            mathErrors: 1,
            duplicates: 1,
            priceSpikes: 1,
            taxErrors: 1,
          },
        };
        setSelectedAuditForDispute(fullAudit);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAudits = audits.filter(
    (a) =>
      a.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      <Navigation
        userState={userState}
        onOpenUpgrade={() => setUpgradeModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
              <History className="w-6 h-6 text-indigo-400" />
              <span>Audit Ledger & Savings History</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Historical ledger of audited supplier invoices, recovered overcharges, and vendor dispute records.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Saved */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#121215] relative overflow-hidden">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Total Money Saved</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatCurrency(stats.totalSaved)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">
              Caught & contested overcharges
            </p>
          </div>

          {/* Invoices Audited */}
          <div className="p-4 rounded-xl border border-[#27272A] bg-[#121215]">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Invoices Audited</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {stats.totalAudited}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">
              Across all supplier accounts
            </p>
          </div>

          {/* Discrepancy Rate */}
          <div className="p-4 rounded-xl border border-[#27272A] bg-[#121215]">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Discrepancy Rate</span>
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-red-400">
              {stats.discrepancyRate.toFixed(1)}%
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">
              {stats.totalDiscrepancies} invoices had billing errors
            </p>
          </div>

          {/* Audit Engine Status */}
          <div className="p-4 rounded-xl border border-[#27272A] bg-[#121215]">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Accuracy Verification</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-300">
              100%
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">
              Deterministic pure TS arithmetic
            </p>
          </div>
        </div>

        {/* Ledger Table Section */}
        <div className="rounded-xl border border-[#27272A] bg-[#121215] overflow-hidden">
          {/* Table Search & Controls */}
          <div className="p-4 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, invoice #, file..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#27272A] bg-[#0E0E11] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Showing {filteredAudits.length} record{filteredAudits.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#27272A] bg-[#0E0E11] text-zinc-400 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vendor & Invoice</th>
                  <th className="py-3 px-4 text-right">Claimed Total</th>
                  <th className="py-3 px-4 text-right">Recalculated</th>
                  <th className="py-3 px-4 text-right">Net Overcharge</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      Loading audit ledger records...
                    </td>
                  </tr>
                ) : filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-sans">
                      <div className="max-w-sm mx-auto space-y-2">
                        <History className="w-8 h-8 mx-auto text-zinc-600" />
                        <p className="font-medium text-zinc-300">No audits found in ledger</p>
                        <p className="text-xs text-zinc-500">
                          Head over to the Auditor and click &quot;Load Sample Broken Invoice&quot; to populate your history.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((a) => {
                    const isPass = a.status === "PASS";
                    const formattedDate = new Date(a.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-[#17171C] transition-colors"
                      >
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-zinc-200">
                            {a.vendorName}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1.5 mt-0.5">
                            <span className="text-indigo-400">{a.invoiceNumber}</span>
                            <span>•</span>
                            <span className="text-zinc-500 truncate max-w-xs">{a.documentName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-300">
                          {formatCurrency(a.claimedGrandTotal, a.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                          {formatCurrency(a.calculatedGrandTotal, a.currency)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {a.totalDiscrepancy > 0.01 ? (
                            <span className="font-bold text-red-400">
                              -{formatCurrency(a.totalDiscrepancy, a.currency)}
                            </span>
                          ) : (
                            <span className="text-zinc-600">0.00</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              isPass
                                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                                : "bg-red-950/60 text-red-400 border-red-500/40"
                            }`}
                          >
                            {isPass ? "PASS" : "OVERCHARGE"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {!isPass && (
                              <button
                                onClick={() => handleOpenDispute(a)}
                                title="Draft Vendor Dispute Email"
                                className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(a.id)}
                              title="Delete Audit"
                              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <DisputeEmailModal
        audit={selectedAuditForDispute}
        isOpen={!!selectedAuditForDispute}
        onClose={() => setSelectedAuditForDispute(null)}
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        userState={userState}
        onSuccessUpgrade={fetchAudits}
      />
    </div>
  );
}
