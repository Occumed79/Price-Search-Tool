import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// ── Occu-Med logo (uploaded) ──────────────────────────────────────────────────
const LOGO_URL = "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/2f069a7d6_occu-med-logo.png";

// ── Portal card photos ────────────────────────────────────────────────────────
const PHOTOS: Record<string, string> = {
  "network-search":     "https://media.base44.com/images/public/69dc7fa90871ac017d7a1394/bdca09af9_generated_image.png",
  "network-map":        "https://media.base44.com/images/public/69dc7fa90871ac017d7a1394/88c68d05a_generated_image.png",
  "provider-directory": "https://media.base44.com/images/public/69dc7fa90871ac017d7a1394/16136a6a6_generated_image.png",
  "report-generator":   "https://media.base44.com/images/public/69dc7fa90871ac017d7a1394/042e66b4e_generated_image.png",
  "international-search":"https://media.base44.com/images/public/69dc7fa90871ac017d7a1394/c394a23a8_generated_image.png",
  "pricing-transparency":"https://media.base44.com/images/public/69dc7fa90871ac017d7a1394/7e9610344_generated_image.png",
};

const INTL_URL = "https://international-search.onrender.com";

const portals = [
  {
    id: "network-search",
    label: "Network Search",
    description: "Search posted prices across clinics, urgent care, labs, and more — anywhere in the country.",
    href: "/search",
    external: false,
    active: true,
  },
  {
    id: "network-map",
    label: "Network Map",
    description: "Visualize provider coverage and geographic distribution across all regions.",
    href: "/network-map",
    external: false,
    active: true,
  },
  {
    id: "provider-directory",
    label: "Provider Directory",
    description: "Browse and manage the full network of Occu-Med affiliated providers.",
    href: "#",
    external: false,
    active: false,
  },
  {
    id: "report-generator",
    label: "Report Generator",
    description: "Generate utilization, cost trend, and network performance reports on demand.",
    href: "/report",
    external: false,
    active: true,
  },
  {
    id: "international-search",
    label: "International Search",
    description: "Extend your search globally — find providers and pricing across international networks.",
    href: INTL_URL,
    external: true,
    active: true,
  },
  {
    id: "pricing-transparency",
    label: "Pricing Transparency Database",
    description: "Access and compare self-pay and posted pricing data across the full provider network.",
    href: "#",
    external: false,
    active: false,
  },
];

export default function HubPage() {
  const [, navigate] = useLocation();

  const handlePortalClick = (portal: typeof portals[0]) => {
    if (!portal.active) return;
    if (portal.external) {
      window.open(portal.href, "_blank", "noopener noreferrer");
    } else {
      navigate(portal.href);
    }
  };

  return (
    <div className="hub-bg min-h-screen flex flex-col items-center px-6 py-16 relative overflow-hidden">

      {/* ── Sun rays layer ── */}
      <div className="hub-sunrays" aria-hidden="true">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="hub-ray" />
        ))}
      </div>

      {/* ── Horizon glow band ── */}
      <div className="hub-horizon" aria-hidden="true" />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-6 mb-14 relative z-10"
      >
        {/* Logo pill */}
        <div className="hub-logo-wrap px-8 py-5 rounded-2xl">
          <img
            src={LOGO_URL}
            alt="Occu-Med"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Title */}
        <div className="text-center flex flex-col items-center gap-3">
          <h1 className="hub-title text-6xl md:text-7xl font-bold tracking-tight leading-none">
            Network Management Hub
          </h1>
          <p className="hub-subtitle text-base font-light tracking-[0.20em] uppercase mt-1">
            Occu-Med · Self-Pay Intelligence Platform
          </p>
        </div>

        {/* Divider */}
        <div className="hub-divider w-40 mt-1" />
      </motion.div>

      {/* ── Portal Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl relative z-10">
        {portals.map((portal, i) => (
          <motion.div
            key={portal.id}
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => handlePortalClick(portal)}
            className={`hub-card rounded-2xl flex flex-col gap-0 p-0
              ${portal.active ? "cursor-pointer hub-card-active" : "cursor-not-allowed hub-card-inactive"}`}
          >
            {/* Specular edges */}
            <div className="hub-specular-top" />
            <div className="hub-specular-left" />

            {/* Photo frame */}
            <div className="hub-photo-frame mx-3 mt-3">
              <img
                src={PHOTOS[portal.id]}
                alt={portal.label}
                loading="lazy"
              />
            </div>

            {/* Text content */}
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-white/90 leading-snug tracking-tight">
                  {portal.label}
                </h2>
                {portal.active && (
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300/70 shrink-0 mt-0.5 transition-transform duration-200 group-hover:translate-x-1" />
                )}
              </div>

              <p className="text-xs text-white/45 leading-relaxed">
                {portal.description}
              </p>

              {/* Status row */}
              <div className="flex items-center gap-2 mt-1">
                {portal.active ? (
                  <>
                    <span className="hub-badge-live">Live</span>
                    {portal.external && (
                      <span className="hub-badge-portal5">Portal 5</span>
                    )}
                  </>
                ) : (
                  <span className="hub-badge-soon">Coming Soon</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Footer ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.8 }}
        className="mt-20 text-[11px] text-white/18 tracking-[0.28em] uppercase relative z-10"
      >
        Occu-Med Network Management Hub © 2025
      </motion.p>
    </div>
  );
}
