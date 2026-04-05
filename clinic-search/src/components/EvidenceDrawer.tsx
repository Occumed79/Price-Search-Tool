import { useState } from "react";
import { X, ExternalLink, CheckCircle, AlertCircle, XCircle, MinusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PriceResult } from "@workspace/api-client-react";

interface EvidenceDrawerProps {
  result: PriceResult | null;
  open: boolean;
  onClose: () => void;
  onReview: (id: number, verdict: string) => void;
}

const REVIEW_OPTIONS = [
  { value: "verified", label: "Verified", icon: CheckCircle, color: "text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20" },
  { value: "questionable", label: "Questionable", icon: AlertCircle, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20" },
  { value: "wrong_match", label: "Wrong Match", icon: XCircle, color: "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20" },
  { value: "no_longer_posted", label: "No Longer Posted", icon: MinusCircle, color: "text-slate-400 border-slate-500/30 bg-slate-500/10 hover:bg-slate-500/20" },
];

const sourceTypeLabels: Record<string, string> = {
  direct_clinic: "Direct clinic website",
  clinic_chain: "Official clinic chain location page",
  marketplace: "Marketplace/platform listing",
  pdf: "PDF fee schedule",
  rendered_js: "Rendered JS page",
  weak_reference: "Weak third-party reference",
};

export default function EvidenceDrawer({ result, open, onClose, onReview }: EvidenceDrawerProps) {
  const [activeReview, setActiveReview] = useState<string | null>(null);

  function handleReview(verdict: string) {
    if (!result) return;
    setActiveReview(verdict);
    onReview(result.id, verdict);
  }

  return (
    <AnimatePresence>
      {open && result && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 glass-sidebar border-l border-white/[0.08] overflow-y-auto"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/90">Evidence Detail</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="glass-card rounded-xl p-4">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Clinic</div>
                  <div className="text-sm font-semibold text-white/90 mb-1">{result.clinicName}</div>
                  <div className="text-xs text-white/40">{result.clinicType}</div>
                  {result.location && <div className="text-xs text-white/40 mt-1">{result.location}</div>}
                </div>

                {result.postedPrice && (
                  <div className="price-hit rounded-xl p-4">
                    <div className="text-[10px] text-green-400/60 uppercase tracking-wider mb-1">Posted Price</div>
                    <div className="text-3xl font-bold text-green-400 tabular-nums">{result.postedPrice}</div>
                    <div className="text-xs text-green-400/50 mt-1">{result.requestedService}</div>
                  </div>
                )}

                <div className="glass-card rounded-xl p-4">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Source</div>
                  <div className="text-xs text-cyan-400 break-all mb-2">{result.sourceUrl || "No URL"}</div>
                  {result.pageTitle && <div className="text-xs text-white/50 mb-2">"{result.pageTitle}"</div>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-white/30">Type:</span>
                    <span className="text-[10px] text-white/60">{sourceTypeLabels[result.sourceType] || result.sourceType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">Method:</span>
                    <span className="text-[10px] text-white/60">
                      {result.isPdf ? "PDF extraction" : result.isRendered ? "Playwright render" : "Raw HTML fetch"}
                    </span>
                  </div>
                  {result.sourceUrl && (
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] text-cyan-400/70 hover:text-cyan-300 mt-3 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Source Page
                    </a>
                  )}
                </div>

                {result.priceSnippet && (
                  <div className="glass-card rounded-xl p-4">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Matched Price Text</div>
                    <div className="text-xs text-white/60 font-mono leading-relaxed bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                      "{result.priceSnippet}"
                    </div>
                    {result.matchedServicePhrase && (
                      <div className="text-[10px] text-white/30 mt-2">
                        Matched phrase: <span className="text-white/50">{result.matchedServicePhrase}</span>
                      </div>
                    )}
                  </div>
                )}

                {result.extractionNotes && (
                  <div className="glass-card rounded-xl p-4">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Extraction Notes</div>
                    <div className="text-xs text-white/50 leading-relaxed">{result.extractionNotes}</div>
                  </div>
                )}

                <div className="glass-card rounded-xl p-4">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Manual Review</div>
                  <div className="grid grid-cols-2 gap-2">
                    {REVIEW_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        onClick={() => handleReview(value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${color} ${
                          (activeReview === value || result.userReview === value) ? "ring-1 ring-current" : ""
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-white/20 text-center pb-4">
                  Found at {new Date(result.foundAt).toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
