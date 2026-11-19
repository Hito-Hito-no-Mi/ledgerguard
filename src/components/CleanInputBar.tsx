"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Zap, RefreshCw, Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { DeterministicAuditResult } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils/currency";

interface CleanInputBarProps {
  currentAudit: DeterministicAuditResult | null;
  isAuditing: boolean;
  onAuditSample: (sampleType: "broken" | "clean") => Promise<void>;
  onAuditFile: (file: File) => Promise<void>;
  onAuditText: (text: string) => Promise<void>;
  onNewAudit: () => void;
}

export function CleanInputBar({
  currentAudit,
  isAuditing,
  onAuditSample,
  onAuditFile,
  onAuditText,
  onNewAudit,
}: CleanInputBarProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPasteText, setShowPasteText] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await onAuditFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await onAuditFile(file);
    }
  };

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) return;
    await onAuditText(pastedText);
    setShowPasteText(false);
  };

  // State A: When an audit is active -> Collapse into a slim bar
  if (currentAudit) {
    return (
      <div className="rounded-xl border border-[#27272A] bg-[#111113] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 shrink-0">
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-zinc-400">Auditing:</span>
              <span className="text-zinc-100 font-semibold truncate">
                {currentAudit.invoiceNumber}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 truncate hidden xs:inline">
                {currentAudit.vendorName}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Billed: {formatCurrency(currentAudit.reconciliation.claimedGrandTotal, currentAudit.currency)}
              {" "}• Dated: {currentAudit.invoiceDate}
            </div>
          </div>
        </div>

        <button
          onClick={onNewAudit}
          className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272A] text-xs font-medium transition-all shrink-0 self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
          <span>New Audit</span>
        </button>
      </div>
    );
  }

  // State B: When NO invoice is active -> Crisp, compact dropzone with prominent test button
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 sm:p-6 space-y-4">
      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-[#27272A] hover:border-zinc-500 bg-[#0E0E11]/80 hover:bg-[#0E0E11]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
          className="hidden"
          onChange={handleFileChange}
          disabled={isAuditing}
        />

        <div className="p-3 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 mb-2.5">
          {isAuditing ? (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          ) : (
            <UploadCloud className="w-5 h-5 text-zinc-300" />
          )}
        </div>

        <p className="text-sm font-medium text-zinc-200">
          {isAuditing
            ? "Auditing document with Gemini 2.5 Flash & TypeScript..."
            : "Drop supplier invoice (PDF, Image, CSV) or click to browse"}
        </p>
        <p className="text-xs text-zinc-500 mt-1 font-mono">
          Strict deterministic math recalculation & historical baseline price-creep checks
        </p>
      </div>

      {/* Prominent Instant Demo Action Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        <button
          onClick={() => onAuditSample("broken")}
          disabled={isAuditing}
          className="w-full flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-red-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isAuditing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 fill-white" />
          )}
          <span>Test With Broken Freight Invoice</span>
        </button>

        <button
          onClick={() => onAuditSample("clean")}
          disabled={isAuditing}
          className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-3 rounded-xl bg-[#18181B] hover:bg-[#202024] text-zinc-300 hover:text-white border border-[#27272A] text-xs font-medium transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Test With Clean Invoice</span>
        </button>
      </div>

      {/* Subtle Paste Raw Text Option */}
      <div className="pt-1 text-center">
        <button
          onClick={() => setShowPasteText(!showPasteText)}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center space-x-1 font-mono"
        >
          <span>or paste invoice text / CSV</span>
          {showPasteText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showPasteText && (
          <div className="mt-3 space-y-2 text-left">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste raw invoice text, PO, or CSV line items here..."
              rows={5}
              className="w-full rounded-lg border border-[#27272A] bg-[#0E0E11] p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 resize-none"
            />
            <button
              onClick={handleTextSubmit}
              disabled={isAuditing || !pastedText.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition-colors"
            >
              Audit Pasted Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
