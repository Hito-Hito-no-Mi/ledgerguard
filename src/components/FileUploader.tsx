"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Zap, CheckCircle, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";

interface FileUploaderProps {
  onAuditSample: (sampleType: "broken" | "clean") => Promise<void>;
  onAuditFile: (file: File) => Promise<void>;
  onAuditText: (text: string) => Promise<void>;
  isAuditing: boolean;
  userState?: {
    isPro: boolean;
    auditCount: number;
    maxFreeAudits: number;
  };
  onOpenUpgrade?: () => void;
}

export function FileUploader({
  onAuditSample,
  onAuditFile,
  onAuditText,
  isAuditing,
  userState,
  onOpenUpgrade,
}: FileUploaderProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "text">("upload");
  const [isDragOver, setIsDragOver] = useState(false);
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = userState?.isPro ?? false;
  const isQuotaReached = !isPro && (userState?.auditCount ?? 0) >= (userState?.maxFreeAudits ?? 3);

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
    if (!rawText.trim()) return;
    await onAuditText(rawText);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Instant Demo Hero Card */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#121215] to-[#121215] p-4 sm:p-5 shadow-glow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30">
            Instant 2-Second Demo
          </span>
          <span className="text-zinc-500 text-[11px] font-mono">Zero setup required</span>
        </div>

        <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
          Catch Overcharges in Seconds
        </h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Test LedgerGuard on an intentionally flawed wholesale freight invoice containing a hidden unit-price spike (+23.4%), duplicate surcharge, and tax math error.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* Main Demo Action Button */}
          <button
            onClick={() => onAuditSample("broken")}
            disabled={isAuditing}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-red-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {isAuditing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-white" />
            )}
            <span className="font-semibold tracking-tight">Load Sample Broken Invoice</span>
          </button>

          {/* Clean Sample Action Button */}
          <button
            onClick={() => onAuditSample("clean")}
            disabled={isAuditing}
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#222227] text-zinc-300 hover:text-white border border-[#27272A] hover:border-zinc-500 text-xs transition-all disabled:opacity-60"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Clean Sample</span>
          </button>
        </div>
      </div>

      {/* Upload & Paste Tabs */}
      <div className="flex-1 rounded-xl border border-[#27272A] bg-[#121215] p-4 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-3 mb-4">
          <div className="flex items-center space-x-1 bg-[#18181B] p-1 rounded-lg border border-[#27272A]">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === "upload"
                  ? "bg-[#27272A] text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Upload Document
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === "text"
                  ? "bg-[#27272A] text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Paste Raw Invoice
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400 font-mono">
            <span>Powered by</span>
            <span className="text-indigo-400 font-semibold">Gemini 2.5 Flash</span>
          </div>
        </div>

        {activeTab === "upload" ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] ${
              isDragOver
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-[#27272A] hover:border-zinc-500 bg-[#0E0E11]/60"
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

            <div className="p-3.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              {isAuditing ? (
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <p className="text-sm font-medium text-zinc-200">
              {isAuditing ? "Auditing Document..." : "Drag & drop your invoice here"}
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              Supports PDF, PNG, JPG images, or CSV spreadsheets
            </p>

            <div className="mt-4 flex items-center space-x-2 text-[11px] text-zinc-400 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">PDF</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">PNG</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">JPG</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">CSV</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-3">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw vendor invoice text, PO, or CSV text here..."
              rows={8}
              className="flex-1 w-full rounded-lg border border-[#27272A] bg-[#0E0E11] p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 resize-none"
            />
            <button
              onClick={handleTextSubmit}
              disabled={isAuditing || !rawText.trim()}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              {isAuditing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>Run Audit on Raw Text</span>
            </button>
          </div>
        )}

        {/* Free Tier Callout if nearing limit */}
        {isQuotaReached && (
          <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Free tier limit reached (3/3 audits used)</span>
            </div>
            <button
              onClick={onOpenUpgrade}
              className="text-amber-200 underline font-medium hover:text-white ml-2 text-[11px]"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
