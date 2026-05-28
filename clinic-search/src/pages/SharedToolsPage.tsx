import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, X, Check, ArrowLeft, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

// ── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY = "shared_tools_links";
function getStorageLinks(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveStorageLinks(links: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

// ── Storage portal slots ──────────────────────────────────────────────────────
const STORAGE_SLOTS = [
  { id: "storage-1", label: "Storage Portal 1", description: "Link a Render-deployed storage or utility app." },
  { id: "storage-2", label: "Storage Portal 2", description: "Link a Render-deployed storage or utility app." },
  { id: "storage-3", label: "Storage Portal 3", description: "Link a Render-deployed storage or utility app." },
  { id: "storage-4", label: "Storage Portal 4", description: "Link a Render-deployed storage or utility app." },
  { id: "storage-5", label: "Storage Portal 5", description: "Link a Render-deployed storage or utility app." },
  { id: "storage-6", label: "Storage Portal 6", description: "Link a Render-deployed storage or utility app." },
];

// ── Link pip ──────────────────────────────────────────────────────────────────
function LinkPip({ slotId, onSave }: { slotId: string; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(() => getStorageLinks()[slotId] || "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const links = getStorageLinks();
    links[slotId] = val.trim();
    saveStorageLinks(links);
    setSaved(true);
    onSave();
    setTimeout(() => { setSaved(false); setOpen(false); }, 700);
  }

  return (
    <div className="absolute top-2 right-2 z-20">
      <button
        onClick={e => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        title="Set portal link"
        style={{
          width: "18px", height: "18px", borderRadius: "50%",
          background: "rgba(255,200,60,0.18)", border: "1.5px solid rgba(255,200,60,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,200,60,0.38)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,200,60,0.18)")}
      >
        <Link2 style={{ width: "9px", height: "9px", color: "rgba(255,210,80,0.9)" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -4 }}
            transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: "24px", right: 0, width: "260px",
              background: "rgba(12,14,26,0.97)", border: "1px solid rgba(255,200,60,0.28)",
              borderRadius: "12px", padding: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              zIndex: 50,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,210,80,0.9)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Portal Link</span>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "2px" }}>
                <X style={{ width: "12px", height: "12px" }} />
              </button>
            </div>
            <input
              type="url"
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder="https://your-render-url.onrender.com"
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "7px", padding: "7px 10px", fontSize: "11px", color: "rgba(255,255,255,0.85)",
                outline: "none", boxSizing: "border-box",
              }}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <button
              onClick={handleSave}
              style={{
                marginTop: "10px", width: "100%", padding: "7px",
                background: saved ? "rgba(34,197,94,0.25)" : "rgba(255,200,60,0.18)",
                border: `1px solid ${saved ? "rgba(34,197,94,0.5)" : "rgba(255,200,60,0.4)"}`,
                borderRadius: "7px", color: saved ? "rgba(134,239,172,0.9)" : "rgba(255,210,80,0.9)",
                fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.2s",
              }}
            >
              {saved ? <><Check style={{ width: "11px", height: "11px" }} /> Saved!</> : "Save Link"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SharedToolsPage() {
  const [, navigate] = useLocation();
  const [links, setLinks] = useState<Record<string, string>>(getStorageLinks);

  function refreshLinks() { setLinks(getStorageLinks()); }

  function handleSlotClick(slotId: string) {
    const link = links[slotId];
    if (link) window.open(link, "_blank", "noopener noreferrer");
  }

  return (
    <div className="hub-bg min-h-screen flex flex-col items-center px-6 py-14 relative overflow-hidden">
      <div className="hub-sunrays" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => <div key={i} className="hub-ray" />)}
      </div>
      <div className="hub-horizon" aria-hidden="true" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-5xl mb-10"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </button>
        <h1 className="hub-title font-bold tracking-tight text-center"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
          Shared Tools
        </h1>
        <p className="text-center text-white/40 text-sm mt-3">
          Storage Portal — link your deployed apps to each slot below
        </p>
        <div className="hub-divider w-24 mx-auto mt-5" />
      </motion.div>

      {/* Storage Portal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl relative z-10">
        {STORAGE_SLOTS.map((slot, i) => {
          const link = links[slot.id];
          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.08 + i * 0.07 }}
              onClick={() => handleSlotClick(slot.id)}
              className={`hub-card hub-card-active rounded-2xl flex flex-col relative ${link ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="hub-specular-top" />
              <div className="hub-specular-left" />
              <LinkPip slotId={slot.id} onSave={refreshLinks} />

              {/* Placeholder visual */}
              <div className="mx-3 mt-3 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ width: "calc(100% - 1.5rem)", height: "120px", background: "rgba(255,200,60,0.04)", border: "1px dashed rgba(255,200,60,0.18)", borderRadius: "0.75rem" }}>
                {link ? (
                  <ExternalLink className="w-8 h-8 text-yellow-400/40" />
                ) : (
                  <Link2 className="w-8 h-8 text-white/10" />
                )}
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white/90 leading-snug tracking-tight">{slot.label}</h2>
                  {link && <ExternalLink className="w-3 h-3 text-yellow-400/60 shrink-0 mt-0.5" />}
                </div>
                <p className="text-xs text-white/42 leading-relaxed">
                  {link ? `Linked → ${new URL(link).hostname}` : slot.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {link ? (
                    <span className="hub-badge-live">Linked ↗</span>
                  ) : (
                    <span style={{ fontSize: "10px", color: "rgba(255,210,80,0.6)", background: "rgba(255,200,60,0.10)", border: "1px solid rgba(255,200,60,0.25)", borderRadius: "4px", padding: "2px 7px" }}>Add Link →</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.8 }}
        className="mt-16 text-[10px] text-white/15 tracking-[0.28em] uppercase relative z-10"
      >
        Occu-Med Shared Tools Storage Portal
      </motion.p>
    </div>
  );
}
