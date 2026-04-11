import { useState } from "react";
import { ExternalLink, Copy, Bookmark, BookmarkCheck, FileText, Globe, Store, Database, Link2, CheckCircle, AlertCircle, XCircle, MinusCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { PriceResult } from "@workspace/api-client-react";
import EvidenceDrawer from "./EvidenceDrawer";

interface ResultCardProps {
  result: PriceResult;
  onSave: (id: number) => void;
  onReview: (id: number, verdict: string) => void;
  isSaving?: boolean;
}

const sourceTypeConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{className?: string}> }> = {
  direct_clinic: { label: "Direct Clinic", className: "badge-direct", icon: Globe },
  clinic_chain: { label: "Clinic Chain", className: "badge-chain", icon: Link2 },
  marketplace: { label: "Marketplace", className: "badge-marketplace", icon: Store },
  pdf: { label: "PDF Schedule", className: "badge-pdf", icon: FileText },
  rendered_js: { label: "JS Page", className: "badge-chain", icon: Globe },
  weak_reference: { label: "Reference", className: "badge-weak", icon: Database },
};

const reviewConfig: Record<string, { icon: React.ComponentType<{className?: string}>; color: string; label: string }> = {
  verified: { icon: CheckCircle, color: "text-green-400", label: "Verified" },
  questionable: { icon: AlertCircle, color: "text-yellow-400", label: "Questionable" },
  wrong_match: { icon: XCircle, color: "text-red-400", label: "Wrong Match" },
  no_longer_posted: { icon: MinusCircle, color: "text-gray-400", label: "No Longer Posted" },
};

export default function ResultCard({ result, onSave, onReview, isSaving }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sourceConfig = sourceTypeConfig[result.sourceType] || sourceTypeConfig.weak_reference;
  const SourceIcon = sourceConfig.icon;

  const review = result.userReview ? reviewConfig[result.userReview] : null;
  const ReviewIcon = review?.icon;

  function handleCopy() {
    if (result.sourceUrl) {
      navigator.clipboard.writeText(result.sourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isPosted = result.sourceBucket === "posted_price";
  const isNoPrice = result.sourceBucket === "clinic_no_price";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card rounded-xl p-4 border transition-all duration-200 hover:border-white/20 ${
          isPosted ? "price-hit" : isNoPrice ? "border-white/[0.06]" : "border-yellow-500/10"
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-white/90 truncate max-w-[280px]">
                {result.clinicName}
              </span>
              {review && ReviewIcon && (
                <span className={`flex items-center gap-1 text-[10px] font-medium ${review.color}`}>
                  <ReviewIcon className="w-3 h-3" />
                  {review.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-white/40 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">
                {result.clinicType}
              </span>
              <span className={`text-[10px] font-medium border px-1.5 py-0.5 rounded flex items-center gap-1 ${sourceConfig.className}`}>
                <SourceIcon className="w-2.5 h-2.5" />
                {sourceConfig.label}
              </span>
              {result.isPdf && (
                <span className="text-[10px] font-medium badge-pdf border px-1.5 py-0.5 rounded">PDF</span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            {isPosted && result.postedPrice ? (
              <div>
                <div className="text-2xl font-bold text-green-400 tabular-nums">{result.postedPrice}</div>
                <div className="text-[10px] text-green-400/60 font-medium">posted price</div>
              </div>
            ) : isNoPrice ? (
              <div className="text-xs text-white/30 text-right max-w-[120px]">No posted price</div>
            ) : (
              <div className="text-xs text-yellow-500/70">Possible match</div>
            )}
          </div>
        </div>

        {result.location && (
          <div className="text-xs text-white/40 mb-2">
            {result.location}{result.city && result.city !== result.location ? ` — ${result.city}` : ""}
            {result.state ? `, ${result.state}` : ""}
          </div>
        )}

        <div className="text-xs text-white/50 mb-2">
          <span className="text-white/30">Service: </span>{result.requestedService}
        </div>

        {result.priceSnippet && (
          <div className="text-[11px] text-white/45 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 mb-3 font-mono leading-relaxed line-clamp-2">
            "{result.priceSnippet}"
          </div>
        )}

        {isNoPrice && !result.postedPrice && (
          <div className="text-xs text-white/35 italic mb-3">
            No actual posted public price found.
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {result.sourceUrl && (
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-cyan-400/70 hover:text-cyan-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open Source
              </a>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy URL"}
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              <FileText className="w-3 h-3" />
              Evidence
            </button>
          </div>

          <button
            onClick={() => onSave(result.id)}
            disabled={isSaving || result.isSaved}
            className={`flex items-center gap-1.5 text-[11px] rounded-md border px-2 py-1 transition-colors min-w-fit ${
              result.isSaved
                ? "text-cyan-300 border-cyan-500/40 bg-cyan-500/10 cursor-default"
                : "text-white/70 border-white/15 hover:text-cyan-300 hover:border-cyan-500/40 cursor-pointer"
            }`}
          >
            {result.isSaved ? (
              <><BookmarkCheck className="w-3 h-3" /> Saved</>
            ) : (
              <><Bookmark className="w-3 h-3" /> Save</>
            )}
          </button>
        </div>
      </motion.div>

      <EvidenceDrawer
        result={result}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReview={onReview}
      />
    </>
  );
}
