import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Filter, ChevronDown, Loader2, TriangleAlert, Download, RefreshCw } from "lucide-react";
import {
  useStartSearch,
  useGetSearch,
  useSaveResult,
  useAddManualReview,
  getGetSearchQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import ResultCard from "@/components/ResultCard";
import type { PriceResult } from "@workspace/api-client-react";

const CLINIC_TYPES = [
  "urgent care", "occupational health", "primary care", "dental", "cardiology",
  "radiology / imaging", "pharmacy", "aviation medical / FAA", "lab / diagnostics",
  "women's health", "physical therapy", "specialist", "hospital outpatient", "FQHC", "other"
];

const SERVICE_PRESETS = [
  "urgent care visit", "office visit", "self-pay visit", "physical exam", "annual physical",
  "DOT physical", "FAA medical exam", "dental exam", "dental cleaning", "panoramic x-ray",
  "bitewings", "mammogram", "treadmill stress test", "EKG", "spirometry", "audiogram",
  "vaccine / immunization", "TB test", "drug screen", "lab panel",
];

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

const SORT_OPTIONS = [
  { value: "lowest_price", label: "Lowest Price" },
  { value: "source_type", label: "Source Type" },
  { value: "clinic_type", label: "Clinic Type" },
  { value: "distance", label: "Distance" },
];

interface SearchForm {
  location: string;
  radiusMiles: number;
  clinicType: string;
  serviceType: string;
  freeText: string;
  postedPricesOnly: boolean;
  directClinicOnly: boolean;
  includePdfs: boolean;
  includeMarketplaces: boolean;
  verifiedEvidenceOnly: boolean;
  sortBy: string;
}

const defaultForm: SearchForm = {
  location: "",
  radiusMiles: 25,
  clinicType: "urgent care",
  serviceType: "urgent care visit",
  freeText: "",
  postedPricesOnly: true,
  directClinicOnly: false,
  includePdfs: true,
  includeMarketplaces: true,
  verifiedEvidenceOnly: false,
  sortBy: "lowest_price",
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={onChange}
        className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${checked ? "bg-cyan-500/70" : "bg-white/10"}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
    </label>
  );
}

function SelectField({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full glass-input rounded-lg px-3 py-2 text-xs text-white/80 appearance-none pr-7 focus:outline-none"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o} className="bg-slate-900">{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
    </div>
  );
}

export default function SearchPage() {
  const [form, setForm] = useState<SearchForm>(defaultForm);
  const [currentSearchId, setCurrentSearchId] = useState<number | null>(null);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [debugMode] = useState(false);

  const queryClient = useQueryClient();
  const startSearch = useStartSearch();
  const saveResult = useSaveResult();
  const addReview = useAddManualReview();

  const searchQuery = useGetSearch(
    currentSearchId!,
    {
      query: {
        enabled: shouldPoll && currentSearchId !== null,
        queryKey: getGetSearchQueryKey(currentSearchId!),
        refetchInterval: (query) => {
          const data = query.state.data;
          if (data?.status === "complete" || data?.status === "failed") {
            return false;
          }
          return 2000;
        },
      },
    },
  );

  useEffect(() => {
    if (searchQuery.data?.status === "complete" || searchQuery.data?.status === "failed") {
      setShouldPoll(false);
    }
  }, [searchQuery.data?.status]);

  function update<K extends keyof SearchForm>(key: K, value: SearchForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!form.location || !form.clinicType || !form.serviceType) return;

    setShouldPoll(false);
    setCurrentSearchId(null);

    const run = await startSearch.mutateAsync({
      data: {
        location: form.location,
        radiusMiles: form.radiusMiles,
        clinicType: form.clinicType,
        serviceType: form.serviceType,
        freeText: form.freeText || undefined,
        postedPricesOnly: form.postedPricesOnly,
        directClinicOnly: form.directClinicOnly,
        includePdfs: form.includePdfs,
        includeMarketplaces: form.includeMarketplaces,
        verifiedEvidenceOnly: form.verifiedEvidenceOnly,
        sortBy: form.sortBy as "lowest_price" | "distance" | "source_type" | "clinic_type",
      },
    });

    setCurrentSearchId(run.id);
    setShouldPoll(true);
  }

  const handleSave = useCallback(async (resultId: number) => {
    await saveResult.mutateAsync({ data: { resultId } });
    queryClient.invalidateQueries({ queryKey: getGetSearchQueryKey(currentSearchId!) });
  }, [saveResult, queryClient, currentSearchId]);

  const handleReview = useCallback(async (resultId: number, verdict: string) => {
    await addReview.mutateAsync({
      data: {
        resultId,
        verdict: verdict as "verified" | "questionable" | "wrong_match" | "no_longer_posted",
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetSearchQueryKey(currentSearchId!) });
  }, [addReview, queryClient, currentSearchId]);

  function handleExport() {
    if (!searchQuery.data) return;
    const blob = new Blob([JSON.stringify(searchQuery.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinic-search-${currentSearchId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const results = searchQuery.data?.results ?? [];
  const postedResults = results.filter((r) => r.sourceBucket === "posted_price");
  const noPriceResults = results.filter((r) => r.sourceBucket === "clinic_no_price");
  const possibleResults = results.filter((r) => r.sourceBucket === "possible_match");
  const status = searchQuery.data?.status;
  const isRunning = shouldPoll && (status === "running" || status === "pending");

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left Sidebar */}
      <aside className={`glass-sidebar border-r border-white/[0.06] overflow-y-auto transition-all duration-300 ${showFilters ? "w-72 shrink-0" : "w-0 overflow-hidden"}`}>
        <div className="p-4 w-72">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Location</div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="City, State or ZIP"
                  className="w-full glass-input rounded-lg pl-9 pr-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Radius</div>
              <div className="flex gap-1">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update("radiusMiles", r)}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-all ${
                      form.radiusMiles === r
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    {r}mi
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Clinic Type</div>
              <SelectField value={form.clinicType} onChange={(v) => update("clinicType", v)} options={CLINIC_TYPES} />
            </div>

            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Service Type</div>
              <SelectField value={form.serviceType} onChange={(v) => update("serviceType", v)} options={SERVICE_PRESETS} />
            </div>

            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Additional Keywords</div>
              <input
                type="text"
                value={form.freeText}
                onChange={(e) => update("freeText", e.target.value)}
                placeholder="Optional free text..."
                className="w-full glass-input rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none"
              />
            </div>

            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Sort By</div>
              <SelectField
                value={form.sortBy}
                onChange={(v) => update("sortBy", v)}
                options={SORT_OPTIONS.map((o) => o.value)}
              />
            </div>

            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Filters</div>
              <Toggle checked={form.postedPricesOnly} onChange={() => update("postedPricesOnly", !form.postedPricesOnly)} label="Posted prices only" />
              <Toggle checked={form.directClinicOnly} onChange={() => update("directClinicOnly", !form.directClinicOnly)} label="Direct clinic websites only" />
              <Toggle checked={form.includePdfs} onChange={() => update("includePdfs", !form.includePdfs)} label="Include PDFs" />
              <Toggle checked={form.includeMarketplaces} onChange={() => update("includeMarketplaces", !form.includeMarketplaces)} label="Include marketplaces" />
              <Toggle checked={form.verifiedEvidenceOnly} onChange={() => update("verifiedEvidenceOnly", !form.verifiedEvidenceOnly)} label="Verified evidence only" />
            </div>

            <button
              type="submit"
              disabled={startSearch.isPending || isRunning}
              className="w-full flex items-center justify-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
              ) : (
                <><Search className="w-4 h-4" /> Search</>
              )}
            </button>
          </form>

          {/* Quick presets */}
          <div className="mt-6">
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Quick Templates</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { clinic: "urgent care", service: "urgent care visit" },
                { clinic: "occupational health", service: "DOT physical" },
                { clinic: "aviation medical / FAA", service: "FAA medical exam" },
                { clinic: "dental", service: "dental exam" },
                { clinic: "radiology / imaging", service: "mammogram" },
                { clinic: "lab / diagnostics", service: "drug screen" },
              ].map(({ clinic, service }) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, clinicType: clinic, serviceType: service }))}
                  className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.07] transition-all"
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 glass-card border border-white/[0.07] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            {status && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  status === "complete" ? "bg-green-400" :
                  status === "failed" ? "bg-red-400" :
                  "bg-cyan-400 animate-pulse"
                }`} />
                <span className="text-xs text-white/40 capitalize">{status}</span>
                {status === "complete" && (
                  <span className="text-xs text-white/30">
                    · {results.length} results · {postedResults.length} with posted prices
                  </span>
                )}
              </div>
            )}

            {status === "complete" && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 glass-card border border-white/[0.07] px-3 py-1.5 rounded-lg transition-colors ml-auto"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            )}
          </div>

          {/* Empty state */}
          {!currentSearchId && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
                <Search className="w-7 h-7 text-cyan-500/60" />
              </div>
              <h2 className="text-lg font-semibold text-white/70 mb-2">Find Posted Clinic Prices</h2>
              <p className="text-sm text-white/30 max-w-sm">
                Enter a location and service type to search for clinics with actual publicly posted prices.
                Only real posted prices are shown — no estimates or averages.
              </p>
            </div>
          )}

          {/* Loading state */}
          {isRunning && (
            <div className="glass-card rounded-xl p-6 mb-6 border border-cyan-500/15">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-sm font-medium text-white/70">Scanning clinic websites for posted prices...</span>
              </div>
              <div className="space-y-2">
                {["Generating search queries", "Fetching clinic pages", "Extracting price evidence", "Classifying results"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-cyan-400 animate-pulse" : "bg-white/20"}`} />
                    <span className="text-xs text-white/30">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {status === "complete" && results.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center border border-white/[0.06]">
              <TriangleAlert className="w-8 h-8 text-yellow-500/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-white/60">No actual posted public prices were found for this search.</p>
              <p className="text-xs text-white/30 mt-2">Try expanding the radius or adjusting clinic type filters.</p>
            </div>
          )}

          {status === "failed" && (
            <div className="glass-card rounded-xl p-6 text-center border border-red-500/20">
              <p className="text-sm text-red-400/80 mb-2">Search failed. Please try again.</p>
              <button onClick={() => setShouldPoll(false)} className="text-xs text-white/40 flex items-center gap-1 mx-auto">
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          <AnimatePresence>
            {postedResults.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <h3 className="text-xs font-semibold text-green-400/80 uppercase tracking-wider">Posted Price Found</h3>
                  <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">{postedResults.length}</span>
                </div>
                <div className="space-y-3">
                  {postedResults.map((r) => (
                    <ResultCard key={r.id} result={r} onSave={handleSave} onReview={handleReview} />
                  ))}
                </div>
              </motion.div>
            )}

            {possibleResults.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <h3 className="text-xs font-semibold text-yellow-400/70 uppercase tracking-wider">Possible Match</h3>
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-400/70 border border-yellow-500/15 px-1.5 py-0.5 rounded-full">{possibleResults.length}</span>
                </div>
                <div className="space-y-3">
                  {possibleResults.map((r) => (
                    <ResultCard key={r.id} result={r} onSave={handleSave} onReview={handleReview} />
                  ))}
                </div>
              </motion.div>
            )}

            {noPriceResults.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Clinic Found — No Public Price Posted</h3>
                  <span className="text-[10px] bg-white/[0.05] text-white/30 border border-white/[0.07] px-1.5 py-0.5 rounded-full">{noPriceResults.length}</span>
                </div>
                <div className="space-y-3">
                  {noPriceResults.map((r) => (
                    <ResultCard key={r.id} result={r} onSave={handleSave} onReview={handleReview} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Debug log */}
          {debugMode && searchQuery.data?.debugLog && (
            <div className="glass-card rounded-xl p-4 mt-4 border border-white/[0.06]">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Debug Log</div>
              {(searchQuery.data.debugLog as Array<{query: string; provider: string; urlsSearched: string[]; status: string; notes?: string}>).map((entry, i) => (
                <div key={i} className="mb-3 pb-3 border-b border-white/[0.04] last:border-0">
                  <div className="text-xs font-mono text-cyan-400/70 mb-1">{entry.query}</div>
                  <div className="text-[10px] text-white/30">Provider: {entry.provider} · Status: {entry.status}</div>
                  {entry.notes && <div className="text-[10px] text-yellow-400/50 mt-1">{entry.notes}</div>}
                  {entry.urlsSearched?.slice(0, 3).map((url) => (
                    <div key={url} className="text-[10px] text-white/20 truncate mt-0.5">{url}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
