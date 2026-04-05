import { useListSearches } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Clock, CheckCircle, Loader2, XCircle, MapPin, ChevronRight } from "lucide-react";

const statusConfig = {
  complete: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400" },
  running: { icon: Loader2, color: "text-cyan-400", bg: "bg-cyan-400" },
  pending: { icon: Loader2, color: "text-cyan-400/50", bg: "bg-cyan-400/50" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-400" },
};

export default function SearchesPage() {
  const { data: searches = [], isLoading } = useListSearches();
  const [, navigate] = useLocation();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white/90">Search History</h1>
          <p className="text-xs text-white/40">Recent clinic price searches</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      )}

      {!isLoading && searches.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center border border-white/[0.06]">
          <Clock className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/40">No searches yet. Run your first search to see history here.</p>
        </div>
      )}

      <div className="space-y-2">
        {searches.map((search, i) => {
          const config = statusConfig[search.status as keyof typeof statusConfig] || statusConfig.pending;
          const Icon = config.icon;

          return (
            <motion.div
              key={search.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card rounded-xl p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group"
              onClick={() => navigate(`/?search=${search.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${config.bg} ${search.status === "running" ? "animate-pulse" : ""}`} />
                    <span className="text-sm font-medium text-white/80 capitalize">{search.serviceType}</span>
                    <span className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">
                      {search.clinicType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <MapPin className="w-3 h-3" />
                    {search.location}
                    <span className="text-white/20">·</span>
                    {search.radiusMiles}mi radius
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {search.status === "complete" && (
                    <div>
                      <div className="text-sm font-semibold text-green-400">{search.postedPriceCount}</div>
                      <div className="text-[10px] text-white/30">posted prices</div>
                      <div className="text-[10px] text-white/20">{search.resultCount} total</div>
                    </div>
                  )}
                  {search.status === "running" && (
                    <div className="flex items-center gap-1 text-xs text-cyan-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Running
                    </div>
                  )}
                  {search.status === "failed" && (
                    <span className="text-xs text-red-400/70">Failed</span>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
              </div>

              <div className="text-[10px] text-white/25 mt-2">
                {new Date(search.createdAt).toLocaleString()}
                {search.completedAt && ` · completed ${new Date(search.completedAt).toLocaleTimeString()}`}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
