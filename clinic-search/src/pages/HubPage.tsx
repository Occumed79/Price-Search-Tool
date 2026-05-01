import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const LOGO_URL = "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/9e200f82d_bf25943c4_Logo1.png";

const PHOTOS: Record<string, string> = {
  "network-search":
    "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/1a696dbca_479e6938f_NetworkSearch.png",
  "network-map":
    "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/2a5804fd0_NetworkMap_v2.png",
  "provider-acquisition":
    "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/a32cc0ffa_37fb27498_ProviderDirectory.png",
  "report-generator":
    "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/5c9dc383b_463562641_ReportGenerator.png",
  "international-search":
    "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/90a765b4c_adeeac233_InternationalSearch.png",
  "pricing-transparency":
    "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/db97fd71c_b8ed7b7e6_PricingTransparencyDatabase-1.png",
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
    comingSoon: false,
  },
  {
    id: "network-map",
    label: "Network Map",
    description: "Visualize provider coverage and geographic distribution across all regions.",
    href: "/network-map",
    external: false,
    active: true,
    comingSoon: false,
  },
  {
    id: "provider-acquisition",
    label: "Provider Acquisition",
    description: "Browse and manage the full network of Occu-Med affiliated providers.",
    href: "#",
    external: false,
    active: true,
    comingSoon: true,
  },
  {
    id: "report-generator",
    label: "Report Generator",
    description: "Generate utilization, cost trend, and network performance reports on demand.",
    href: "/report",
    external: false,
    active: true,
    comingSoon: false,
  },
  {
    id: "international-search",
    label: "International Search",
    description: "Extend your search globally — find providers and pricing across international networks.",
    href: INTL_URL,
    external: true,
    active: true,
    comingSoon: false,
  },
  {
    id: "pricing-transparency",
    label: "Pricing Transparency Database",
    description: "Access and compare self-pay and posted pricing data across the full provider network.",
    href: "#",
    external: false,
    active: true,
    comingSoon: true,
  },
];

export default function HubPage() {
  const [, navigate] = useLocation();

  const handlePortalClick = (portal: typeof portals[0]) => {
    if (portal.comingSoon) return;
    if (portal.external) {
      window.open(portal.href, "_blank", "noopener noreferrer");
    } else {
      navigate(portal.href);
    }
  };

  return (
    <div className="hub-bg min-h-screen flex flex-col items-center px-6 py-14 relative overflow-hidden">

      <div className="hub-sunrays" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="hub-ray" />
        ))}
      </div>
      <div className="hub-horizon" aria-hidden="true" />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.70, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-5 mb-12 relative z-10 w-full"
      >
        <img
          src={LOGO_URL}
          alt="Occu-Med"
          style={{ height: "160px", width: "auto", objectFit: "contain", display: "block" }}
        />

        <div className="text-center flex flex-col items-center gap-2" style={{ overflow: "visible" }}>
          <h1
            className="hub-title font-bold tracking-tight leading-tight"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", overflow: "visible", paddingBottom: "6px" }}
          >
            Network Management Hub
          </h1>
          <p className="hub-subtitle text-sm font-light tracking-[0.20em] uppercase">
            Occu-Med · Self-Pay Intelligence Platform
          </p>
        </div>

        <div className="hub-divider w-36" />
      </motion.div>

      {/* ── Portal Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl relative z-10">
        {portals.map((portal, i) => (
          <motion.div
            key={portal.id}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.50, delay: 0.10 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => handlePortalClick(portal)}
            className={`hub-card rounded-2xl flex flex-col hub-card-active ${
              portal.comingSoon ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <div className="hub-specular-top" />
            <div className="hub-specular-left" />

            {/* Photo — NO background, just the image itself filling the frame */}
            <div
              className="mx-3 mt-3 rounded-xl overflow-hidden"
              style={{
                width: "calc(100% - 1.5rem)",
                aspectRatio: "16/9",
                position: "relative",
                background: "transparent",
              }}
            >
              <img
                src={PHOTOS[portal.id]}
                alt={portal.label}
                loading="lazy"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center center",
                  display: "block",
                  borderRadius: "0.75rem",
                }}
              />
            </div>

            {/* Text */}
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-white/90 leading-snug tracking-tight">
                  {portal.label}
                </h2>
                {!portal.comingSoon && (
                  <div className="hub-arrow shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>

              <p className="text-xs text-white/42 leading-relaxed">
                {portal.description}
              </p>

              <div className="flex items-center gap-2 mt-1">
                {portal.comingSoon ? (
                  <span className="hub-badge-soon">Coming Soon</span>
                ) : (
                  <>
                    <span className="hub-badge-live">Live</span>
                    {portal.external && (
                      <span className="hub-badge-portal5">Portal 5</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-16 text-[10px] text-white/15 tracking-[0.28em] uppercase relative z-10"
      >
        Occu-Med Network Management Hub © 2025
      </motion.p>
    </div>
  );
}
