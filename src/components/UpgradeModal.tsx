"use client";

import { useState } from "react";
import { Check, Sparkles, X, Zap, Shield, Webhook, RefreshCw, ArrowRight } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: {
    isPro: boolean;
    auditCount: number;
    maxFreeAudits: number;
  };
  onSuccessUpgrade: () => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  userState,
  onSuccessUpgrade,
}: UpgradeModalProps) {
  const [provider, setProvider] = useState<"lemon_squeezy" | "dodo_payments">("lemon_squeezy");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPro = userState?.isPro ?? false;

  const handleSimulateWebhook = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/webhooks/billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-event-name": "subscription_created",
          ...(provider === "lemon_squeezy" ? { "x-signature": "simulated_ls_hash" } : { "x-dodo-signature": "simulated_dodo_hash" }),
        },
        body: JSON.stringify({
          test_upgrade: true,
          provider,
          event_name: "subscription_created",
          data: {
            attributes: {
              user_email: "demo@ledgerguard.internal",
              status: "active",
            },
          },
          userId: "demo-user-123",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Success: Merchant of Record (${provider}) verified webhook! Account upgraded to Pro.`);
        onSuccessUpgrade();
      } else {
        setMessage(`❌ Error: ${data.message || "Failed to process webhook"}`);
      }
    } catch (e: any) {
      setMessage(`❌ Network Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAudits = async () => {
    try {
      await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_audits", userId: "demo-user-123" }),
      });
      setMessage("✅ Free audit count reset to 0/3.");
      onSuccessUpgrade();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleTogglePro = async () => {
    try {
      await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_pro", userId: "demo-user-123" }),
      });
      onSuccessUpgrade();
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-xl border border-[#27272A] bg-[#121215] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#27272A] flex items-center justify-between bg-[#18181B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center space-x-2">
                <span>LedgerGuard Pro Membership</span>
                {isPro && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono uppercase">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">
                Unlock automated multi-document auditing, custom vendor baselines, and API access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Card Details */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-transparent">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                  B2B Pro Plan
                </span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-3xl font-bold font-mono text-zinc-100">$79</span>
                  <span className="text-xs text-zinc-400">/ month</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-medium">
                Unlimited Audits
              </span>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited automated PDF & Image invoice discrepancy audits</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Historical price-creep tracking against contract SQLite baselines</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>One-click formal Accounts Payable dispute letters & CSV exports</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pre-wired MoR Webhooks (Lemon Squeezy / Dodo Payments)</span>
              </li>
            </ul>
          </div>

          {/* Webhook Testing Simulator */}
          <div className="p-4 rounded-lg border border-[#27272A] bg-[#0E0E11] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                <Webhook className="w-3.5 h-3.5 text-zinc-400" />
                <span>Merchant of Record Webhook Tester</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">/api/webhooks/billing</span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Test live monetization webhook verification without needing a real credit card. Simulates Lemon Squeezy or Dodo Payments checkout completion.
            </p>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setProvider("lemon_squeezy")}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-mono border transition-all ${
                  provider === "lemon_squeezy"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold"
                    : "bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                🍋 Lemon Squeezy
              </button>
              <button
                onClick={() => setProvider("dodo_payments")}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-mono border transition-all ${
                  provider === "dodo_payments"
                    ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300 font-bold"
                    : "bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                🦤 Dodo Payments
              </button>
            </div>

            <button
              onClick={handleSimulateWebhook}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {loading ? "Verifying Webhook..." : `Simulate ${provider === "lemon_squeezy" ? "Lemon Squeezy" : "Dodo Payments"} Upgrade Webhook`}
              </span>
            </button>

            {message && (
              <div className="p-2 rounded bg-zinc-900 border border-zinc-700/60 text-[11px] font-mono text-zinc-200">
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetAudits}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Free Tier (0/3)</span>
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={handleTogglePro}
              className="text-[11px] text-indigo-400 hover:text-indigo-300"
            >
              {isPro ? "Revert to Free" : "Toggle Pro Instantly"}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#27272A] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
