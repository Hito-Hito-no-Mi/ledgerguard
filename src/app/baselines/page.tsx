"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { UpgradeModal } from "@/components/UpgradeModal";
import { formatCurrency } from "@/lib/utils/currency";
import { Database, Plus, Search, ShieldCheck, Tag, TrendingUp, AlertCircle, Check } from "lucide-react";

interface BaselineRecord {
  id: string;
  vendorName: string;
  sku: string;
  itemDescription: string;
  baselineUnitPrice: number;
  currency: string;
  lastObservedPrice: number;
  lastAuditDate: string | null;
  updatedAt: number;
}

export default function BaselinesPage() {
  const [baselines, setBaselines] = useState<BaselineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // New Baseline form
  const [vendorName, setVendorName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const fetchBaselines = async () => {
    try {
      const res = await fetch("/api/baselines");
      const data = await res.json();
      if (res.ok) {
        setBaselines(data.baselines || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselines();
  }, []);

  const handleAddBaseline = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      const res = await fetch("/api/baselines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName,
          sku,
          itemDescription: description,
          baselineUnitPrice: parseFloat(unitPrice),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setVendorName("");
        setSku("");
        setDescription("");
        setUnitPrice("");
        fetchBaselines();
      } else {
        const data = await res.json();
        setFormMsg(data.error || "Failed to save baseline");
      }
    } catch (err: any) {
      setFormMsg(err.message);
    }
  };

  const filteredBaselines = baselines.filter(
    (b) =>
      b.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      <Navigation onOpenUpgrade={() => setUpgradeModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
              <Database className="w-6 h-6 text-indigo-400" />
              <span>Contract Vendor Price Baselines</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Pre-approved contract rates stored in SQLite. LedgerGuard flags any invoice billing &gt;5% above these baselines.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contract Baseline</span>
          </button>
        </div>

        {/* Explain Rule Card */}
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-3 text-zinc-300">
            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Automated Price-Creep Sentry:</span>
              <span className="text-zinc-400 ml-1.5">
                Suppliers frequently sneak in subtle rate hikes on repeat invoices. Whenever a line item unit rate exceeds the contract baseline by &gt;5.0%, it is instantly flagged with the exact dollar impact.
              </span>
            </div>
          </div>
          <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] shrink-0">
            Threshold: &gt; 5.0%
          </span>
        </div>

        {/* Baselines Table */}
        <div className="rounded-xl border border-[#27272A] bg-[#121215] overflow-hidden">
          <div className="p-4 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, SKU, description..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#27272A] bg-[#0E0E11] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {filteredBaselines.length} baselines active in SQLite
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#27272A] bg-[#0E0E11] text-zinc-400 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-right">Contract Baseline</th>
                  <th className="py-3 px-4 text-right">Last Audited Rate</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      Loading vendor baselines...
                    </td>
                  </tr>
                ) : filteredBaselines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-500">
                      No vendor baselines match query.
                    </td>
                  </tr>
                ) : (
                  filteredBaselines.map((b) => {
                    const diff = b.lastObservedPrice - b.baselineUnitPrice;
                    const pct = b.baselineUnitPrice > 0 ? (diff / b.baselineUnitPrice) * 100 : 0;
                    const isSpike = pct > 5.0;

                    return (
                      <tr key={b.id} className="hover:bg-[#17171C] transition-colors">
                        <td className="py-3 px-4 font-sans font-medium text-zinc-200">
                          {b.vendorName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-zinc-700/60 text-[11px]">
                            {b.sku}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-zinc-300">
                          {b.itemDescription}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-zinc-100">
                          {formatCurrency(b.baselineUnitPrice, b.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-300">
                          {formatCurrency(b.lastObservedPrice, b.currency)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isSpike ? (
                            <span className="inline-flex items-center space-x-1 text-red-400 font-bold">
                              <TrendingUp className="w-3 h-3" />
                              <span>+{pct.toFixed(1)}%</span>
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium">Approved</span>
                          )}
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

      {/* Add Baseline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-[#27272A] bg-[#121215] shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-zinc-100">Add Contract Rate Baseline</h3>
            <p className="text-xs text-zinc-400">
              Set the contractual baseline rate. Any invoice from this vendor with this SKU billed &gt;5% higher will be flagged.
            </p>

            <form onSubmit={handleAddBaseline} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Logistics & Industrial Supply Corp."
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#27272A] bg-[#0E0E11] text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">SKU / Item Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FRT-HEAVY-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#27272A] bg-[#0E0E11] text-zinc-200 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Freight Linehaul - Dedicated Pallet Route"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#27272A] bg-[#0E0E11] text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Contract Unit Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="320.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#27272A] bg-[#0E0E11] text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {formMsg && (
                <div className="p-2 rounded bg-red-950/40 text-red-400 border border-red-500/30 text-[11px]">
                  {formMsg}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#27272A] text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Save Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onSuccessUpgrade={() => {}}
      />
    </div>
  );
}
