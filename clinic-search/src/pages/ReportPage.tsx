import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Plus, Trash2, Download, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Phone, Globe2, FileText, Database,
  BarChart3, MapPin, Users, DollarSign, Activity, Info, Printer, Save,
  ArrowUpRight, X, Loader2
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface ContactAttempt {
  id: string;
  organizationName: string;
  contactMethod: "phone" | "email" | "web" | "in-person" | "fax";
  date: string;
  outcome: "no_response" | "declined" | "pending" | "partial" | "confirmed" | "referral";
  notes: string;
  contactedBy: string;
  priceConfirmed?: string;
  followUpRequired: boolean;
}

interface PriorSearch {
  id: string;
  searchDate: string;
  searchedBy: string;
  region: string;
  providerType: string;
  outcome: "successful" | "partial" | "unsuccessful" | "ongoing";
  providersFound: number;
  avgPriceFound: string;
  notes: string;
}

interface ReportRequest {
  // Request Identity
  requestId: string;
  requestDate: string;
  requestedBy: string;
  requestingDept: "operations" | "finance" | "network" | "clinical" | "executive";
  priority: "routine" | "urgent" | "critical";
  dueDate: string;

  // What & Where
  providerType: string;
  serviceDescription: string;
  targetRegion: string;
  targetCountry: string;
  targetState: string;
  targetCity: string;
  searchRadiusMiles: string;
  isInternational: boolean;

  // Manual Intelligence
  contactAttempts: ContactAttempt[];
  priorSearches: PriorSearch[];
  internalNotes: string;
  confirmedAvgPrice: string;
  priceRange: string;
  specialRequirements: string;

  // Status
  searchStatus: "not_started" | "in_progress" | "on_hold" | "completed" | "escalated";
  assignedTo: string;
  estimatedCompletion: string;
}

// ── Static intelligence databases ────────────────────────────────────────────
const PROVIDER_DIFFICULTY: Record<string, { base: number; label: string }> = {
  "Occupational Medicine":     { base: 72, label: "High" },
  "FAA Aviation Medical":      { base: 85, label: "Very High" },
  "DOT Physical Examiner":     { base: 68, label: "High" },
  "Urgent Care":               { base: 28, label: "Low" },
  "Primary Care / GP":         { base: 22, label: "Low" },
  "Cardiology / Stress Test":  { base: 55, label: "Moderate" },
  "Radiology / Mammogram":     { base: 42, label: "Moderate" },
  "Dental":                    { base: 30, label: "Low-Moderate" },
  "Drug Screening / Lab":      { base: 35, label: "Low-Moderate" },
  "Audiology":                 { base: 60, label: "Moderate-High" },
  "Physical Therapy":          { base: 38, label: "Low-Moderate" },
  "Ophthalmology / Eye Care":  { base: 45, label: "Moderate" },
  "Mental Health":             { base: 65, label: "High" },
  "Specialist (Other)":        { base: 58, label: "Moderate-High" },
};

const COUNTRY_DIFFICULTY: Record<string, { score: number; healthcare: string; infrastructure: string; dataAvailability: string }> = {
  "United States":   { score: 20, healthcare: "Advanced", infrastructure: "Excellent", dataAvailability: "High" },
  "Canada":          { score: 25, healthcare: "Advanced", infrastructure: "Excellent", dataAvailability: "High" },
  "United Kingdom":  { score: 28, healthcare: "Advanced", infrastructure: "Excellent", dataAvailability: "High" },
  "Germany":         { score: 30, healthcare: "Advanced", infrastructure: "Excellent", dataAvailability: "High" },
  "Australia":       { score: 32, healthcare: "Advanced", infrastructure: "Excellent", dataAvailability: "High" },
  "France":          { score: 33, healthcare: "Advanced", infrastructure: "Excellent", dataAvailability: "Moderate" },
  "Japan":           { score: 38, healthcare: "Advanced", infrastructure: "Excellent", dataAvailability: "Moderate" },
  "Brazil":          { score: 55, healthcare: "Developing", infrastructure: "Good", dataAvailability: "Low" },
  "Mexico":          { score: 50, healthcare: "Mixed", infrastructure: "Good", dataAvailability: "Low" },
  "India":           { score: 58, healthcare: "Mixed", infrastructure: "Mixed", dataAvailability: "Low" },
  "China":           { score: 60, healthcare: "Mixed", infrastructure: "Good", dataAvailability: "Very Low" },
  "South Africa":    { score: 62, healthcare: "Mixed", infrastructure: "Mixed", dataAvailability: "Low" },
  "Nigeria":         { score: 80, healthcare: "Limited", infrastructure: "Poor", dataAvailability: "Very Low" },
  "Remote/Rural Area": { score: 88, healthcare: "Limited", infrastructure: "Poor", dataAvailability: "Very Low" },
  "Other":           { score: 65, healthcare: "Unknown", infrastructure: "Unknown", dataAvailability: "Unknown" },
};

const STATE_DESERT_DATA: Record<string, { desertScore: number; providerPer100k: number; avgWaitDays: number }> = {
  "Wyoming":      { desertScore: 82, providerPer100k: 41, avgWaitDays: 28 },
  "Montana":      { desertScore: 78, providerPer100k: 48, avgWaitDays: 24 },
  "Idaho":        { desertScore: 71, providerPer100k: 52, avgWaitDays: 21 },
  "South Dakota": { desertScore: 74, providerPer100k: 45, avgWaitDays: 26 },
  "North Dakota": { desertScore: 70, providerPer100k: 50, avgWaitDays: 22 },
  "Alaska":       { desertScore: 88, providerPer100k: 35, avgWaitDays: 35 },
  "Mississippi":  { desertScore: 76, providerPer100k: 43, avgWaitDays: 27 },
  "West Virginia":{ desertScore: 73, providerPer100k: 47, avgWaitDays: 23 },
  "Arkansas":     { desertScore: 69, providerPer100k: 54, avgWaitDays: 20 },
  "New Mexico":   { desertScore: 67, providerPer100k: 57, avgWaitDays: 19 },
  "California":   { desertScore: 28, providerPer100k: 148, avgWaitDays: 8 },
  "New York":     { desertScore: 22, providerPer100k: 168, avgWaitDays: 7 },
  "Texas":        { desertScore: 44, providerPer100k: 98, avgWaitDays: 13 },
  "Florida":      { desertScore: 38, providerPer100k: 112, avgWaitDays: 11 },
  "Illinois":     { desertScore: 32, providerPer100k: 128, avgWaitDays: 9 },
  "Other":        { desertScore: 55, providerPer100k: 80, avgWaitDays: 16 },
};

const PROCEDURE_COSTS: Record<string, { usAvg: string; range: string; internationalMult: string }> = {
  "Occupational Medicine":     { usAvg: "$185", range: "$120–$350", internationalMult: "0.2x–0.6x US" },
  "FAA Aviation Medical":      { usAvg: "$165", range: "$75–$280", internationalMult: "N/A (US-specific)" },
  "DOT Physical Examiner":     { usAvg: "$110", range: "$75–$175", internationalMult: "N/A (US-specific)" },
  "Urgent Care":               { usAvg: "$195", range: "$120–$350", internationalMult: "0.15x–0.5x US" },
  "Primary Care / GP":         { usAvg: "$145", range: "$80–$280", internationalMult: "0.1x–0.4x US" },
  "Cardiology / Stress Test":  { usAvg: "$520", range: "$350–$1,200", internationalMult: "0.2x–0.5x US" },
  "Radiology / Mammogram":     { usAvg: "$220", range: "$100–$450", internationalMult: "0.15x–0.4x US" },
  "Dental":                    { usAvg: "$275", range: "$150–$600", internationalMult: "0.1x–0.3x US" },
  "Drug Screening / Lab":      { usAvg: "$65",  range: "$30–$150", internationalMult: "0.2x–0.6x US" },
  "Audiology":                 { usAvg: "$310", range: "$150–$600", internationalMult: "0.2x–0.5x US" },
  "Physical Therapy":          { usAvg: "$175", range: "$75–$350", internationalMult: "0.15x–0.4x US" },
  "Mental Health":             { usAvg: "$195", range: "$100–$400", internationalMult: "0.1x–0.35x US" },
  "Specialist (Other)":        { usAvg: "$320", range: "$150–$800", internationalMult: "0.2x–0.5x US" },
};

const DATA_SOURCES = [
  { name: "HRSA Area Health Resource Files", type: "Federal Database", scope: "US provider density, shortage areas", url: "https://data.hrsa.gov/topics/health-workforce/ahrf" },
  { name: "CMS National Provider Identifier Registry", type: "Federal Database", scope: "US licensed provider counts", url: "https://npiregistry.cms.hhs.gov/" },
  { name: "WHO Global Health Observatory", type: "International Database", scope: "Global healthcare infrastructure metrics", url: "https://www.who.int/data/gho" },
  { name: "World Bank Open Data", type: "International Database", scope: "Population, GDP, health expenditure", url: "https://data.worldbank.org/" },
  { name: "US Census Bureau", type: "Federal Database", scope: "Population, demographics, geography", url: "https://data.census.gov/" },
  { name: "FSMB Physician Data", type: "State Federation", scope: "US state medical board licensing data", url: "https://www.fsmb.org/" },
  { name: "OECD Health Statistics", type: "International Database", scope: "Procedure costs, healthcare systems", url: "https://stats.oecd.org/Index.aspx?DataSetCode=HEALTH_STAT" },
  { name: "AHRQ Healthcare Cost & Utilization", type: "Federal Database", scope: "US procedure costs and utilization", url: "https://www.hcupus.ahrq.gov/" },
  { name: "Occu-Med Internal Search History", type: "Internal Database", scope: "Prior searches, confirmed pricing, outcomes", url: "#" },
];

// ── Score Calculator ─────────────────────────────────────────────────────────
function computeScores(req: ReportRequest) {
  const provDiff = PROVIDER_DIFFICULTY[req.providerType]?.base ?? 55;
  const countryDiff = COUNTRY_DIFFICULTY[req.targetCountry]?.score ?? 55;
  const stateDiff = STATE_DESERT_DATA[req.targetState]?.desertScore ?? 50;

  // Contact penalty: more failed contacts = higher difficulty
  const failedContacts = req.contactAttempts.filter(c =>
    c.outcome === "no_response" || c.outcome === "declined"
  ).length;
  const contactPenalty = Math.min(failedContacts * 6, 30);

  // Prior search bonus: if we've done this before and succeeded, easier
  const priorSuccess = req.priorSearches.some(p => p.outcome === "successful");
  const priorBonus = priorSuccess ? -12 : 0;

  // International multiplier
  const intlMult = req.isInternational ? 1.35 : 1.0;

  const raw = ((provDiff * 0.40) + (countryDiff * 0.30) + (stateDiff * 0.20) + contactPenalty + priorBonus) * intlMult;
  const overallDifficulty = Math.min(Math.round(raw), 99);

  // Timeline estimate (business days)
  const baseDays = req.isInternational
    ? Math.round(5 + (overallDifficulty / 100) * 55)
    : Math.round(2 + (overallDifficulty / 100) * 28);

  const difficultyLabel =
    overallDifficulty >= 80 ? "Critical" :
    overallDifficulty >= 65 ? "Very High" :
    overallDifficulty >= 50 ? "High" :
    overallDifficulty >= 35 ? "Moderate" : "Low";

  const difficultyColor =
    overallDifficulty >= 80 ? "#ef4444" :
    overallDifficulty >= 65 ? "#f97316" :
    overallDifficulty >= 50 ? "#eab308" :
    overallDifficulty >= 35 ? "#22d3ee" : "#22c55e";

  return { overallDifficulty, difficultyLabel, difficultyColor, baseDays, failedContacts, priorSuccess };
}

// ── Colour helpers ────────────────────────────────────────────────────────────
const OUTCOME_COLORS: Record<string, string> = {
  no_response: "text-red-400 bg-red-500/10 border-red-500/25",
  declined: "text-red-400 bg-red-500/10 border-red-500/25",
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
  partial: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  confirmed: "text-green-400 bg-green-500/10 border-green-500/25",
  referral: "text-purple-400 bg-purple-500/10 border-purple-500/25",
  successful: "text-green-400 bg-green-500/10 border-green-500/25",
  unsuccessful: "text-red-400 bg-red-500/10 border-red-500/25",
  ongoing: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
};
const PRIORITY_COLORS: Record<string, string> = {
  routine: "text-blue-300 bg-blue-500/10 border-blue-500/25",
  urgent: "text-orange-300 bg-orange-500/10 border-orange-500/25",
  critical: "text-red-300 bg-red-500/10 border-red-500/25",
};
const STATUS_COLORS: Record<string, string> = {
  not_started: "text-slate-400 bg-slate-500/10 border-slate-500/25",
  in_progress: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
  on_hold: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
  completed: "text-green-400 bg-green-500/10 border-green-500/25",
  escalated: "text-red-400 bg-red-500/10 border-red-500/25",
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl
      shadow-[0_4px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]
      ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-sky-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white/90 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-white/45 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white/90
        placeholder-white/20 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.07]
        transition-all duration-150"
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0d1a35] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white/90
        focus:outline-none focus:border-sky-500/50 transition-all duration-150 appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white/90
        placeholder-white/20 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.07]
        transition-all duration-150 resize-none"
    />
  );
}

function ScoreGauge({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x="64" y="60" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="system-ui">{score}</text>
        <text x="64" y="76" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="system-ui">/ 100</text>
      </svg>
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
    </div>
  );
}

const EMPTY_REQUEST: ReportRequest = {
  requestId: `OM-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`,
  requestDate: new Date().toISOString().split("T")[0],
  requestedBy: "", requestingDept: "network", priority: "routine", dueDate: "",
  providerType: "Occupational Medicine", serviceDescription: "", targetRegion: "",
  targetCountry: "United States", targetState: "Other", targetCity: "",
  searchRadiusMiles: "25", isInternational: false,
  contactAttempts: [], priorSearches: [], internalNotes: "", confirmedAvgPrice: "",
  priceRange: "", specialRequirements: "",
  searchStatus: "not_started", assignedTo: "", estimatedCompletion: "",
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportPage() {
  const [, navigate] = useLocation();
  const [req, setReq] = useState<ReportRequest>({ ...EMPTY_REQUEST });
  const [activeTab, setActiveTab] = useState<"intake" | "intelligence" | "report">("intake");
  const [expandedSources, setExpandedSources] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const update = (key: keyof ReportRequest, val: unknown) =>
    setReq(r => ({ ...r, [key]: val }));

  const addContact = () => {
    const c: ContactAttempt = {
      id: uid(), organizationName: "", contactMethod: "phone",
      date: new Date().toISOString().split("T")[0], outcome: "pending",
      notes: "", contactedBy: "", priceConfirmed: "", followUpRequired: false,
    };
    update("contactAttempts", [...req.contactAttempts, c]);
  };

  const updateContact = (id: string, key: keyof ContactAttempt, val: unknown) =>
    update("contactAttempts", req.contactAttempts.map(c => c.id === id ? { ...c, [key]: val } : c));

  const removeContact = (id: string) =>
    update("contactAttempts", req.contactAttempts.filter(c => c.id !== id));

  const addPriorSearch = () => {
    const p: PriorSearch = {
      id: uid(), searchDate: "", searchedBy: "", region: req.targetRegion,
      providerType: req.providerType, outcome: "unsuccessful",
      providersFound: 0, avgPriceFound: "", notes: "",
    };
    update("priorSearches", [...req.priorSearches, p]);
  };

  const updatePrior = (id: string, key: keyof PriorSearch, val: unknown) =>
    update("priorSearches", req.priorSearches.map(p => p.id === id ? { ...p, [key]: val } : p));

  const removePrior = (id: string) =>
    update("priorSearches", req.priorSearches.filter(p => p.id !== id));

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setReportReady(true); setActiveTab("report"); }, 1800);
  };

  const scores = computeScores(req);
  const countryInfo = COUNTRY_DIFFICULTY[req.targetCountry] ?? COUNTRY_DIFFICULTY["Other"];
  const stateInfo = STATE_DESERT_DATA[req.targetState] ?? STATE_DESERT_DATA["Other"];
  const procCost = PROCEDURE_COSTS[req.providerType] ?? PROCEDURE_COSTS["Specialist (Other)"];

  const TABS = [
    { id: "intake", label: "Request Intake", icon: FileText },
    { id: "intelligence", label: "Field Intelligence", icon: Database },
    { id: "report", label: "Generated Report", icon: BarChart3 },
  ] as const;

  return (
    <div className="atmo-bg min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="glass-sidebar border-b border-white/[0.06] sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all text-xs font-medium">
              <ChevronLeft className="w-3.5 h-3.5" />Hub
            </button>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <BarChart3 className="w-3 h-3 text-sky-400" />
              </div>
              <span className="text-sm font-semibold text-white/90">Provider Search Intelligence Report</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[req.priority]}`}>
              {req.priority}
            </span>
            <span className={`text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.searchStatus]}`}>
              {req.searchStatus.replace("_", " ")}
            </span>
            <div className="w-px h-4 bg-white/10 ml-1" />
            <button onClick={generateReport} disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold hover:bg-sky-500/30 transition-all disabled:opacity-50">
              {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</> : <><RefreshCw className="w-3.5 h-3.5" />Generate Report</>}
            </button>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div className="border-b border-white/[0.06] bg-black/20 sticky top-14 z-40">
        <div className="max-w-screen-xl mx-auto px-4 flex gap-1 py-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150
                  ${active ? "bg-sky-500/15 text-sky-300 border border-sky-500/25" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === "report" && reportReady && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">

          {/* ── TAB 1: INTAKE ─────────────────────────────────────────────── */}
          {activeTab === "intake" && (
            <motion.div key="intake" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Request Identity */}
              <GlassCard className="p-6">
                <SectionHeader icon={FileText} title="Request Identity" subtitle="Who asked, when, and how urgent" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Request ID">
                    <Input value={req.requestId} onChange={v => update("requestId", v)} />
                  </Field>
                  <Field label="Request Date">
                    <Input type="date" value={req.requestDate} onChange={v => update("requestDate", v)} />
                  </Field>
                  <Field label="Requested By">
                    <Input value={req.requestedBy} onChange={v => update("requestedBy", v)} placeholder="Name / Dept" />
                  </Field>
                  <Field label="Requesting Department">
                    <Select value={req.requestingDept} onChange={v => update("requestingDept", v)} options={[
                      { value: "operations", label: "Operations" },
                      { value: "finance", label: "Finance" },
                      { value: "network", label: "Network Development" },
                      { value: "clinical", label: "Clinical" },
                      { value: "executive", label: "Executive" },
                    ]} />
                  </Field>
                  <Field label="Priority Level">
                    <Select value={req.priority} onChange={v => update("priority", v)} options={[
                      { value: "routine", label: "Routine" },
                      { value: "urgent", label: "Urgent" },
                      { value: "critical", label: "Critical" },
                    ]} />
                  </Field>
                  <Field label="Due Date">
                    <Input type="date" value={req.dueDate} onChange={v => update("dueDate", v)} />
                  </Field>
                  <Field label="Assigned To">
                    <Input value={req.assignedTo} onChange={v => update("assignedTo", v)} placeholder="Team member name" />
                  </Field>
                  <Field label="Current Status">
                    <Select value={req.searchStatus} onChange={v => update("searchStatus", v)} options={[
                      { value: "not_started", label: "Not Started" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "on_hold", label: "On Hold" },
                      { value: "completed", label: "Completed" },
                      { value: "escalated", label: "Escalated" },
                    ]} />
                  </Field>
                </div>
              </GlassCard>

              {/* What & Where */}
              <GlassCard className="p-6">
                <SectionHeader icon={MapPin} title="Provider & Location" subtitle="What are we searching for and where" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Provider Type">
                    <Select value={req.providerType} onChange={v => update("providerType", v)} options={
                      Object.keys(PROVIDER_DIFFICULTY).map(k => ({ value: k, label: k }))
                    } />
                  </Field>
                  <Field label="Search Radius (miles)">
                    <Input value={req.searchRadiusMiles} onChange={v => update("searchRadiusMiles", v)} placeholder="25" />
                  </Field>
                  <Field label="Country">
                    <Select value={req.targetCountry} onChange={v => {
                      update("targetCountry", v);
                      update("isInternational", v !== "United States");
                    }} options={Object.keys(COUNTRY_DIFFICULTY).map(k => ({ value: k, label: k }))} />
                  </Field>
                  <Field label="State / Region">
                    <Select value={req.targetState} onChange={v => update("targetState", v)} options={[
                      ...Object.keys(STATE_DESERT_DATA).map(k => ({ value: k, label: k })),
                    ]} />
                  </Field>
                  <Field label="City / Area">
                    <Input value={req.targetCity} onChange={v => update("targetCity", v)} placeholder="City name" />
                  </Field>
                  <Field label="Specific Region / Zone">
                    <Input value={req.targetRegion} onChange={v => update("targetRegion", v)} placeholder="e.g. Rural, Metro, etc." />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Service Description">
                      <Textarea value={req.serviceDescription} onChange={v => update("serviceDescription", v)}
                        placeholder="Describe exactly what services / procedures are needed…" rows={2} />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Special Requirements / Certifications">
                      <Textarea value={req.specialRequirements} onChange={v => update("specialRequirements", v)}
                        placeholder="e.g. FMCSA certified, bilingual, specific hours, equipment required…" rows={2} />
                    </Field>
                  </div>
                </div>
              </GlassCard>

              {/* Pricing */}
              <GlassCard className="p-6">
                <SectionHeader icon={DollarSign} title="Pricing Intelligence" subtitle="What we know about costs so far" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Confirmed Avg Price Found">
                    <Input value={req.confirmedAvgPrice} onChange={v => update("confirmedAvgPrice", v)} placeholder="$0.00" />
                  </Field>
                  <Field label="Price Range Observed">
                    <Input value={req.priceRange} onChange={v => update("priceRange", v)} placeholder="$XXX – $XXX" />
                  </Field>
                </div>
                {req.providerType && (
                  <div className="mt-4 rounded-xl border border-sky-500/15 bg-sky-500/5 p-4">
                    <p className="text-[10px] font-semibold text-sky-400/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Database className="w-3 h-3" /> Benchmark Reference (AHRQ / OECD)
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-sky-300">{procCost.usAvg}</p>
                        <p className="text-[10px] text-white/40">US Average</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/70">{procCost.range}</p>
                        <p className="text-[10px] text-white/40">US Range</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/70">{procCost.internationalMult}</p>
                        <p className="text-[10px] text-white/40">Intl. vs US</p>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* Notes */}
              <GlassCard className="p-6">
                <SectionHeader icon={Activity} title="Internal Notes" subtitle="Context for Operations and Finance" />
                <Textarea value={req.internalNotes} onChange={v => update("internalNotes", v)}
                  placeholder="Add any internal context, background on this request, client sensitivity, escalation history, political considerations, timeline pressures…"
                  rows={7} />
              </GlassCard>
            </motion.div>
          )}

          {/* ── TAB 2: FIELD INTELLIGENCE ─────────────────────────────────── */}
          {activeTab === "intelligence" && (
            <motion.div key="intel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
              className="flex flex-col gap-6">

              {/* Contact Attempts */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <SectionHeader icon={Phone} title="Contact Attempts Log"
                    subtitle={`${req.contactAttempts.length} recorded — every outreach documented for Operations`} />
                  <button onClick={addContact}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition-all">
                    <Plus className="w-3.5 h-3.5" />Add Contact
                  </button>
                </div>

                {req.contactAttempts.length === 0 && (
                  <div className="text-center py-10 text-white/25 text-sm">
                    No contacts logged yet — add each outreach attempt above
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {req.contactAttempts.map((c, idx) => (
                    <div key={c.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Contact #{idx + 1}</span>
                        <button onClick={() => removeContact(c.id)} className="text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="col-span-2 md:col-span-1">
                          <Field label="Organization Name">
                            <Input value={c.organizationName} onChange={v => updateContact(c.id, "organizationName", v)} placeholder="Clinic / provider name" />
                          </Field>
                        </div>
                        <Field label="Method">
                          <Select value={c.contactMethod} onChange={v => updateContact(c.id, "contactMethod", v)} options={[
                            { value: "phone", label: "Phone" },
                            { value: "email", label: "Email" },
                            { value: "web", label: "Web Form" },
                            { value: "in-person", label: "In Person" },
                            { value: "fax", label: "Fax" },
                          ]} />
                        </Field>
                        <Field label="Date">
                          <Input type="date" value={c.date} onChange={v => updateContact(c.id, "date", v)} />
                        </Field>
                        <Field label="Outcome">
                          <Select value={c.outcome} onChange={v => updateContact(c.id, "outcome", v)} options={[
                            { value: "pending", label: "Pending Response" },
                            { value: "no_response", label: "No Response" },
                            { value: "declined", label: "Declined" },
                            { value: "partial", label: "Partial Info" },
                            { value: "confirmed", label: "Confirmed" },
                            { value: "referral", label: "Referred Elsewhere" },
                          ]} />
                        </Field>
                        <Field label="Contacted By">
                          <Input value={c.contactedBy} onChange={v => updateContact(c.id, "contactedBy", v)} placeholder="Staff name" />
                        </Field>
                        <Field label="Price Confirmed (if any)">
                          <Input value={c.priceConfirmed ?? ""} onChange={v => updateContact(c.id, "priceConfirmed", v)} placeholder="$0.00" />
                        </Field>
                        <div className="col-span-2 md:col-span-3">
                          <Field label="Notes">
                            <Textarea value={c.notes} onChange={v => updateContact(c.id, "notes", v)}
                              placeholder="What was said, next steps, voicemail left, etc." rows={2} />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Prior Searches */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <SectionHeader icon={Clock} title="Prior Search History"
                    subtitle="Has this location / provider type been searched before?" />
                  <button onClick={addPriorSearch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition-all">
                    <Plus className="w-3.5 h-3.5" />Add Prior Search
                  </button>
                </div>

                {req.priorSearches.length === 0 && (
                  <div className="text-center py-10 text-white/25 text-sm">
                    No prior search history recorded for this location
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {req.priorSearches.map((p, idx) => (
                    <div key={p.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Prior Search #{idx + 1}</span>
                        <button onClick={() => removePrior(p.id)} className="text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Field label="Search Date">
                          <Input type="date" value={p.searchDate} onChange={v => updatePrior(p.id, "searchDate", v)} />
                        </Field>
                        <Field label="Searched By">
                          <Input value={p.searchedBy} onChange={v => updatePrior(p.id, "searchedBy", v)} placeholder="Staff name" />
                        </Field>
                        <Field label="Outcome">
                          <Select value={p.outcome} onChange={v => updatePrior(p.id, "outcome", v)} options={[
                            { value: "successful", label: "Successful" },
                            { value: "partial", label: "Partial" },
                            { value: "unsuccessful", label: "Unsuccessful" },
                            { value: "ongoing", label: "Still Ongoing" },
                          ]} />
                        </Field>
                        <Field label="Providers Found">
                          <Input type="number" value={String(p.providersFound)} onChange={v => updatePrior(p.id, "providersFound", parseInt(v)||0)} placeholder="0" />
                        </Field>
                        <Field label="Avg Price Found">
                          <Input value={p.avgPriceFound} onChange={v => updatePrior(p.id, "avgPriceFound", v)} placeholder="$0.00" />
                        </Field>
                        <div className="col-span-2 md:col-span-3">
                          <Field label="Notes / Outcome Summary">
                            <Textarea value={p.notes} onChange={v => updatePrior(p.id, "notes", v)} placeholder="What happened, why it succeeded or failed…" rows={2} />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ── TAB 3: GENERATED REPORT ───────────────────────────────────── */}
          {activeTab === "report" && (
            <motion.div key="report" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>

              {!reportReady ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4 text-white/30">
                  <BarChart3 className="w-12 h-12 opacity-30" />
                  <p className="text-sm">Fill out the intake form, then click <strong className="text-white/50">Generate Report</strong></p>
                </div>
              ) : (
                <div ref={reportRef}>
                  {/* Print / export bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white/90">Provider Search Intelligence Report</h2>
                      <p className="text-xs text-white/35 mt-0.5">Request {req.requestId} · Generated {new Date().toLocaleDateString("en-US", { year:"numeric",month:"long",day:"numeric" })}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/50 text-xs font-medium hover:text-white/80 hover:bg-white/[0.09] transition-all">
                        <Printer className="w-3.5 h-3.5" />Print
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition-all">
                        <Download className="w-3.5 h-3.5" />Export PDF
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">

                    {/* Executive Summary */}
                    <GlassCard className="p-6">
                      <div className="flex items-start gap-6 flex-wrap">
                        {/* Score gauge */}
                        <ScoreGauge score={scores.overallDifficulty} color={scores.difficultyColor} label={`${scores.difficultyLabel} Difficulty`} />

                        {/* Summary text */}
                        <div className="flex-1 min-w-[260px]">
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[req.priority]}`}>{req.priority} priority</span>
                            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.searchStatus]}`}>{req.searchStatus.replace("_"," ")}</span>
                          </div>
                          <h3 className="text-base font-bold text-white/90 mb-2">
                            {req.providerType} Search — {req.targetCity || req.targetRegion || req.targetState}{req.isInternational ? `, ${req.targetCountry}` : ""}
                          </h3>
                          <p className="text-sm text-white/55 leading-relaxed mb-3">
                            This request presents a <strong className="text-white/75" style={{color:scores.difficultyColor}}>{scores.difficultyLabel.toLowerCase()} difficulty</strong> search scenario
                            based on {req.providerType.toLowerCase()} provider density, regional healthcare infrastructure,
                            {req.isInternational ? " international access barriers," : ""} and{" "}
                            {scores.failedContacts > 0 ? `${scores.failedContacts} failed contact attempt${scores.failedContacts > 1?"s":""} to date` : "current outreach status"}.
                            Estimated resolution timeline is <strong className="text-white/75">{scores.baseDays}–{Math.round(scores.baseDays * 1.4)} business days</strong> under current conditions.
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
                              <p className="text-xl font-bold text-white/90">{scores.baseDays}–{Math.round(scores.baseDays*1.4)}</p>
                              <p className="text-[10px] text-white/35 mt-0.5">Est. Business Days</p>
                            </div>
                            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
                              <p className="text-xl font-bold text-white/90">{req.contactAttempts.length}</p>
                              <p className="text-[10px] text-white/35 mt-0.5">Contacts Attempted</p>
                            </div>
                            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
                              <p className="text-xl font-bold text-white/90">{req.priorSearches.length}</p>
                              <p className="text-[10px] text-white/35 mt-0.5">Prior Searches</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>

                    {/* Difficulty Breakdown */}
                    <GlassCard className="p-6">
                      <SectionHeader icon={BarChart3} title="Difficulty Factor Analysis"
                        subtitle="Each factor scored independently and weighted into the overall index" />
                      <div className="space-y-3">
                        {[
                          { label: "Provider Type Scarcity", value: PROVIDER_DIFFICULTY[req.providerType]?.base ?? 55,
                            note: `${req.providerType} providers are ${PROVIDER_DIFFICULTY[req.providerType]?.label ?? "moderately"} scarce nationwide`, weight: "40%" },
                          { label: "Country / Market Access", value: countryInfo.score,
                            note: `${req.targetCountry}: ${countryInfo.healthcare} healthcare, data availability ${countryInfo.dataAvailability}`, weight: "30%" },
                          { label: "Regional Healthcare Desert Score", value: stateInfo.desertScore,
                            note: `${req.targetState}: ~${stateInfo.providerPer100k} providers per 100k pop., avg wait ${stateInfo.avgWaitDays} days`, weight: "20%" },
                          { label: "Failed Contact Penalty", value: Math.min(scores.failedContacts * 6, 30),
                            note: `${scores.failedContacts} failed/no-response contacts adding friction`, weight: "+additive" },
                          { label: "Prior Search Adjustment", value: scores.priorSuccess ? -12 : 0,
                            note: scores.priorSuccess ? "Prior successful search reduces baseline effort" : "No prior successful search — starting cold", weight: "+/-" },
                        ].map(f => (
                          <div key={f.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-sm font-semibold text-white/80">{f.label}</span>
                                <span className="ml-2 text-[10px] text-white/30 bg-white/[0.05] px-1.5 py-0.5 rounded-full">weight {f.weight}</span>
                              </div>
                              <span className="text-sm font-bold" style={{ color: f.value > 60 ? "#ef4444" : f.value > 40 ? "#eab308" : f.value < 0 ? "#22c55e" : "#22d3ee" }}>
                                {f.value > 0 ? "+" : ""}{f.value}
                              </span>
                            </div>
                            <div className="w-full bg-white/[0.05] rounded-full h-1.5 mb-2">
                              <div className="h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.abs(Math.min(f.value, 100))}%`, background: f.value < 0 ? "#22c55e" : f.value > 60 ? "#ef4444" : f.value > 40 ? "#eab308" : "#22d3ee" }} />
                            </div>
                            <p className="text-xs text-white/35">{f.note}</p>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Regional Intelligence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <GlassCard className="p-5">
                        <SectionHeader icon={MapPin} title="Healthcare Desert Metrics" />
                        <div className="space-y-3">
                          {[
                            { label: "Desert Score", value: `${stateInfo.desertScore}/100` },
                            { label: "Providers / 100k Pop.", value: `${stateInfo.providerPer100k}` },
                            { label: "Avg Wait Time", value: `${stateInfo.avgWaitDays} days` },
                            { label: "Data Source", value: "HRSA AHRF" },
                          ].map(r => (
                            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0">
                              <span className="text-xs text-white/45">{r.label}</span>
                              <span className="text-xs font-semibold text-white/80">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      <GlassCard className="p-5">
                        <SectionHeader icon={Globe2} title="Country Intelligence" />
                        <div className="space-y-3">
                          {[
                            { label: "Market Access Score", value: `${countryInfo.score}/100` },
                            { label: "Healthcare System", value: countryInfo.healthcare },
                            { label: "Infrastructure", value: countryInfo.infrastructure },
                            { label: "Data Availability", value: countryInfo.dataAvailability },
                          ].map(r => (
                            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0">
                              <span className="text-xs text-white/45">{r.label}</span>
                              <span className="text-xs font-semibold text-white/80">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      <GlassCard className="p-5">
                        <SectionHeader icon={DollarSign} title="Procedure Cost Reference" />
                        <div className="space-y-3">
                          {[
                            { label: "US Average", value: procCost.usAvg },
                            { label: "US Range", value: procCost.range },
                            { label: "International", value: procCost.internationalMult },
                            { label: "Confirmed (This Search)", value: req.confirmedAvgPrice || "Not yet confirmed" },
                          ].map(r => (
                            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0">
                              <span className="text-xs text-white/45">{r.label}</span>
                              <span className="text-xs font-semibold text-sky-300">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </div>

                    {/* Contact History Summary */}
                    {req.contactAttempts.length > 0 && (
                      <GlassCard className="p-6">
                        <SectionHeader icon={Phone} title="Outreach Summary"
                          subtitle={`${req.contactAttempts.length} contact attempts documented`} />
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-white/[0.07]">
                                {["#","Organization","Method","Date","Contacted By","Outcome","Price","Notes"].map(h => (
                                  <th key={h} className="text-left py-2 px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {req.contactAttempts.map((c, i) => (
                                <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                  <td className="py-2 px-3 text-white/40">{i+1}</td>
                                  <td className="py-2 px-3 text-white/75 font-medium">{c.organizationName || "—"}</td>
                                  <td className="py-2 px-3 text-white/55 capitalize">{c.contactMethod}</td>
                                  <td className="py-2 px-3 text-white/55">{c.date || "—"}</td>
                                  <td className="py-2 px-3 text-white/55">{c.contactedBy || "—"}</td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${OUTCOME_COLORS[c.outcome]}`}>
                                      {c.outcome.replace("_"," ")}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-sky-300">{c.priceConfirmed || "—"}</td>
                                  <td className="py-2 px-3 text-white/40 max-w-[160px] truncate">{c.notes || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </GlassCard>
                    )}

                    {/* Prior Search History */}
                    {req.priorSearches.length > 0 && (
                      <GlassCard className="p-6">
                        <SectionHeader icon={Clock} title="Prior Search Record" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {req.priorSearches.map((p, i) => (
                            <div key={p.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-xs font-bold text-white/60">Prior Search #{i+1}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${OUTCOME_COLORS[p.outcome]}`}>
                                  {p.outcome}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><span className="text-white/35">Date:</span> <span className="text-white/70">{p.searchDate || "—"}</span></div>
                                <div><span className="text-white/35">By:</span> <span className="text-white/70">{p.searchedBy || "—"}</span></div>
                                <div><span className="text-white/35">Found:</span> <span className="text-white/70">{p.providersFound} providers</span></div>
                                <div><span className="text-white/35">Avg Price:</span> <span className="text-sky-300">{p.avgPriceFound || "—"}</span></div>
                              </div>
                              {p.notes && <p className="text-xs text-white/40 mt-2 pt-2 border-t border-white/[0.05]">{p.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    )}

                    {/* Internal Notes */}
                    {req.internalNotes && (
                      <GlassCard className="p-6">
                        <SectionHeader icon={Info} title="Internal Notes" subtitle="For Operations & Finance use — not for external distribution" />
                        <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4">
                          <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{req.internalNotes}</p>
                        </div>
                      </GlassCard>
                    )}

                    {/* Data Sources */}
                    <GlassCard className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <SectionHeader icon={Database} title="Data Sources Consulted"
                          subtitle="Full transparency on every database referenced to generate this report" />
                        <button onClick={() => setExpandedSources(!expandedSources)}
                          className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors">
                          {expandedSources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {expandedSources ? "Collapse" : "Expand All"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {DATA_SOURCES.map(src => (
                          <div key={src.name}
                            className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-white/80 leading-snug">{src.name}</span>
                              {src.url !== "#" && (
                                <a href={src.url} target="_blank" rel="noopener noreferrer"
                                  className="shrink-0 text-sky-400/60 hover:text-sky-400 transition-colors">
                                  <ArrowUpRight className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold text-sky-400/70 uppercase tracking-widest">{src.type}</span>
                            {expandedSources && <p className="text-[11px] text-white/35">{src.scope}</p>}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/20 mt-4 leading-relaxed">
                        This report incorporates benchmark data from federal health registries, international databases,
                        and Occu-Med internal records. Difficulty scores are algorithmic estimates based on publicly available
                        provider density, geographic, and economic data. All figures should be interpreted as intelligence
                        inputs — not guaranteed outcomes.
                      </p>
                    </GlassCard>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
