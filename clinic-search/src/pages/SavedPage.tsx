import { useState, useEffect } from "react";
import { Bookmark, Trash2, ExternalLink, Loader2, MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListSavedResults,
  useDeleteSavedResult,
  useAddManualReview,
  getListSavedResultsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import EvidenceDrawer from "@/components/EvidenceDrawer";
import type { PriceResult } from "@workspace/api-client-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const bucketColors: Record<string, string> = {
  posted_price: "#4ade80",
  clinic_no_price: "#64748b",
  possible_match: "#fbbf24",
};

export default function SavedPage() {
  const queryClient = useQueryClient();
  const { data: savedResults = [], isLoading } = useListSavedResults();
  const deleteSaved = useDeleteSavedResult();
  const addReview = useAddManualReview();

  const [activeResult, setActiveResult] = useState<PriceResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [geocodingActive, setGeocodingActive] = useState(false);

  // On mount: trigger backfill geocoding for any saved results that lack coordinates
  useEffect(() => {
    fetch("/api/geocode-backfill", { method: "POST" })
      .then((r) => r.json())
      .then((data: { queued: number }) => {
        if (data.queued > 0) {
          setGeocodingActive(true);
          // Wait for geocoding to complete (1.1s per result + buffer), then refresh
          const delay = Math.min(data.queued * 1200 + 2000, 30000);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
            setGeocodingActive(false);
          }, delay);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: number) {
    await deleteSaved.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
  }

  async function handleReview(resultId: number, verdict: string) {
    await addReview.mutateAsync({
      data: {
        resultId,
        verdict: verdict as "verified" | "questionable" | "wrong_match" | "no_longer_posted",
      },
    });
    queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
  }

  function openEvidence(result: PriceResult) {
    setActiveResult(result);
    setDrawerOpen(true);
  }

  const withCoords = savedResults.filter(
    (s) => s.result && typeof s.result.latitude === "number" && typeof s.result.longitude === "number",
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Bookmark className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white/90">Saved Results</h1>
          <p className="text-xs text-white/40">{savedResults.length} saved price findings</p>
        </div>
      </div>

      {/* USA Map */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06] mb-6">
        <div className="px-4 pt-3 pb-1 border-b border-white/[0.04] flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-cyan-400/60" />
          <span className="text-xs font-medium text-white/50">Clinic Locations Map</span>
          <span className="text-[10px] text-white/25 ml-2">{withCoords.length} pinned</span>
          {geocodingActive && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400/60 ml-2">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Geocoding...
            </span>
          )}
          {/* Zoom controls */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setMapZoom((z) => Math.min(z + 0.8, 8))}
              className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMapZoom((z) => Math.max(z - 0.8, 0.8))}
              className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMapZoom(1)}
              className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
              title="Reset zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="relative" style={{ height: 340 }}>
          {withCoords.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <MapPin className="w-8 h-8 text-white/10 mb-2" />
              <p className="text-xs text-white/25 text-center px-8">
                Save a result to pin it here.<br />
                <span className="text-white/15">Coordinates are geocoded automatically on save.</span>
              </p>
            </div>
          )}

          <ComposableMap
            projection="geoAlbersUsa"
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup
              zoom={mapZoom}
              minZoom={0.8}
              maxZoom={8}
              onMoveEnd={({ zoom }) => setMapZoom(zoom)}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: Array<{rsmKey: string}> }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="rgba(22, 33, 52, 0.9)"
                      stroke="rgba(100, 116, 139, 0.2)"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "rgba(30, 45, 68, 0.95)", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {withCoords.map((saved) => {
                const result = saved.result!;
                const lat = result.latitude as number;
                const lng = result.longitude as number;
                const color = bucketColors[result.sourceBucket] || "#64748b";
                const isHovered = hoveredId === saved.id;

                return (
                  <Marker
                    key={saved.id}
                    coordinates={[lng, lat]}
                    onClick={() => openEvidence(result)}
                    onMouseEnter={() => setHoveredId(saved.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Outer ring for posted prices */}
                    {result.sourceBucket === "posted_price" && (
                      <circle
                        r={isHovered ? 13 : 10}
                        fill="none"
                        stroke={color}
                        strokeWidth={1}
                        strokeOpacity={0.3}
                        style={{ pointerEvents: "none", transition: "r 0.15s" }}
                      />
                    )}
                    <circle
                      r={isHovered ? 7 : 5}
                      fill={color}
                      fillOpacity={isHovered ? 1 : 0.85}
                      stroke="rgba(0,0,0,0.4)"
                      strokeWidth={1}
                      style={{ cursor: "pointer", transition: "r 0.15s, fill-opacity 0.15s" }}
                    />
                    {isHovered && (
                      <text
                        textAnchor="middle"
                        y={-14}
                        style={{ fontSize: "9px", fill: "#ffffff", fontWeight: 700, pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                      >
                        {result.postedPrice || result.clinicName?.split(" ").slice(0, 2).join(" ")}
                      </text>
                    )}
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center gap-4">
          {Object.entries({ posted_price: "Posted Price", clinic_no_price: "No Price", possible_match: "Possible Match" }).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bucketColors[key] }} />
              <span className="text-[10px] text-white/30">{label}</span>
            </div>
          ))}
          <span className="text-[10px] text-white/20 ml-auto">Scroll to zoom · Drag to pan · Click pin for details</span>
        </div>
      </div>

      {/* Saved results list */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      )}

      {!isLoading && savedResults.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center border border-white/[0.06]">
          <Bookmark className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/40">No saved results yet. Save price results from the search page.</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {savedResults.map((saved, i) => {
            const result = saved.result;
            if (!result) return null;

            return (
              <motion.div
                key={saved.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card rounded-xl p-4 border transition-all ${
                  result.sourceBucket === "posted_price"
                    ? "price-hit hover:border-green-500/25"
                    : "border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white/90 truncate">{result.clinicName}</span>
                    </div>
                    <div className="text-xs text-white/40 mb-1">
                      {result.clinicType} · {result.requestedService}
                      {result.location && ` · ${result.location}`}
                    </div>
                    {result.priceSnippet && (
                      <div className="text-[11px] text-white/35 font-mono line-clamp-1">
                        "{result.priceSnippet}"
                      </div>
                    )}
                    {saved.notes && (
                      <div className="text-[11px] text-cyan-400/50 mt-1 italic">Note: {saved.notes}</div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {result.postedPrice ? (
                      <div className="text-xl font-bold text-green-400">{result.postedPrice}</div>
                    ) : (
                      <span className="text-xs text-white/30">No price</span>
                    )}
                    <div className="text-[10px] text-white/25 mt-1">
                      {new Date(saved.savedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                  <button
                    onClick={() => openEvidence(result)}
                    className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                  >
                    View Evidence
                  </button>
                  {result.sourceUrl && (
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-cyan-400/60 hover:text-cyan-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(saved.id)}
                    disabled={deleteSaved.isPending}
                    className="ml-auto flex items-center gap-1 text-[11px] text-white/25 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <EvidenceDrawer
        result={activeResult}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReview={handleReview}
      />
    </div>
  );
}
