import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  MapPin,
  X,
  SlidersHorizontal,
  Loader2,
  Bookmark,
  Clock,
  Activity,
  ChevronDown,
  ChevronLeft,
  Zap,
  ExternalLink,
  TriangleAlert,
  RefreshCw,
  BarChart3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Config — set via environment variables in Render dashboard
// ---------------------------------------------------------------------------
const API_BASE = (import.meta.env["VITE_API_URL"] ?? "").replace(/\/$/, "");
const HUB_URL = import.meta.env["VITE_HUB_URL"] ?? "#";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const REGIONS = [
  "Global",
  "United States",
  "Europe",
  "Asia-Pacific",
  "Latin America",
  "Middle East",
  "Africa",
] as const;
type Region = (typeof REGIONS)[number];

const QUICK_SERVICES: { label: string; icon: string }[] = [
  { label: "MRI brain without contrast", icon: "🧠" },
  { label: "treadmill stress test", icon: "❤️" },
  { label: "chest X-ray 2-view", icon: "🫁" },
  { label: "colonoscopy self-pay", icon: "🔬" },
  { label: "QuantiFERON blood test", icon: "🩸" },
  { label: "DOT physical exam", icon: "🚛" },
  { label: "FAA medical exam", icon: "✈️" },
  { label: "dental exam with bitewings", icon: "🦷" },
  { label: "mammogram screening", icon: "🩺" },
  { label: "CBC lab panel", icon: "🧪" },
  { label: "echocardiogram", icon: "💓" },
  { label: "urgent care visit", icon: "🏥" },
  { label: "travel vaccines", icon: "💉" },
  { label: "gallbladder ultrasound", icon: "🔊" },
  { label: "drug screen 5-panel", icon: "🧬" },
  { label: "hip replacement self-pay", icon: "🦴" },
];

const INTEL_SOURCES = [
  "Hospital MRF (CMS)",
  "Provider Websites",
  "PDF Fee Schedules",
  "NPPES / NPI Registry",
  "DoltHub Transparency",
  "JSON-LD Extraction",
  "CMS Care Compare",
  "International Clinic Pages",
  "Lab & Imaging Menus",
];

const NAV_TABS = [
  { id: "intelligence" as const, label: "Intelligence", Icon: Activity },
  { id: "bookmarks" as const, label: "Bookmarks", Icon: Bookmark },
  { id: "history" as const, label: "History", Icon: Clock },
  { id: "diagnostics" as const, label: "Diagnostics", Icon: BarChart3 },
];
type TabId = (typeof NAV_TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SearchStatus = "pending" | "running" | "complete" | "failed";

interface PriceResult {
  id: number;
  clinicName: string;
  clinicType: string;
  location: string;
  city: string | null;
  state: string | null;
  requestedService: string;
  postedPrice: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceSnippet: string | null;
  sourceUrl: string | null;
  pageTitle: string | null;
  sourceBucket: "posted_price" | "clinic_no_price" | "possible_match";
  sourceType: string;
  extractionNotes: string | null;
}

interface SearchRunData {
  id: number;
  status: SearchStatus;
  resultCount: number;
  postedPriceCount: number;
  results: PriceResult[];
}

// ---------------------------------------------------------------------------
// API helpers — plain fetch (no extra dependencies needed)
// ---------------------------------------------------------------------------
async function apiStartSearch(params: {
  serviceType: string;
  location: string;
}): Promise<{ id: number }> {
  if (!API_BASE) {
    throw new Error(
      "API URL not configured. Set VITE_API_URL in the Render dashboard and redeploy.",
    );
  }
  const resp = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: params.location,
      serviceType: params.serviceType,
      clinicType: "other",
      radiusMiles: 100,
      postedPricesOnly: false,
      directClinicOnly: false,
      includePdfs: true,
      includeMarketplaces: true,
      verifiedEvidenceOnly: false,
      sortBy: "lowest_price",
    }),
  });
  if (!resp.ok) {
    // Avoid surfacing raw HTML error pages (e.g. from the Express default
    // error handler or a proxy).  Try JSON first; fall back to a short message.
    const text = await resp.text().catch(() => "");
    let message = `Search failed (HTTP ${resp.status})`;
    if (text && !text.trimStart().startsWith("<")) {
      // Only use the body if it is not HTML
      message = text;
    }
    throw new Error(message);
  }
  return resp.json() as Promise<{ id: number }>;
}

async function apiFetchSearch(id: number): Promise<SearchRunData> {
  const resp = await fetch(`${API_BASE}/api/search/${id}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json() as Promise<SearchRunData>;
}

// ---------------------------------------------------------------------------
// Result card
// ---------------------------------------------------------------------------
function ResultCard({ result }: { result: PriceResult }) {
  const displayPrice =
    result.postedPrice ??
    (result.priceMin != null && result.priceMax != null
      ? `$${result.priceMin}–$${result.priceMax}`
      : result.priceMin != null
      ? `from $${result.priceMin}`
      : null);

  const bucketStyles = {
    posted_price: {
      badge: "bg-green-500/15 text-green-400 border-green-500/20",
      label: "Posted Price",
    },
    possible_match: {
      badge: "bg-yellow-500/10 text-yellow-400/80 border-yellow-500/15",
      label: "Possible Match",
    },
    clinic_no_price: {
      badge: "bg-white/[0.05] text-white/30 border-white/[0.08]",
      label: "No Price Posted",
    },
  };
  const style = bucketStyles[result.sourceBucket];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="portal5-card rounded-xl p-4 border border-white/[0.07] hover:border-white/[0.13] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white/85 leading-snug">
              {result.clinicName}
            </h4>
            {displayPrice && (
              <span className="text-sm font-bold text-green-400 flex-shrink-0 ml-2">
                {displayPrice}
              </span>
            )}
          </div>

          {result.location && (
            <div className="flex items-center gap-1 mb-1.5">
              <MapPin className="w-3 h-3 text-white/25 flex-shrink-0" />
              <span className="text-xs text-white/35 truncate">{result.location}</span>
            </div>
          )}

          {result.priceSnippet && (
            <p className="text-xs text-white/40 line-clamp-2 mb-2 italic">
              "{result.priceSnippet}"
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${style.badge}`}
            >
              {style.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/25 capitalize">
              {result.clinicType}
            </span>
            {result.sourceType === "pdf" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/15 text-orange-400/60">
                PDF
              </span>
            )}
          </div>
        </div>

        {result.sourceUrl && (
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 rounded-lg text-white/25 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
            title="View source"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  // Form state
  const [serviceQuery, setServiceQuery] = useState("");
  const [region, setRegion] = useState<Region>("Global");
  const [city, setCity] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("intelligence");

  // Search state
  const [searchId, setSearchId] = useState<number | null>(null);
  const [searchData, setSearchData] = useState<SearchRunData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Refs to avoid stale closures in the polling interval
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const serviceQueryRef = useRef(serviceQuery);
  const regionRef = useRef(region);
  const cityRef = useRef(city);

  useEffect(() => { serviceQueryRef.current = serviceQuery; }, [serviceQuery]);
  useEffect(() => { regionRef.current = region; }, [region]);
  useEffect(() => { cityRef.current = city; }, [city]);

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Core search handler — accepts an optional override so quick-search works
  // without waiting for React state to flush the serviceQuery update.
  const handleSearch = useCallback(
    async (overrideService?: string) => {
      const svc = (overrideService ?? serviceQueryRef.current).trim();
      if (!svc) return;

      // Build location: if city given → "city, region", else → just region.
      // Using only region (e.g. "Global") is intentional for international searches.
      const locationStr = cityRef.current.trim()
        ? `${cityRef.current.trim()}, ${regionRef.current}`
        : regionRef.current;

      stopPolling();
      setSearchError(null);
      setSearchData(null);
      setIsSearching(true);
      setSearchId(null);

      try {
        const run = await apiStartSearch({ serviceType: svc, location: locationStr });
        setSearchId(run.id);

        // Poll every 2 s until complete or failed
        pollRef.current = setInterval(() => {
          apiFetchSearch(run.id)
            .then((data) => {
              setSearchData(data);
              if (data.status === "complete" || data.status === "failed") {
                stopPolling();
                setIsSearching(false);
              }
            })
            .catch(() => {
              stopPolling();
              setIsSearching(false);
              setSearchError("Failed to retrieve search results. Please try again.");
            });
        }, 2000);
      } catch (err: unknown) {
        setIsSearching(false);
        setSearchError(
          err instanceof Error ? err.message : "Search failed. Please try again.",
        );
      }
    },
    [stopPolling],
  );

  const handleQuickService = useCallback(
    (label: string) => {
      setServiceQuery(label);
      handleSearch(label);
    },
    [handleSearch],
  );

  const resetSearch = useCallback(() => {
    stopPolling();
    setSearchId(null);
    setSearchData(null);
    setIsSearching(false);
    setSearchError(null);
  }, [stopPolling]);

  // Derived
  const hasResults = isSearching || searchData !== null || searchError !== null;
  const results = searchData?.results ?? [];
  const postedResults = results.filter((r) => r.sourceBucket === "posted_price");
  const possibleResults = results.filter((r) => r.sourceBucket === "possible_match");
  const noPriceResults = results.filter((r) => r.sourceBucket === "clinic_no_price");
  const searchDone = searchData?.status === "complete" || searchData?.status === "failed";

  return (
    <div className="portal5-bg min-h-screen text-white flex flex-col relative">
      {/* ── Animated glowing orbs ── */}
      <div className="p5-orb-layer">
        <div className="p5-orb-a" />
        <div className="p5-orb-b" />
        <div className="p5-orb-c" />
        <div className="p5-orb-d" />
      </div>

      {/* ── NavBar ── */}
      <header className="portal5-nav border-b border-white/[0.07] sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Left: Hub link + brand */}
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={HUB_URL}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/40 hover:text-white/75 hover:bg-white/[0.05] transition-all text-xs font-medium flex-shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Hub
            </a>
            <div className="w-px h-4 bg-white/10 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-white/90 tracking-tight truncate">
                Global Intelligence
              </span>
              <span className="hidden sm:inline text-[10px] font-bold bg-violet-500/20 border border-violet-400/30 text-violet-300 px-2 py-0.5 rounded-full tracking-widest uppercase flex-shrink-0">
                PORTAL 5
              </span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10 flex-shrink-0" />
            <button className="hidden sm:flex items-center gap-1 text-xs text-white/35 hover:text-white/65 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/[0.04] flex-shrink-0">
              Portals <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Right: Nav tabs */}
          <nav className="flex items-center gap-0.5 flex-shrink-0">
            {NAV_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === id
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25"
                    : "text-white/45 hover:text-white/75 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {!hasResults ? (
            /* ── Landing / search state ── */
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6 py-12"
            >
              <div className="relative z-10 w-full max-w-3xl">
                {/* Badge */}
                <div className="flex justify-center mb-5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 bg-cyan-500/12 border border-cyan-500/25 px-3 py-1.5 rounded-full tracking-wide">
                    <Zap className="w-3 h-3" />
                    Portal 5 — Global Price Intelligence Terminal
                  </span>
                </div>

                {/* Heading */}
                <h1 className="text-4xl sm:text-5xl font-bold text-center text-white leading-tight mb-4 tracking-tight">
                  Uncover Real Healthcare
                  <br />
                  Prices Worldwide
                </h1>
                <p className="text-center text-white/38 text-sm leading-relaxed mb-1.5 max-w-xl mx-auto">
                  Search publicly posted out-of-pocket prices from clinics, hospitals,
                  labs, and specialists across the US and internationally.
                </p>
                <p className="text-center text-white/22 text-xs mb-10">
                  Only exact posted prices — no estimates, no fabrications.
                </p>

                {/* ── Search form card ── */}
                <div className="portal5-card rounded-2xl border border-white/[0.08] p-3 mb-8 shadow-2xl">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Service input */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/28 pointer-events-none" />
                      <input
                        type="text"
                        value={serviceQuery}
                        onChange={(e) => setServiceQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search a service, e.g. treadmill stress test…"
                        className="portal5-input w-full rounded-xl pl-10 pr-9 py-3 text-sm"
                        autoFocus
                      />
                      {serviceQuery && (
                        <button
                          onClick={() => setServiceQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/28 hover:text-white/60 transition-colors"
                          aria-label="Clear"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Region dropdown */}
                    <div className="relative sm:w-44">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/28 pointer-events-none z-10" />
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value as Region)}
                        className="portal5-input select-none w-full rounded-xl pl-10 pr-8 py-3 text-sm"
                      >
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/28 pointer-events-none" />
                    </div>

                    {/* City/region input — optional when Global is selected */}
                    <div className="relative sm:w-44">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/28 pointer-events-none" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="City or region"
                        className="portal5-input w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                      />
                    </div>

                    {/* Filters icon */}
                    <button
                      className="flex items-center justify-center w-12 rounded-xl portal5-input text-white/35 hover:text-white/65 hover:bg-white/[0.06] transition-all flex-shrink-0"
                      aria-label="Filters"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>

                    {/* Search button */}
                    <button
                      onClick={() => handleSearch()}
                      disabled={!serviceQuery.trim() || isSearching}
                      className="flex items-center gap-2 px-6 py-3 bg-cyan-500/22 hover:bg-cyan-500/32 active:bg-cyan-500/40 border border-cyan-500/38 text-cyan-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Search
                    </button>
                  </div>
                </div>

                {/* ── Quick search ── */}
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="flex-1 max-w-[80px] h-px bg-white/[0.07]" />
                    <span className="text-[10px] text-white/22 uppercase tracking-widest font-semibold">
                      Quick Search — Common Services
                    </span>
                    <div className="flex-1 max-w-[80px] h-px bg-white/[0.07]" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {QUICK_SERVICES.map(({ label, icon }) => (
                      <button
                        key={label}
                        onClick={() => handleQuickService(label)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06] text-white/42 hover:text-white/80 hover:bg-white/[0.065] hover:border-white/[0.11] transition-all text-xs text-left"
                      >
                        <span className="text-sm leading-none flex-shrink-0">{icon}</span>
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Intelligence sources ── */}
                <div>
                  <p className="text-[10px] text-white/18 uppercase tracking-widest text-center mb-3 font-semibold">
                    Intelligence Sources
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {INTEL_SOURCES.map((src) => (
                      <span
                        key={src}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/30"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Results state ── */
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 py-6"
            >
              {/* Top action bar */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <button
                  onClick={resetSearch}
                  className="flex items-center gap-1.5 text-xs text-white/38 hover:text-white/70 portal5-card border border-white/[0.07] px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  New Search
                </button>

                {/* Compact inline search bar */}
                <div className="relative flex-1 min-w-0 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/28 pointer-events-none" />
                  <input
                    type="text"
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Refine query…"
                    className="portal5-input w-full rounded-lg pl-7 pr-3 py-1.5 text-xs"
                  />
                </div>

                {/* Status dot */}
                {(isSearching || searchData) && (
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        searchData?.status === "complete"
                          ? "bg-green-400"
                          : searchData?.status === "failed"
                          ? "bg-red-400"
                          : "bg-cyan-400 animate-pulse"
                      }`}
                    />
                    <span className="text-xs text-white/38 capitalize">
                      {searchData?.status ?? "searching"}
                    </span>
                    {searchDone && (
                      <span className="text-xs text-white/22">
                        · {results.length} result{results.length !== 1 ? "s" : ""}
                        {postedResults.length > 0 &&
                          ` · ${postedResults.length} with prices`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Loading skeleton */}
              {isSearching && (
                <div className="portal5-card rounded-xl p-6 mb-6 border border-cyan-500/12">
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                    <span className="text-sm font-medium text-white/65">
                      Scanning global intelligence sources for posted prices…
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      "Generating global search queries",
                      "Fetching clinic & hospital pages",
                      "Extracting price evidence",
                      "Classifying results by intelligence source",
                    ].map((step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            i <= 1
                              ? "bg-cyan-400 animate-pulse"
                              : "bg-white/12"
                          }`}
                        />
                        <span className="text-xs text-white/28">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {searchError && (
                <div className="portal5-card rounded-xl p-6 mb-6 border border-red-500/20 text-center">
                  <TriangleAlert className="w-6 h-6 text-red-400/65 mx-auto mb-2" />
                  <p className="text-sm text-red-400/75 mb-3">{searchError}</p>
                  <button
                    onClick={() => handleSearch()}
                    className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {searchDone && results.length === 0 && !searchError && (
                <div className="portal5-card rounded-xl p-10 text-center border border-white/[0.06]">
                  <TriangleAlert className="w-8 h-8 text-yellow-500/45 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white/55">
                    No publicly posted prices found for this search.
                  </p>
                  <p className="text-xs text-white/28 mt-2">
                    Try a different service name, a broader region, or remove the city
                    filter.
                  </p>
                </div>
              )}

              {/* ── Result groups ── */}
              <AnimatePresence>
                {postedResults.length > 0 && (
                  <motion.section
                    key="posted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <h2 className="text-xs font-semibold text-green-400/80 uppercase tracking-wider">
                        Posted Price Found
                      </h2>
                      <span className="text-[10px] bg-green-500/12 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                        {postedResults.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {postedResults.map((r) => (
                        <ResultCard key={r.id} result={r} />
                      ))}
                    </div>
                  </motion.section>
                )}

                {possibleResults.length > 0 && (
                  <motion.section
                    key="possible"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <h2 className="text-xs font-semibold text-yellow-400/70 uppercase tracking-wider">
                        Possible Match
                      </h2>
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-400/70 border border-yellow-500/15 px-1.5 py-0.5 rounded-full">
                        {possibleResults.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {possibleResults.map((r) => (
                        <ResultCard key={r.id} result={r} />
                      ))}
                    </div>
                  </motion.section>
                )}

                {noPriceResults.length > 0 && (
                  <motion.section
                    key="noprice"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <h2 className="text-xs font-semibold text-white/28 uppercase tracking-wider">
                        Clinic Found — No Public Price Posted
                      </h2>
                      <span className="text-[10px] bg-white/[0.04] text-white/28 border border-white/[0.07] px-1.5 py-0.5 rounded-full">
                        {noPriceResults.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {noPriceResults.map((r) => (
                        <ResultCard key={r.id} result={r} />
                      ))}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Search ID watermark */}
              {searchId && (
                <p className="text-[10px] text-white/12 text-center mt-6">
                  Search #{searchId}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
