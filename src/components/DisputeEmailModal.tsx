"use client";

import { useState } from "react";
import { DeterministicAuditResult } from "@/lib/engine/types";
import { generateDisputeEmail } from "@/lib/utils/disputeEmail";
import { X, Check, Copy, Mail, ExternalLink, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface DisputeEmailModalProps {
  audit: DeterministicAuditResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DisputeEmailModal({ audit, isOpen, onClose }: DisputeEmailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !audit) return null;

  const emailData = generateDisputeEmail(audit);
  const overcharge = audit.reconciliation.netCustomerOvercharge;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${emailData.subject}\n\n${emailData.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const mailtoHref = `mailto:${encodeURIComponent(emailData.recipientHint)}?subject=${encodeURIComponent(
    emailData.subject
  )}&body=${encodeURIComponent(emailData.body)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-xl border border-[#27272A] bg-[#121215] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272A] flex items-center justify-between bg-[#18181B]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100 flex items-center space-x-2">
                <span>Vendor Remittance Dispute Draft</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/40">
                  {formatCurrency(overcharge, audit.currency)} Overcharge
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Formally itemized deduction notice ready for Accounts Payable remittance
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Metadata fields */}
          <div className="space-y-2 font-sans bg-[#0E0E11] p-3 rounded-lg border border-[#27272A]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono">Recipient:</span>
              <span className="text-zinc-300 font-medium">{emailData.recipientHint}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#27272A]/50">
              <span className="text-zinc-500 font-mono">Subject:</span>
              <span className="text-zinc-200 font-medium truncate max-w-md">{emailData.subject}</span>
            </div>
          </div>

          {/* Email Body Preview */}
          <div className="relative">
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Dispute Letter Preview
            </label>
            <textarea
              readOnly
              value={emailData.body}
              rows={14}
              className="w-full rounded-lg border border-[#27272A] bg-[#09090B] p-4 text-xs font-mono text-zinc-200 leading-relaxed focus:outline-none focus:border-indigo-500/50 resize-none select-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#27272A] bg-[#18181B] flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 hidden sm:block">
            Discrepancies deterministically audited against SQLite vendor baselines
          </div>
          <div className="flex items-center space-x-2.5">
            <a
              href={mailtoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#27272A] hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Mail App</span>
            </a>

            <button
              onClick={handleCopy}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full Dispute Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
