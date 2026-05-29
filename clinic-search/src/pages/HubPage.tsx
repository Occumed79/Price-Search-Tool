import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ExternalLink, Link2, X, Check } from "lucide-react";

import occuMedLogo from "@/assets/occu-med-logo.png";
import imgNetworkSearch from "@/assets/portal-network-search.png";
import imgNetworkMap from "@/assets/portal-network-map.png";
import imgProviderAcq from "@/assets/portal-provider-acquisition.png";
import imgReportGen from "@/assets/portal-report-generator.png";
import imgIntlSearch from "@/assets/portal-international-search.png";
import imgPricingTransp from "@/assets/portal-pricing-transparency.png";
import imgLabSupply from "@/assets/portal-lab-supply-orders.png";
import imgProspectiveProv from "@/assets/portal-prospective-providers.png";
import imgSharedTools from "@/assets/portal-shared-tools.png";

const LOGO_URL = occuMedLogo;

// ── Link storage helpers ──────────────────────────────────────────────────────
const LINKS_KEY = "hub_portal_links";
function getLinks(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LINKS_KEY) || "{}"); } catch { return {}; }
}
function saveLinks(links: Record<string, string>) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

// ── Static photos for original 6 portals ─────────────────────────────────────
const PHOTOS: Record<string, string> = {
  "network-search": imgNetworkSearch,
  "network-map": imgNetworkMap,
  "provider-acquisition": imgProviderAcq,
  "report-generator": imgReportGen,
  "international-search": imgIntlSearch,
  "pricing-transparency": imgPricingTransp,
};

const INTL_URL = "https://international-search.onrender.com";
const FORMS_URL = "https://occu-med-forms-frontend.onrender.com";

// ── Portal definitions ────────────────────────────────────────────────────────
type Portal = {
  id: string;
  label: string;
  description: string;
  href?: string;
  external?: boolean;
  comingSoon?: boolean;
  linkable?: boolean; // shows pip button
  customImg?: string;
  isSharedTools?: boolean;
};

const STATIC_PORTALS: Portal[] = [
  { id: "network-search", label: "Network Search", description: "Search posted prices across clinics, urgent care, labs, and more — anywhere in the country.", href: "/search", external: false, comingSoon: false },
  { id: "network-map", label: "Network Map", description: "Visualize provider coverage and geographic distribution across all regions.", href: "/network-map", external: false, comingSoon: false },
  { id: "provider-acquisition", label: "Provider Acquisition", description: "Browse and manage the full network of Occu-Med affiliated providers.", href: FORMS_URL, external: true, comingSoon: false },
  { id: "report-generator", label: "Report Generator", description: "Generate utilization, cost trend, and network performance reports on demand.", href: "/report", external: false, comingSoon: false, linkable: true },
  { id: "international-search", label: "International Search", description: "Extend your search globally — find providers and pricing across international networks.", href: INTL_URL, external: true, comingSoon: false },
  { id: "pricing-transparency", label: "Pricing Transparency Database", description: "Access and compare self-pay and posted pricing data across the full provider network.", href: "#", external: false, comingSoon: false, linkable: true },
];

const EXTRA_PORTALS: Portal[] = [
  { id: "lab-supply-orders", label: "Lab Supply Orders", description: "Manage and track lab supply procurement — orders, vendors, and fulfillment status.", customImg: imgLabSupply, linkable: true },
  { id: "prospective-providers", label: "Prospective Providers Portal", description: "Evaluate and onboard new providers — pipeline tracking, credentialing, and outreach.", customImg: imgProspectiveProv, linkable: true },
  { id: "shared-tools", label: "Shared Tools", description: "Centralized workspace for shared utilities, storage portals, and cross-team tools.", customImg: imgSharedTools, isSharedTools: true },
];

// ── Link pip button ───────────────────────────────────────────────────────────
function LinkPip({ portalId, onSave }: { portalId: string; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(() => getLinks()[portalId] || "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const links = getLinks();
    links[portalId] = val.trim();
    saveLinks(links);
    setSaved(true);
    onSave();
    setTimeout(() => { setSaved(false); setOpen(false); }, 700);
  }

  return (
    <div className="absolute top-2 right-2 z-20">
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
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

// ── Main component ────────────────────────────────────────────────────────────
export default function HubPage() {
  const [, navigate] = useLocation();
  const [links, setLinks] = useState<Record<string, string>>(getLinks);

  function refreshLinks() { setLinks(getLinks()); }

  function handlePortalClick(portal: Portal) {
    if (portal.isSharedTools) { navigate("/shared-tools"); return; }
    const savedLink = links[portal.id];
    if (savedLink) { window.open(savedLink, "_blank", "noopener noreferrer"); return; }
    if (!portal.href || portal.href === "#") return;
    if (portal.external) { window.open(portal.href, "_blank", "noopener noreferrer"); }
    else { navigate(portal.href); }
  }

  const allPortals = [...STATIC_PORTALS, ...EXTRA_PORTALS];

  return (
    <div className="hub-bg min-h-screen flex flex-col items-center px-6 py-14 relative overflow-hidden">
      <div className="hub-sunrays" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => <div key={i} className="hub-ray" />)}
      </div>
      <div className="hub-horizon" aria-hidden="true" />

      {/* Floating orbs — high visibility */}
      <div className="hub-orbs" aria-hidden="true">
        {/* Blazing cyan — top left */}
        <div style={{ position:"absolute", top:"6%", left:"4%", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle at center, rgba(0,229,255,0.75) 0%, rgba(0,188,212,0.40) 30%, rgba(0,150,136,0.15) 60%, transparent 75%)", filter:"blur(22px)", animation:"orbDrift1 26s ease-in-out infinite", pointerEvents:"none" }} />
        {/* Teal — bottom right */}
        <div style={{ position:"absolute", bottom:"8%", right:"3%", width:"560px", height:"560px", borderRadius:"50%", background:"radial-gradient(circle at center, rgba(0,188,212,0.70) 0%, rgba(38,166,154,0.35) 32%, rgba(0,150,136,0.15) 60%, transparent 75%)", filter:"blur(24px)", animation:"orbDrift2 32s ease-in-out infinite", pointerEvents:"none" }} />
        {/* Green — mid left */}
        <div style={{ position:"absolute", top:"42%", left:"1%", width:"360px", height:"360px", borderRadius:"50%", background:"radial-gradient(circle at center, rgba(102,187,106,0.65) 0%, rgba(56,142,60,0.35) 38%, transparent 70%)", filter:"blur(18px)", animation:"orbDrift3 18s ease-in-out infinite", pointerEvents:"none" }} />
        {/* Pure cyan — top right */}
        <div style={{ position:"absolute", top:"3%", right:"6%", width:"320px", height:"320px", borderRadius:"50%", background:"radial-gradient(circle at center, rgba(0,229,255,0.85) 0%, rgba(0,212,220,0.45) 35%, transparent 68%)", filter:"blur(16px)", animation:"orbPulse 11s ease-in-out infinite", animationDelay:"-4s", pointerEvents:"none" }} />
        {/* Seafoam — bottom left */}
        <div style={{ position:"absolute", bottom:"4%", left:"8%", width:"420px", height:"420px", borderRadius:"50%", background:"radial-gradient(circle at center, rgba(38,166,154,0.65) 0%, rgba(0,188,212,0.32) 38%, transparent 70%)", filter:"blur(20px)", animation:"orbDrift1 22s ease-in-out infinite", animationDelay:"-10s", pointerEvents:"none" }} />
        {/* Center glow — wide ambient */}
        <div style={{ position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)", width:"800px", height:"400px", borderRadius:"50%", background:"radial-gradient(ellipse at center, rgba(0,188,212,0.45) 0%, rgba(0,150,136,0.22) 40%, transparent 68%)", filter:"blur(30px)", animation:"orbPulse 14s ease-in-out infinite", animationDelay:"-7s", pointerEvents:"none" }} />
        {/* Mid-right green accent */}
        <div style={{ position:"absolute", top:"55%", right:"2%", width:"280px", height:"280px", borderRadius:"50%", background:"radial-gradient(circle at center, rgba(124,179,66,0.60) 0%, rgba(102,187,106,0.28) 42%, transparent 70%)", filter:"blur(18px)", animation:"orbDrift3 20s ease-in-out infinite", animationDelay:"-5s", pointerEvents:"none" }} />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.70, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4 mb-12 relative z-10 w-full"
      >
        <img src={LOGO_URL} alt="Occu-Med" style={{ height: "300px", width: "auto", objectFit: "contain", display: "block", filter: "drop-shadow(0 0 50px rgba(0,229,255,0.70)) drop-shadow(0 0 100px rgba(0,188,212,0.45)) drop-shadow(0 0 160px rgba(0,150,136,0.20))" }} />
        <h1 className="hub-title font-bold tracking-tight leading-tight text-center"
          style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", overflow: "visible", paddingBottom: "6px" }}>
          Network Management Hub
        </h1>
        <div className="hub-divider w-36" />
      </motion.div>

      {/* Portal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl relative z-10">
        {allPortals.map((portal, i) => {
          const savedLink = links[portal.id];
          const isLive = !portal.comingSoon && (portal.href && portal.href !== "#" || savedLink || portal.isSharedTools);

          return (
            <motion.div
              key={portal.id}
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.50, delay: 0.10 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => handlePortalClick(portal)}
              className={`hub-card hub-card-active rounded-2xl flex flex-col relative ${
                isLive ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div className="hub-specular-top" />
              <div className="hub-specular-left" />

              {/* Link pip button for linkable portals */}
              {portal.linkable && (
                <LinkPip portalId={portal.id} onSave={refreshLinks} />
              )}

              {/* Photo */}
              <div className="mx-3 mt-3 rounded-xl overflow-hidden" style={{ width: "calc(100% - 1.5rem)", position: "relative" }}>
                <img
                  src={portal.customImg || PHOTOS[portal.id]}
                  alt={portal.label}
                  loading="lazy"
                  style={{ width: "100%", height: "auto", display: "block", borderRadius: "0.75rem" }}
                />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white/90 leading-snug tracking-tight">{portal.label}</h2>
                  {isLive && <div className="hub-arrow shrink-0 mt-0.5"><ArrowRight className="w-3 h-3" /></div>}
                  {savedLink && !portal.isSharedTools && <ExternalLink className="w-3 h-3 text-yellow-400/60 shrink-0 mt-0.5" />}
                </div>
                <p className="text-xs text-white/42 leading-relaxed">{portal.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {portal.comingSoon ? (
                    <span className="hub-badge-soon">Coming Soon</span>
                  ) : portal.isSharedTools ? (
                    <span className="hub-badge-live">Storage Portal</span>
                  ) : savedLink ? (
                    <span className="hub-badge-live">Linked ↗</span>
                  ) : portal.linkable ? (
                    <span style={{ fontSize: "10px", color: "rgba(255,210,80,0.6)", background: "rgba(255,200,60,0.10)", border: "1px solid rgba(255,200,60,0.25)", borderRadius: "4px", padding: "2px 7px" }}>Add Link →</span>
                  ) : (
                    <>
                      <span className="hub-badge-live">Live</span>
                      {portal.external && <span className="hub-badge-portal5">External</span>}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-16 text-[10px] text-white/15 tracking-[0.28em] uppercase relative z-10"
      >
        Occu-Med Network Management Hub © 2025
      </motion.p>
    </div>
  );
}
