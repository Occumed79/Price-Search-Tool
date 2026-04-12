import { useState, useEffect } from "react";
import {
  Bookmark, Trash2, ExternalLink, Loader2, MapPin, ZoomIn, ZoomOut,
  RotateCcw, Phone, Printer, CheckSquare, Square, BarChart2,
  X, Pencil, Check, ChevronDown, ChevronUp, DollarSign,
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

interface ContactInfo {
  phone?: string;
  fax?: string;
  loading: boolean;
}

interface PriceBreakdown {
  interpretationIncluded: "" | "yes" | "no" | "unknown";
  facilityFee: "" | "none" | "separate" | "unknown";
  allInclusive: "" | "yes" | "no" | "partial" | "unknown";
  paymentTerms: "" | "upfront" | "net30" | "net60" | "pos_only" | "unknown";
  confirmedBy: "" | "website" | "phone" | "email";
  confirmedDate: string;
}

const EMPTY_BREAKDOWN: PriceBreakdown = {
  interpretationIncluded: "",
  facilityFee: "",
  allInclusive: "",
  paymentTerms: "",
  confirmedBy: "",
  confirmedDate: "",
};

async function lookupNPPES(clinicName: string, location: string): Promise<{ phone?: string; fax?: string }> {
  try {
    const state = location?.split(",").pop()?.trim().slice(0, 2).toUpperCase() || "";
    const name = encodeURIComponent(clinicName.slice(0, 60));
    const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&organization_name=${name}&state=${state}&limit=5`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = await res.json() as {
      results?: Array<{
        addresses?: Array<{ telephone_number?: string; fax_number?: string; address_purpose?: string }>;
      }>;
    };
    const results = data.results || [];
    if (!results.length) return {};
    const r = results[0];
    const addrs = r.addresses || [];
    const loc = addrs.find(a => a.address_purpose === "LOCATION") || addrs[0];
    const fmt = (n?: string) => n?.replace(/[^0-9]/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") || undefined;
    return { phone: fmt(loc?.telephone_number), fax: fmt(loc?.fax_number) };
  } catch {
    return {};
  }
}

async function patchSaved(id: number, payload: { notes?: string; priceBreakdown?: string }) {
  const res = await fetch(`/api/saved-results/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update");
}

// Badge helpers
function BreakdownBadge({ value, positiveValues, negativeValues }: { value: string; positiveValues: string[]; negativeValues: string[] }) {
  if (!value || value === "") return null;
  const isPositive = positiveValues.includes(value);
  const isNegative = negativeValues.includes(value);
  const color = isPositive ? "text-green-400 bg-green-400/10 border-green-400/20"
    : isNegative ? "text-red-400 bg-red-400/10 border-red-400/20"
    : "text-white/40 bg-white/[0.05] border-white/10";
  const label = value.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${color}`}>{label}</span>;
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});
  const [savingNotes, setSavingNotes] = useState<Set<number>>(new Set());
  const [contactInfo, setContactInfo] = useState<Record<number, ContactInfo>>({});
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  // Price breakdown state
  const [editingBreakdown, setEditingBreakdown] = useState<Record<number, PriceBreakdown>>({});
  const [savingBreakdown, setSavingBreakdown] = useState<Set<number>>(new Set());
  const [breakdownOpen, setBreakdownOpen] = useState<Set<number>>(new Set());

  async function handleDelete(id: number) {
    await deleteSaved.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleReview(resultId: number, verdict: string) {
    await addReview.mutateAsync({
      data: { resultId, verdict: verdict as "verified" | "questionable" | "wrong_match" | "no_longer_posted" },
    });
    queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
  }

  function openEvidence(result: PriceResult) {
    setActiveResult(result);
    setDrawerOpen(true);
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function toggleCollapse(id: number) {
    setCollapsedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function toggleBreakdown(id: number) {
    setBreakdownOpen(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function startEditNotes(id: number, current: string | null | undefined) {
    setEditingNotes(prev => ({ ...prev, [id]: current || "" }));
  }

  async function saveNotes(id: number) {
    const notes = editingNotes[id] ?? "";
    setSavingNotes(prev => new Set(prev).add(id));
    try {
      await patchSaved(id, { notes });
      queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
      setEditingNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setSavingNotes(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  function cancelEditNotes(id: number) {
    setEditingNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  function openBreakdownEdit(id: number, existing: string | null | undefined) {
    let parsed = { ...EMPTY_BREAKDOWN };
    if (existing) {
      try { parsed = { ...EMPTY_BREAKDOWN, ...JSON.parse(existing) }; } catch { /* ignore */ }
    }
    setEditingBreakdown(prev => ({ ...prev, [id]: parsed }));
    setBreakdownOpen(prev => new Set(prev).add(id));
  }

  function updateBreakdownField<K extends keyof PriceBreakdown>(id: number, field: K, value: PriceBreakdown[K]) {
    setEditingBreakdown(prev => ({
      ...prev,
      [id]: { ...(prev[id] || EMPTY_BREAKDOWN), [field]: value },
    }));
  }

  async function saveBreakdown(id: number) {
    const bd = editingBreakdown[id];
    if (!bd) return;
    setSavingBreakdown(prev => new Set(prev).add(id));
    try {
      await patchSaved(id, { priceBreakdown: JSON.stringify(bd) });
      queryClient.invalidateQueries({ queryKey: getListSavedResultsQueryKey() });
      setEditingBreakdown(prev => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setSavingBreakdown(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  function cancelBreakdown(id: number) {
    setEditingBreakdown(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  function parseBreakdown(raw: string | null | undefined): PriceBreakdown | null {
    if (!raw) return null;
    try { return { ...EMPTY_BREAKDOWN, ...JSON.parse(raw) }; } catch { return null; }
  }

  useEffect(() => {
    savedResults.forEach(saved => {
      if (saved.result && !contactInfo[saved.id]) {
        setContactInfo(prev => ({ ...prev, [saved.id]: { loading: true } }));
        lookupNPPES(saved.result!.clinicName || "", saved.result!.location || "").then(info => {
          setContactInfo(prev => ({ ...prev, [saved.id]: { ...info, loading: false } }));
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedResults.length]);

  const withCoords = savedResults.filter(
    (s) => s.result && typeof s.result.latitude === "number" && typeof s.result.longitude === "number",
  );
  const selectedResults = savedResults.filter(s => selectedIds.has(s.id));

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
          <button onClick={() => setCompareOpen(true)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-colors">
            <BarChart2 className="w-3.5 h-3.5" />Compare {selectedIds.size} clinics
          </button>
        )}
        {selectedIds.size === 1 && <p className="ml-auto text-[11px] text-white/30">Select 1 more to compare</p>}
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {compareOpen && selectedResults.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setCompareOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1623] border border-white/10 rounded-2xl p-6 max-w-5xl w-full max-h-[85vh] overflow-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white/90">Clinic Comparison</span>
                </div>
                <button onClick={() => setCompareOpen(false)} className="text-white/30 hover:text-white/70"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <td className="py-2 pr-4 text-white/40 font-medium w-36">Field</td>
                      {selectedResults.map(s => (
                        <td key={s.id} className="py-2 px-3 text-white/70 font-semibold">{s.result?.clinicName || "—"}</td>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {[
                      { label: "Price", fn: (r: PriceResult) => r.postedPrice || "No price found", bold: true },
                      { label: "Price Range", fn: (r: PriceResult) => r.priceMin && r.priceMax ? `$${r.priceMin} – $${r.priceMax}` : "—", bold: false },
                      { label: "Service", fn: (r: PriceResult) => r.requestedService, bold: false },
                      { label: "Clinic Type", fn: (r: PriceResult) => r.clinicType, bold: false },
                      { label: "Location", fn: (r: PriceResult) => r.location, bold: false },
                      { label: "Source", fn: (r: PriceResult) => r.sourceBucket?.replace(/_/g, " "), bold: false },
                      { label: "Price Snippet", fn: (r: PriceResult) => r.priceSnippet ? `"${r.priceSnippet.slice(0, 60)}…"` : "—", bold: false },
                    ].map(row => (
                      <tr key={row.label}>
                        <td className="py-2 pr-4 text-white/35 font-medium">{row.label}</td>
                        {selectedResults.map(s => (
                          <td key={s.id} className={`py-2 px-3 ${row.bold ? "text-green-400 font-bold text-sm" : "text-white/60"}`}>
                            {s.result ? (row.fn(s.result) || "—") : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Breakdown fields in compare */}
                    {(["Interp. Included", "Facility Fee", "All-Inclusive", "Payment Terms"] as const).map((label, li) => {
                      const keys: (keyof PriceBreakdown)[] = ["interpretationIncluded", "facilityFee", "allInclusive", "paymentTerms"];
                      const k = keys[li];
                      return (
                        <tr key={label}>
                          <td className="py-2 pr-4 text-white/35 font-medium">{label}</td>
                          {selectedResults.map(s => {
                            const bd = parseBreakdown((s as { priceBreakdown?: string }).priceBreakdown);
                            const val = bd?.[k] || "—";
                            return <td key={s.id} className="py-2 px-3 text-white/60">{val.replace(/_/g, " ")}</td>;
                          })}
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="py-2 pr-4 text-white/35 font-medium">Phone</td>
                      {selectedResults.map(s => {
                        const c = contactInfo[s.id];
                        return <td key={s.id} className="py-2 px-3 text-white/60">{c?.loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : c?.phone || "—"}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-white/35 font-medium">Fax</td>
                      {selectedResults.map(s => {
                        const c = contactInfo[s.id];
                        return <td key={s.id} className="py-2 px-3 text-white/60">{c?.loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : c?.fax || "—"}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-white/35 font-medium">Notes</td>
                      {selectedResults.map(s => (
                        <td key={s.id} className="py-2 px-3 text-cyan-400/60 italic">{s.notes || <span className="text-white/20">—</span>}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-white/35 font-medium">Source</td>
                      {selectedResults.map(s => (
                        <td key={s.id} className="py-2 px-3">
                          {s.result?.sourceUrl
                            ? <a href={s.result.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400/70 hover:text-cyan-300 flex items-center gap-1"><ExternalLink className="w-3 h-3" />Open</a>
                            : <span className="text-white/20">—</span>}
                        </td>
                      ))}
                    </tr>
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
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setMapZoom(z => Math.min(z + 0.8, 8))} className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={() => setMapZoom(z => Math.max(z - 0.8, 0.8))} className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button onClick={() => setMapZoom(1)} className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"><RotateCcw className="w-3 h-3" /></button>
          </div>
        </div>
        <div className="relative" style={{ height: 340 }}>
          {withCoords.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <MapPin className="w-8 h-8 text-white/10 mb-2" />
              <p className="text-xs text-white/25 text-center px-8">Save a result to pin it here.<br /><span className="text-white/15">Coordinates are geocoded automatically on save.</span></p>
            </div>
          )}
          <ComposableMap projection="geoAlbersUsa" style={{ width: "100%", height: "100%" }}>
            <ZoomableGroup zoom={mapZoom} minZoom={0.8} maxZoom={8} onMoveEnd={({ zoom }) => setMapZoom(zoom)}>
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
                  geographies.map(geo => (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill="rgba(22, 33, 52, 0.9)" stroke="rgba(100, 116, 139, 0.2)" strokeWidth={0.5}
                      style={{ default: { outline: "none" }, hover: { fill: "rgba(30, 45, 68, 0.95)", outline: "none" }, pressed: { outline: "none" } }}
                    />
                  ))
                }
              </Geographies>
              {withCoords.map(saved => {
                const result = saved.result!;
                const color = bucketColors[result.sourceBucket] || "#64748b";
                const isHovered = hoveredId === saved.id;
                const isSelected = selectedIds.has(saved.id);
                return (
                  <Marker key={saved.id} coordinates={[result.longitude as number, result.latitude as number]}
                    onClick={() => openEvidence(result)}
                    onMouseEnter={() => setHoveredId(saved.id)}
                    onMouseLeave={() => setHoveredId(null)}>
                    {result.sourceBucket === "posted_price" && (
                      <circle r={isHovered ? 13 : 10} fill="none" stroke={color}
                        strokeWidth={isSelected ? 2 : 1} strokeOpacity={isSelected ? 0.6 : 0.3}
                        style={{ pointerEvents: "none", transition: "r 0.15s" }} />
                    )}
                    <circle r={isHovered ? 7 : 5} fill={color} fillOpacity={isHovered ? 1 : 0.85}
                      stroke={isSelected ? "#22d3ee" : "rgba(0,0,0,0.4)"} strokeWidth={isSelected ? 2 : 1}
                      style={{ cursor: "pointer", transition: "r 0.15s, fill-opacity 0.15s" }} />
                    {isHovered && (
                      <text textAnchor="middle" y={-14} style={{ fontSize: "9px", fill: "#ffffff", fontWeight: 700, pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
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

      {savedResults.length >= 2 && selectedIds.size === 0 && (
        <div className="mb-3 text-[11px] text-white/25 flex items-center gap-1.5">
          <CheckSquare className="w-3 h-3" />Check boxes to select clinics for side-by-side comparison
        </div>
      )}

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
            const isSelected = selectedIds.has(saved.id);
            const isCollapsed = collapsedIds.has(saved.id);
            const contact = contactInfo[saved.id];
            const isEditingNotes = saved.id in editingNotes;
            const isEditingBreakdown = saved.id in editingBreakdown;
            const isBreakdownOpen = breakdownOpen.has(saved.id);
            const savedBreakdown = parseBreakdown((saved as { priceBreakdown?: string }).priceBreakdown);
            const hasBreakdown = savedBreakdown && Object.values(savedBreakdown).some(v => v !== "");

            return (
              <motion.div key={saved.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card rounded-xl border transition-all ${
                  isSelected ? "border-cyan-500/40 ring-1 ring-cyan-500/20"
                  : result.sourceBucket === "posted_price" ? "price-hit hover:border-green-500/25"
                  : "border-white/[0.06] hover:border-white/[0.12]"
                }`}>

                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleSelect(saved.id)} className="mt-0.5 shrink-0 text-white/30 hover:text-cyan-400 transition-colors" title="Select to compare">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white/90 truncate">{result.clinicName}</span>
                        {/* Breakdown summary badges */}
                        {hasBreakdown && savedBreakdown && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {savedBreakdown.interpretationIncluded && savedBreakdown.interpretationIncluded !== "" && (
                              <span className={`text-[9px] px-1 py-0.5 rounded border ${savedBreakdown.interpretationIncluded === "yes" ? "text-green-400/70 border-green-400/20 bg-green-400/5" : savedBreakdown.interpretationIncluded === "no" ? "text-red-400/70 border-red-400/20 bg-red-400/5" : "text-white/30 border-white/10 bg-white/[0.03]"}`}>
                                {savedBreakdown.interpretationIncluded === "yes" ? "interp ✓" : savedBreakdown.interpretationIncluded === "no" ? "interp ✗" : "interp ?"}
                              </span>
                            )}
                            {savedBreakdown.allInclusive && savedBreakdown.allInclusive !== "" && (
                              <span className={`text-[9px] px-1 py-0.5 rounded border ${savedBreakdown.allInclusive === "yes" ? "text-green-400/70 border-green-400/20 bg-green-400/5" : savedBreakdown.allInclusive === "no" ? "text-red-400/70 border-red-400/20 bg-red-400/5" : "text-white/30 border-white/10 bg-white/[0.03]"}`}>
                                {savedBreakdown.allInclusive === "yes" ? "all-incl ✓" : savedBreakdown.allInclusive === "no" ? "not all-incl" : savedBreakdown.allInclusive === "partial" ? "partial" : "all-incl ?"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-white/40 mb-1">
                        {result.clinicType} · {result.requestedService}{result.location && ` · ${result.location}`}
                      </div>
                      {result.priceSnippet && (
                        <div className="text-[11px] text-white/35 font-mono line-clamp-1">"{result.priceSnippet}"</div>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      {result.postedPrice ? (
                        <div className="text-xl font-bold text-green-400">{result.postedPrice}</div>
                      ) : (
                        <span className="text-xs text-white/30">No price</span>
                      )}
                      <div className="text-[10px] text-white/25">{new Date(saved.savedAt).toLocaleDateString()}</div>
                      <button onClick={() => toggleCollapse(saved.id)} className="text-white/20 hover:text-white/50 transition-colors">
                        {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Body */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">

                        {/* Contact Info */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {contact?.loading && <span className="flex items-center gap-1 text-[11px] text-white/25"><Loader2 className="w-3 h-3 animate-spin" />Looking up contact…</span>}
                          {!contact?.loading && contact?.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/80 transition-colors">
                              <Phone className="w-3 h-3 text-cyan-400/60" />{contact.phone}
                            </a>
                          )}
                          {!contact?.loading && contact?.fax && (
                            <span className="flex items-center gap-1.5 text-[11px] text-white/50">
                              <Printer className="w-3 h-3 text-white/30" />{contact.fax}
                            </span>
                          )}
                          {!contact?.loading && !contact?.phone && !contact?.fax && (
                            <span className="text-[11px] text-white/20">No contact info in NPPES registry</span>
                          )}
                        </div>

                        {/* Price Breakdown Section */}
                        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                          <button
                            onClick={() => isEditingBreakdown ? cancelBreakdown(saved.id) : (isBreakdownOpen && !isEditingBreakdown ? toggleBreakdown(saved.id) : openBreakdownEdit(saved.id, (saved as { priceBreakdown?: string }).priceBreakdown))}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
                          >
                            <DollarSign className="w-3 h-3 text-cyan-400/50 shrink-0" />
                            <span className="text-[11px] font-medium text-white/50">Price Breakdown</span>
                            {hasBreakdown && !isEditingBreakdown && (
                              <span className="text-[10px] text-green-400/60 ml-1">✓ filled</span>
                            )}
                            {!hasBreakdown && !isEditingBreakdown && (
                              <span className="text-[10px] text-white/20 ml-1">click to fill in</span>
                            )}
                            <div className="ml-auto">
                              {isEditingBreakdown
                                ? <X className="w-3 h-3 text-white/30" />
                                : isBreakdownOpen ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />
                              }
                            </div>
                          </button>

                          <AnimatePresence>
                            {(isBreakdownOpen || isEditingBreakdown) && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.12 }} className="overflow-hidden">
                                <div className="px-3 pb-3 pt-1 border-t border-white/[0.05]">
                                  {isEditingBreakdown ? (
                                    // Edit mode
                                    <div className="space-y-3">
                                      {/* Row 1: Interpretation + Facility Fee */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] text-white/35 mb-1">Interpretation/read included?</label>
                                          <div className="flex gap-1 flex-wrap">
                                            {(["yes", "no", "unknown"] as const).map(v => (
                                              <button key={v} onClick={() => updateBreakdownField(saved.id, "interpretationIncluded", v)}
                                                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${editingBreakdown[saved.id]?.interpretationIncluded === v ? (v === "yes" ? "bg-green-500/20 border-green-500/40 text-green-400" : v === "no" ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/10 border-white/20 text-white/60") : "border-white/10 text-white/30 hover:border-white/20"}`}>
                                                {v === "yes" ? "Yes ✓" : v === "no" ? "No ✗" : "Unknown"}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-white/35 mb-1">Facility fee?</label>
                                          <div className="flex gap-1 flex-wrap">
                                            {(["none", "separate", "unknown"] as const).map(v => (
                                              <button key={v} onClick={() => updateBreakdownField(saved.id, "facilityFee", v)}
                                                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${editingBreakdown[saved.id]?.facilityFee === v ? (v === "none" ? "bg-green-500/20 border-green-500/40 text-green-400" : v === "separate" ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/10 border-white/20 text-white/60") : "border-white/10 text-white/30 hover:border-white/20"}`}>
                                                {v === "none" ? "None ✓" : v === "separate" ? "Separate !" : "Unknown"}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Row 2: All-inclusive + Payment terms */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] text-white/35 mb-1">All-inclusive price?</label>
                                          <div className="flex gap-1 flex-wrap">
                                            {(["yes", "no", "partial", "unknown"] as const).map(v => (
                                              <button key={v} onClick={() => updateBreakdownField(saved.id, "allInclusive", v)}
                                                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${editingBreakdown[saved.id]?.allInclusive === v ? (v === "yes" ? "bg-green-500/20 border-green-500/40 text-green-400" : v === "no" ? "bg-red-500/20 border-red-500/40 text-red-400" : v === "partial" ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/10 border-white/20 text-white/60") : "border-white/10 text-white/30 hover:border-white/20"}`}>
                                                {v === "yes" ? "Yes ✓" : v === "no" ? "No ✗" : v === "partial" ? "Partial" : "Unknown"}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-white/35 mb-1">Payment terms</label>
                                          <div className="flex gap-1 flex-wrap">
                                            {(["upfront", "net30", "net60", "pos_only", "unknown"] as const).map(v => (
                                              <button key={v} onClick={() => updateBreakdownField(saved.id, "paymentTerms", v)}
                                                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${editingBreakdown[saved.id]?.paymentTerms === v ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "border-white/10 text-white/30 hover:border-white/20"}`}>
                                                {v === "pos_only" ? "POS only" : v === "unknown" ? "Unknown" : v.toUpperCase()}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Row 3: Confirmed by + date */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] text-white/35 mb-1">Price confirmed by</label>
                                          <div className="flex gap-1">
                                            {(["website", "phone", "email"] as const).map(v => (
                                              <button key={v} onClick={() => updateBreakdownField(saved.id, "confirmedBy", v)}
                                                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${editingBreakdown[saved.id]?.confirmedBy === v ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "border-white/10 text-white/30 hover:border-white/20"}`}>
                                                {v.charAt(0).toUpperCase() + v.slice(1)}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-white/35 mb-1">Price as of date</label>
                                          <input
                                            type="date"
                                            value={editingBreakdown[saved.id]?.confirmedDate || ""}
                                            onChange={e => updateBreakdownField(saved.id, "confirmedDate", e.target.value)}
                                            className="text-[11px] bg-white/[0.05] border border-white/10 rounded px-2 py-0.5 text-white/60 focus:outline-none focus:border-cyan-500/40 w-full"
                                          />
                                        </div>
                                      </div>

                                      {/* Save / Cancel */}
                                      <div className="flex gap-2 pt-1">
                                        <button onClick={() => saveBreakdown(saved.id)} disabled={savingBreakdown.has(saved.id)}
                                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-50">
                                          {savingBreakdown.has(saved.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                          Save Breakdown
                                        </button>
                                        <button onClick={() => cancelBreakdown(saved.id)} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    // Read mode — show filled values
                                    savedBreakdown && hasBreakdown ? (
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                                        {savedBreakdown.interpretationIncluded && <div className="flex justify-between"><span className="text-white/30">Interp. included</span><span className={savedBreakdown.interpretationIncluded === "yes" ? "text-green-400" : savedBreakdown.interpretationIncluded === "no" ? "text-red-400" : "text-white/40"}>{savedBreakdown.interpretationIncluded}</span></div>}
                                        {savedBreakdown.facilityFee && <div className="flex justify-between"><span className="text-white/30">Facility fee</span><span className={savedBreakdown.facilityFee === "none" ? "text-green-400" : savedBreakdown.facilityFee === "separate" ? "text-yellow-400" : "text-white/40"}>{savedBreakdown.facilityFee}</span></div>}
                                        {savedBreakdown.allInclusive && <div className="flex justify-between"><span className="text-white/30">All-inclusive</span><span className={savedBreakdown.allInclusive === "yes" ? "text-green-400" : savedBreakdown.allInclusive === "no" ? "text-red-400" : "text-white/40"}>{savedBreakdown.allInclusive}</span></div>}
                                        {savedBreakdown.paymentTerms && <div className="flex justify-between"><span className="text-white/30">Payment</span><span className="text-white/50">{savedBreakdown.paymentTerms.replace(/_/g, " ")}</span></div>}
                                        {savedBreakdown.confirmedBy && <div className="flex justify-between"><span className="text-white/30">Confirmed via</span><span className="text-white/50">{savedBreakdown.confirmedBy}</span></div>}
                                        {savedBreakdown.confirmedDate && <div className="flex justify-between"><span className="text-white/30">Price as of</span><span className="text-white/50">{savedBreakdown.confirmedDate}</span></div>}
                                        <div className="col-span-2 pt-1">
                                          <button onClick={() => openBreakdownEdit(saved.id, (saved as { priceBreakdown?: string }).priceBreakdown)}
                                            className="text-[10px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1">
                                            <Pencil className="w-2.5 h-2.5" />Edit
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button onClick={() => openBreakdownEdit(saved.id, null)}
                                        className="text-[11px] text-white/25 hover:text-cyan-400/60 transition-colors flex items-center gap-1.5 py-1">
                                        <Pencil className="w-3 h-3" />Fill in price details (interpretation, facility fee, payment terms…)
                                      </button>
                                    )
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Notes */}
                        <div>
                          {isEditingNotes ? (
                            <div className="flex gap-2 items-start">
                              <textarea
                                className="flex-1 text-[11px] bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white/70 placeholder-white/20 resize-none focus:outline-none focus:border-cyan-500/40"
                                rows={2} placeholder="Add notes about this clinic…"
                                value={editingNotes[saved.id]}
                                onChange={e => setEditingNotes(prev => ({ ...prev, [saved.id]: e.target.value }))}
                              />
                              <div className="flex flex-col gap-1">
                                <button onClick={() => saveNotes(saved.id)} disabled={savingNotes.has(saved.id)}
                                  className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50">
                                  {savingNotes.has(saved.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                </button>
                                <button onClick={() => cancelEditNotes(saved.id)} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 cursor-pointer group" onClick={() => startEditNotes(saved.id, saved.notes)}>
                              <Pencil className="w-3 h-3 text-white/20 group-hover:text-white/40 mt-0.5 shrink-0 transition-colors" />
                              {saved.notes
                                ? <span className="text-[11px] text-cyan-400/60 italic group-hover:text-cyan-400/80 transition-colors">{saved.notes}</span>
                                : <span className="text-[11px] text-white/20 group-hover:text-white/40 italic transition-colors">Add a note…</span>
                              }
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEvidence(result)} className="text-[11px] text-white/40 hover:text-white/70 transition-colors">View Evidence</button>
                          {result.sourceUrl && (
                            <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-cyan-400/60 hover:text-cyan-300 transition-colors">
                              <ExternalLink className="w-3 h-3" />Source
                            </a>
                          )}
                          <button onClick={() => handleDelete(saved.id)} disabled={deleteSaved.isPending}
                            className="ml-auto flex items-center gap-1 text-[11px] text-white/25 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3" />Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <EvidenceDrawer result={activeResult} open={drawerOpen} onClose={() => setDrawerOpen(false)} onReview={handleReview} />
    </div>
  );
}
