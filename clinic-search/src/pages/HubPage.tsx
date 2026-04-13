import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69db321c6efb66daf94886ba/ad765f27e_omLogo_header.png";

const ICONS: Record<string, string> = {
  "network-search":   "https://media.base44.com/images/public/69db321c6efb66daf94886ba/76eaef212_27eaa482-1634-442a-9c4b-71dd8b7f562d.png",
  "network-map":      "https://media.base44.com/images/public/69db321c6efb66daf94886ba/8cf8e806c_b30f67cd-6434-401b-b1f4-fc3b5a5845ab.png",
  "provider-directory":"https://media.base44.com/images/public/69db321c6efb66daf94886ba/d657dde75_57995dde-592c-444b-8c5e-215a1ac7cff8.png",
  "report-generator": "https://media.base44.com/images/public/69db321c6efb66daf94886ba/3902de502_ChatGPTImageApr12202606_48_32PM.png",
  "international-search":"https://media.base44.com/images/public/69db321c6efb66daf94886ba/3f3aade05_2f676fa8-9f28-4b52-9a2a-c4488f34861b.png",
  "pricing-transparency":"https://media.base44.com/images/public/69db321c6efb66daf94886ba/36be68237_ChatGPTImageApr12202607_42_15PM.png",
};

const portals = [
  {
    id: "network-search",
    label: "Network Search",
    description: "Search posted prices across clinics, urgent care, labs, and more — anywhere in the country.",
    href: "/search",
    active: true,
  },
  {
    id: "network-map",
    label: "Network Map",
    description: "Visualize provider coverage and geographic distribution across all regions.",
    href: "/network-map",
    active: true,
  },
  {
    id: "provider-directory",
    label: "Provider Directory",
    description: "Browse and manage the full network of Occu-Med affiliated providers.",
    href: "#",
    active: false,
  },
  {
    id: "report-generator",
    label: "Report Generator",
    description: "Generate utilization, cost trend, and network performance reports on demand.",
    href: "#",
    active: false,
  },
  {
    id: "international-search",
    label: "International Search",
    description: "Extend your search globally — find providers and pricing across international networks.",
    href: "#",
    active: false,
  },
  {
    id: "pricing-transparency",
    label: "Pricing Transparency Database",
    description: "Access and compare self-pay and posted pricing data across the full provider network.",
    href: "#",
    active: false,
  },
];

export default function HubPage() {
  const [, navigate] = useLocation();

  return (
    <div className="hub-bg min-h-screen flex flex-col items-center px-6 py-16 relative overflow-hidden">

      {/* ── Deep ambient light orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top crown glow — very bright */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-sky-300/30 blur-[100px]" />
        {/* Mid-left soft violet */}
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        {/* Mid-right cyan */}
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-cyan-400/18 blur-[120px]" />
        {/* Bottom center glow */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-indigo-500/18 blur-[100px]" />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}} />
      </div>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        className="flex flex-col items-center gap-6 mb-16 relative z-10"
      >
        {/* Logo pill */}
        <div className="hub-logo-wrap px-6 py-4 rounded-2xl">
          <img
            src={LOGO_URL}
            alt="Occu-Med"
            className="h-14 w-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* Titles */}
        <div className="text-center flex flex-col items-center gap-2">
          <h1 className="hub-title text-6xl font-bold tracking-tight leading-none">
            Occu-Med
          </h1>
          <p className="hub-subtitle text-xl font-light tracking-[0.22em] uppercase">
            Network Search Hub
          </p>
        </div>

        {/* Glowing divider */}
        <div className="hub-divider w-32 mt-1" />
      </motion.div>

      {/* ── Portal Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
        {portals.map((portal, i) => (
          <motion.div
            key={portal.id}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 + i * 0.08, ease: [0.22,1,0.36,1] }}
            onClick={() => portal.active && navigate(portal.href)}
            className={`hub-card group relative rounded-2xl flex flex-col items-center text-center gap-4 p-7
              transition-all duration-300
              ${portal.active
                ? "cursor-pointer hub-card-active"
                : "cursor-not-allowed hub-card-inactive"}`}
          >
            {/* Large icon */}
            <div className="relative hub-icon-wrap">
              <img
                src={ICONS[portal.id]}
                alt={portal.label}
                className={`w-24 h-24 object-contain transition-transform duration-300 drop-shadow-2xl
                  ${portal.active ? "group-hover:scale-110" : "grayscale opacity-50"}`}
              />
              {/* Icon glow bloom */}
              {portal.active && (
                <div className="absolute inset-0 rounded-full bg-sky-400/20 blur-2xl scale-125 -z-10 group-hover:bg-sky-400/35 transition-all duration-300" />
              )}
            </div>

            {/* Label */}
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold text-white/92 leading-snug tracking-tight">
                {portal.label}
              </h2>
              <p className="text-sm text-white/45 leading-relaxed">
                {portal.description}
              </p>
            </div>

            {/* Footer row */}
            <div className="mt-auto pt-2 w-full flex items-center justify-between">
              {portal.active ? (
                <>
                  <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300">
                    Live
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-sky-300 transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </>
              ) : (
                <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30">
                  Coming Soon
                </span>
              )}
            </div>

            {/* Top specular highlight */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Left edge specular */}
            <div className="absolute inset-y-0 left-0 w-px rounded-l-2xl bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
          </motion.div>
        ))}
      </div>

      {/* ── Footer ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.7 }}
        className="mt-20 text-[11px] text-white/20 tracking-[0.25em] uppercase relative z-10"
      >
        Occu-Med Network Search Hub © 2025
      </motion.p>
    </div>
  );
}
