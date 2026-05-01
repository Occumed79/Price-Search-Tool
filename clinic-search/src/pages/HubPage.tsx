import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69dcaa5f2cdb34ef76b60740/307ed9399_Logocopy.png";

const PHOTOS: Record<string, string> = {
  // compass/navigation dashboard
  "network-search":
    "https://media.base44.com/images/public/69dcaa5f2cdb34ef76b60740/4c56e7c63_725370ea-8900-4051-a09b-baf05e5d806b.png",
  // VR person holding globe
  "network-map":
    "https://media.base44.com/images/public/69dcaa5f2cdb34ef76b60740/cd3786710_2af8b45c-7f6e-4598-a2bd-564566d4892f.png",
  // puzzle pieces / partnership
  "provider-acquisition":
    "https://media.base44.com/images/public/69dcaa5f2cdb34ef76b60740/3c37bc98d_ebb08cf5-f915-465a-9abe-6a5fd91d249b.png",
  // lightbulb knowledge hub
  "report-generator":
    "https://media.base44.com/images/public/69dcaa5f2cdb34ef76b60740/02588225c_783f5460-1289-4bbd-a0ac-a9316906a45e.png",
  // AI globe + chip
  "international-search":
    "https://media.base44.com/images/public/69dcaa5f2cdb34ef76b60740/e2e3572a9_5ad3d8f9-d805-4fc2-8cb7-a8614edc9c0fcopy.png",
  // lightbulb (reuse for coming soon)
  "pricing-transparency":
    "https://media.base44.com/images/public/69dcaa5f2cdb34ef76b60740/02588225c_783f5460-1289-4bbd-a0ac-a9316906a45e.png",
  // AI brain circuit — intelligence/insight
  "insight-hub":
    "https://media.base44.com/images/public/69dcaa5f2cdb34ef76b60740/0217324d6_e6551bb4-354c-4267-bcc8-3a654f7d911a.png",
};

const INTL_URL = "https://international-search.onrender.com";
const INSIGHT_HUB_URL = "https://insight-hub-eyza.onrender.com";

const portals = [
  {
    id: "network-search",
    label: "Network Search",
    description: "Search posted prices across clinics, urgent care, labs, and more — anywhere in the country.",
    href: "/search",
    external: false,
    comingSoon: false,
    badge: "",
  },
  {
    id: "network-map",
    label: "Network Map",
    description: "Visualize provider coverage and geographic distribution across all regions.",
    href: "/network-map",
    external: false,
    comingSoon: false,
    badge: "",
  },
  {
    id: "provider-acquisition",
    label: "Provider Acquisition",
    description: "Browse and manage the full network of Occu-Med affiliated providers.",
    href: "#",
    external: false,
    comingSoon: true,
    badge: "",
  },
  {
    id: "report-generator",
    label: "Report Generator",
    description: "Generate utilization, cost trend, and network performance reports on demand.",
    href: "/report",
    external: false,
    comingSoon: false,
    badge: "",
  },
  {
    id: "international-search",
    label: "International Search",
    description: "Extend your search globally — find providers and pricing across international networks.",
    href: INTL_URL,
    external: true,
    comingSoon: false,
    badge: "portal5",
  },
  {
    id: "pricing-transparency",
    label: "Pricing Transparency Database",
    description: "Access and compare self-pay and posted pricing data across the full provider network.",
    href: "#",
    external: false,
    comingSoon: true,
    badge: "",
  },
  {
    id: "insight-hub",
    label: "Insight Hub",
    description: "The strategic intelligence command center for Occu-Med — surfacing contracting opportunities, tracking client relationships, and mapping the competitive landscape.",
    href: INSIGHT_HUB_URL,
    external: true,
    comingSoon: false,
    badge: "portal6",
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
        className="flex flex-col items-center gap-4 mb-12 relative z-10 w-full"
      >
        <img
          src={LOGO_URL}
          alt="Occu-Med"
          style={{ height: "260px", width: "auto", objectFit: "contain", display: "block" }}
        />

        <h1
          className="hub-title font-bold tracking-tight leading-tight text-center"
          style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", overflow: "visible", paddingBottom: "6px" }}
        >
          Network Management Hub
        </h1>

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
            className={`hub-card hub-card-active rounded-2xl flex flex-col ${
              portal.comingSoon ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <div className="hub-specular-top" />
            <div className="hub-specular-left" />

            {/* Photo frame */}
            <div
              className="mx-3 mt-3 rounded-xl overflow-hidden"
              style={{ width: "calc(100% - 1.5rem)", position: "relative" }}
            >
              <img
                src={PHOTOS[portal.id]}
                alt={portal.label}
                loading="lazy"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "0.75rem" }}
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
                    {portal.badge === "portal5" && (
                      <span className="hub-badge-portal5">Portal 5</span>
                    )}
                    {portal.badge === "portal6" && (
                      <span
                        className="hub-badge-portal5"
                        style={{
                          background: "rgba(120,80,255,0.18)",
                          color: "#c084fc",
                          borderColor: "rgba(192,132,252,0.35)",
                        }}
                      >
                        Portal 6
                      </span>
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
