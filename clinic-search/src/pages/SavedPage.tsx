import { useState, useEffect, useRef } from "react";
import {
  Bookmark, Trash2, ExternalLink, Loader2, MapPin,
  ZoomIn, ZoomOut, RotateCcw, GitCompare, X,
  Phone, Printer, Mail, CheckSquare, Square, StickyNote, Check,
} from "lucide-react";
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

interface NppeContact {
  phone?: string;
  fax?: string;
}

interface NppeResult {
  basic?: { name?: string; organization_name?: string };
  addresses?: Array<{ telephone_number?: string; fax_number?: string; address_purpose?: string }>;
}

async function fetchNppesContact(name: string, city: string, state: string): Promise<NppeContact> {
  try {
    const params = new URLSearchParams({
      version: "2.1",
      organization_name: name.split(" ").slice(0, 3).join(" "), // first 3 words for better match
      city,
      state,
      limit: "5",
    });
    const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params}`);
    const data = await res.json() as { results?: NppeResult[] };
    const results = data.results ?? [];
    if (results.length === 0) return {};
    const match = results[0];
    const loc = match.addresses?.find((a) => a.address_purpose === "LOCATION") ?? match.addresses?.[0];
    return {
      phone: loc?.telephone_number?.replace(/[^0-9-().+ ]/g, "") || undefined,
      fax: loc?.fax_number?.replace(/[^0-9-().+ ]/g, "") || undefined,
    };
  } catch {
    return {};
  }
}

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

  // Multi-select for comparison
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  // Notes editing state: savedResult.id -> draft text
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [noteEditing, setNoteEditing] = useState<Record<number, boolean>>({});
  const [noteSaving, setNoteSaving] = useState<Record<number, boolean>>({});

  // NPPES contact cache: priceResult.id -> contact
  const [contacts, setContacts] = useState<Record<number, NppeContact>>({});
  const fetchedIds = useRef<Set<number>>(new Set());

  // Trigger backfill geocoding on mount
  useEffect(() => {
    fetch("/api/geocode-backfill", { method: "POST" })
      .then((r) => r.json())
      .then((data: { queued: number }) => {
        if (data.queued > 0) {
          setGeocodingActive(true);
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

  // Fetch NPPES contact info for visible results (one per 300ms to avoid rate limits)
  useEffect(() => {
    const toFetch = savedResults
      .filter((s) => s.result && !fetchedIds.current.has(s.result.id))
      .map((s) => s.result!);

    if (toFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const result of toFetch) {
        if (cancelled) break;
        if (fetchedIds.current.has(result.id)) continue;
        fetchedIds.current.add(result.id);

        const city = result.city || result.location || "";
        const state = result.state || "";
        if (!city && !state) continue;

        const contact = await fetchNppesContact(result.clinicName, city, state);
        if (!cancelled) {
          setContacts((prev) => ({ ...prev, [result.id]: contact }));
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    })();

    return () => { cancelled = true; };
  }, [savedResults]);

  async function handleDelete(id: number) {
    await deleteSaved.mutateAsync({ id });
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
  }

  async function handleReview(resultId: number, verdict: string) {
    await addReview.mutateAsync({
      data: { resultId, verdict: verdict as "verified" | "questionable" | "wrong_match" | "no_longer_posted" },
    });
    queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
  }

  async function saveNote(savedId: number) {
    setNoteSaving((p) => ({ ...p, [savedId]: true }));
    try {
      await fetch(`/api/saved-results/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteDrafts[savedId] ?? "" }),
      });
      setNoteEditing((p) => ({ ...p, [savedId]: false }));
      queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
    } finally {
      setNoteSaving((p) => ({ ...p, [savedId]: false }));
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEvidence(result: PriceResult) {
    setActiveResult(result);
    setDrawerOpen(true);
  }

  const withCoords = savedResults.filter(
    (s) => s.result && typeof s.result.latitude === "number" && typeof s.result.longitude === "number",
  );

  const selectedResults = savedResults.filter((s) => selectedIds.has(s.id));

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Bookmark className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white/90">Saved Results</h1>
          <p className="text-xs text-white/40">{savedResults.length} saved price findings</p>
        </div>
        {selectedIds.size >= 2 && (
          <button
            onClick={() => setCompareOpen(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold transition-all"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Compare {selectedIds.size} clinics
          </button>
        )}
        {selectedIds.size === 1 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Comparison Table Modal */}
      <AnimatePresence>
        {compareOpen && selectedResults.length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setCompareOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="glass-card rounded-2xl border border-white/[0.10] w-full max-w-5xl max-h-[85vh] overflow-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] sticky top-0 bg-[rgba(10,14,24,0.95)] backdrop-blur z-10">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white/80">Clinic Comparison</span>
                  <span className="text-[10px] text-white/30 border border-white/[0.08] px-1.5 py-0.5 rounded">
                    {selectedResults.length} clinics
                  </span>
                </div>
                <button onClick={() => setCompareOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-[10px] text-white/30 uppercase tracking-wider font-medium w-32">Field</td>
                      {selectedResults.map((s) => (
                        <td key={s.id} className="px-4 py-3 text-white/70 font-semibold min-w-[200px]">
                          {s.result?.clinicName ?? "—"}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Posted Price", render: (s: typeof selectedResults[0]) => s.result?.postedPrice ? <span className="text-green-400 font-bold text-base">{s.result.postedPrice}</span> : <span className="text-white/25">—</span> },
                      { label: "Service", render: (s: typeof selectedResults[0]) => s.result?.requestedService ?? "—" },
                      { label: "Clinic Type", render: (s: typeof selectedResults[0]) => s.result?.clinicType ?? "—" },
                      { label: "Location", render: (s: typeof selectedResults[0]) => [s.result?.location, s.result?.city, s.result?.state].filter(Boolean).join(", ") || "—" },
                      { label: "Phone", render: (s: typeof selectedResults[0]) => {
                        const c = s.result ? contacts[s.result.id] : undefined;
                        return c?.phone ? <a href={`tel:${c.phone}`} className="text-cyan-400/80 hover:text-cyan-300">{c.phone}</a> : <span className="text-white/20">—</span>;
                      }},
                      { label: "Fax", render: (s: typeof selectedResults[0]) => {
                        const c = s.result ? contacts[s.result.id] : undefined;
                        return c?.fax ? <span className="text-white/50">{c.fax}</span> : <span className="text-white/20">—</span>;
                      }},
                      { label: "Price Snippet", render: (s: typeof selectedResults[0]) => s.result?.priceSnippet ? <span className="font-mono text-white/40 line-clamp-2">"{s.result.priceSnippet}"</span> : <span className="text-white/20">—</span> },
                      { label: "Source", render: (s: typeof selectedResults[0]) => s.result?.sourceUrl ? <a href={s.result.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400/70 hover:text-cyan-300"><ExternalLink className="w-3 h-3" />Open</a> : <span className="text-white/20">—</span> },
                      { label: "Notes", render: (s: typeof selectedResults[0]) => s.notes ? <span className="text-cyan-400/60 italic">{s.notes}</span> : <span className="text-white/20">—</span> },
                      { label: "Saved", render: (s: typeof selectedResults[0]) => <span className="text-white/30">{new Date(s.savedAt).toLocaleDateString()}</span> },
                    ].map(({ label, render }) => (
                      <tr key={label} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-[10px] text-white/30 uppercase tracking-wider font-medium align-top">{label}</td>
                        {selectedResults.map((s) => (
                          <td key={s.id} className="px-4 py-3 text-white/60 align-top">{render(s)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
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
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setMapZoom((z) => Math.min(z + 0.8, 8))} className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors" title="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={() => setMapZoom((z) => Math.max(z - 0.8, 0.8))} className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors" title="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button onClick={() => setMapZoom(1)} className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors" title="Reset"><RotateCcw className="w-3 h-3" /></button>
          </div>
        </div>

        <div className="relative" style={{ height: 300 }}>
          {withCoords.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <MapPin className="w-8 h-8 text-white/10 mb-2" />
              <p className="text-xs text-white/20 text-center px-8">Save a result to pin it here. Coordinates geocoded automatically.</p>
            </div>
          )}
          <ComposableMap projection="geoAlbersUsa" style={{ width: "100%", height: "100%" }}>
            <ZoomableGroup zoom={mapZoom} minZoom={0.8} maxZoom={8} onMoveEnd={({ zoom }) => setMapZoom(zoom)}>
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: Array<{rsmKey: string}> }) =>
                  geographies.map((geo) => (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill="rgba(22,33,52,0.9)" stroke="rgba(100,116,139,0.2)" strokeWidth={0.5}
                      style={{ default: { outline: "none" }, hover: { fill: "rgba(30,45,68,0.95)", outline: "none" }, pressed: { outline: "none" } }}
                    />
                  ))
                }
              </Geographies>
              {withCoords.map((saved) => {
                const result = saved.result!;
                const color = bucketColors[result.sourceBucket] || "#64748b";
                const isHovered = hoveredId === saved.id;
                const isSelected = selectedIds.has(saved.id);
                return (
                  <Marker key={saved.id} coordinates={[result.longitude as number, result.latitude as number]}
                    onClick={() => openEvidence(result)} onMouseEnter={() => setHoveredId(saved.id)} onMouseLeave={() => setHoveredId(null)}>
                    {result.sourceBucket === "posted_price" && <circle r={isHovered ? 13 : 10} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3} style={{ pointerEvents: "none" }} />}
                    {isSelected && <circle r={12} fill="none" stroke="#06b6d4" strokeWidth={2} strokeOpacity={0.8} style={{ pointerEvents: "none" }} />}
                    <circle r={isHovered ? 7 : 5} fill={color} fillOpacity={isHovered ? 1 : 0.85} stroke="rgba(0,0,0,0.4)" strokeWidth={1} style={{ cursor: "pointer" }} />
                    {isHovered && (
                      <text textAnchor="middle" y={-14} style={{ fontSize: "9px", fill: "#fff", fontWeight: 700, pointerEvents: "none" }}>
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

      {/* Selection hint */}
      {savedResults.length >= 2 && selectedIds.size === 0 && (
        <p className="text-[11px] text-white/25 mb-3 text-center">
          Check clinics to compare them side by side
        </p>
      )}

      {/* Saved results list */}
      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>}

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

            const contact = contacts[result.id];
            const isSelected = selectedIds.has(saved.id);
            const isEditingNote = noteEditing[saved.id];
            const currentNote = noteDrafts[saved.id] ?? saved.notes ?? "";

            return (
              <motion.div
                key={saved.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card rounded-xl p-4 border transition-all ${
                  isSelected
                    ? "border-cyan-500/40 bg-cyan-500/[0.04]"
                    : result.sourceBucket === "posted_price"
                    ? "price-hit hover:border-green-500/25"
                    : "border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(saved.id)}
                    className={`mt-0.5 shrink-0 transition-colors ${isSelected ? "text-cyan-400" : "text-white/20 hover:text-white/50"}`}
                    title="Select for comparison"
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white/90 truncate mb-0.5">{result.clinicName}</div>
                        <div className="text-xs text-white/40">
                          {result.clinicType} · {result.requestedService}
                          {result.location && ` · ${result.location}`}
                        </div>

                        {/* Contact info from NPPES */}
                        {contact && (contact.phone || contact.fax) && (
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-[11px] text-cyan-400/70 hover:text-cyan-300 transition-colors">
                                <Phone className="w-2.5 h-2.5" />
                                {contact.phone}
                              </a>
                            )}
                            {contact.fax && (
                              <span className="flex items-center gap-1 text-[11px] text-white/35">
                                <Printer className="w-2.5 h-2.5" />
                                {contact.fax}
                              </span>
                            )}
                          </div>
                        )}
                        {contact && !contact.phone && !contact.fax && (
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-white/15">
                            <Phone className="w-2.5 h-2.5" />
                            Not found in NPI registry
                          </div>
                        )}
                        {!contact && result.city && (
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-white/15">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            Looking up contact...
                          </div>
                        )}

                        {result.priceSnippet && (
                          <div className="text-[11px] text-white/35 font-mono line-clamp-1 mt-1.5">
                            "{result.priceSnippet}"
                          </div>
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

                    {/* Notes section */}
                    <div className="mt-2.5">
                      {isEditingNote ? (
                        <div className="flex items-start gap-2">
                          <textarea
                            autoFocus
                            value={currentNote}
                            onChange={(e) => setNoteDrafts((p) => ({ ...p, [saved.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveNote(saved.id);
                              if (e.key === "Escape") setNoteEditing((p) => ({ ...p, [saved.id]: false }));
                            }}
                            placeholder="Add a note about this clinic..."
                            rows={2}
                            className="flex-1 glass-input rounded-lg px-3 py-1.5 text-xs text-white/75 placeholder-white/20 focus:outline-none resize-none"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => saveNote(saved.id)}
                              disabled={noteSaving[saved.id]}
                              className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                              title="Save note (⌘+Enter)"
                            >
                              {noteSaving[saved.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => setNoteEditing((p) => ({ ...p, [saved.id]: false }))}
                              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setNoteDrafts((p) => ({ ...p, [saved.id]: saved.notes ?? "" }));
                            setNoteEditing((p) => ({ ...p, [saved.id]: true }));
                          }}
                          className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/55 transition-colors"
                        >
                          <StickyNote className="w-3 h-3" />
                          {saved.notes ? (
                            <span className="text-cyan-400/55 italic line-clamp-1">{saved.notes}</span>
                          ) : (
                            "Add note"
                          )}
                        </button>
                      )}
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/[0.04]">
                      <button onClick={() => openEvidence(result)} className="text-[11px] text-white/40 hover:text-white/70 transition-colors">
                        View Evidence
                      </button>
                      {result.sourceUrl && (
                        <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-cyan-400/60 hover:text-cyan-300 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          Source
                        </a>
                      )}
                      {contact?.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-[11px] text-white/30 hover:text-cyan-300 transition-colors">
                          <Phone className="w-3 h-3" />
                          Call
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
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <EvidenceDrawer result={activeResult} open={drawerOpen} onClose={() => setDrawerOpen(false)} onReview={handleReview} />
    </div>
  );
}
