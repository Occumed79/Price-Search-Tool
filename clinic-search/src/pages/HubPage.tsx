import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Search, Globe, BarChart2, FileText, Users, Settings2, ArrowRight
} from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69db321c6efb66daf94886ba/ad765f27e_omLogo_header.png";

const portals = [
  {
    id: "web-price-search",
    label: "Web Price Search",
    description: "Search posted prices across clinics, urgent care, labs, and more in any location.",
    icon: Search,
    color: "from-sky-400/30 to-cyan-300/20",
    border: "border-sky-400/30",
    glow: "shadow-sky-400/20",
    iconColor: "text-sky-300",
    href: "/search",
    active: true,
  },
  {
    id: "provider-directory",
    label: "Provider Directory",
    description: "Browse and manage the full network of Occu-Med affiliated providers.",
    icon: Users,
    color: "from-violet-400/25 to-purple-300/15",
    border: "border-violet-400/25",
    glow: "shadow-violet-400/15",
    iconColor: "text-violet-300",
    href: "#",
    active: false,
  },
  {
    id: "analytics",
    label: "Analytics & Reporting",
    description: "Track utilization, cost trends, and network performance metrics.",
    icon: BarChart2,
    color: "from-emerald-400/25 to-teal-300/15",
    border: "border-emerald-400/25",
    glow: "shadow-emerald-400/15",
    iconColor: "text-emerald-300",
    href: "#",
    active: false,
  },
  {
    id: "documents",
    label: "Document Center",
    description: "Access contracts, compliance forms, and clinical documentation.",
    icon: FileText,
    color: "from-amber-400/25 to-yellow-300/15",
    border: "border-amber-400/25",
    glow: "shadow-amber-400/15",
    iconColor: "text-amber-300",
    href: "#",
    active: false,
  },
  {
    id: "network-map",
    label: "Network Map",
    description: "Visualize provider coverage and geographic distribution across regions.",
    icon: Globe,
    color: "from-rose-400/25 to-pink-300/15",
    border: "border-rose-400/25",
    glow: "shadow-rose-400/15",
    iconColor: "text-rose-300",
    href: "#",
    active: false,
  },
  {
    id: "admin",
    label: "Administration",
    description: "Manage users, permissions, integrations, and system settings.",
    icon: Settings2,
    color: "from-slate-400/20 to-gray-300/10",
    border: "border-slate-400/20",
    glow: "shadow-slate-400/10",
    iconColor: "text-slate-300",
    href: "#",
    active: false,
  },
];

export default function HubPage() {
  const [, navigate] = useLocation();

  return (
    <div className="hub-bg min-h-screen flex flex-col items-center px-6 py-16 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-sky-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-400/8 blur-[100px]" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-5 mb-16 relative z-10"
      >
        <div className="hub-logo-wrap p-4 rounded-2xl">
          <img
            src={LOGO_URL}
            alt="Occu-Med"
            className="h-14 w-auto object-contain drop-shadow-lg"
          />
        </div>

        <div className="text-center">
          <h1 className="hub-title text-5xl font-bold tracking-tight leading-none mb-2">
            Occu-Med
          </h1>
          <p className="hub-subtitle text-xl font-light tracking-[0.18em] uppercase">
            Network Search Hub
          </p>
        </div>

        <div className="hub-divider w-24 h-px mt-1" />
      </motion.div>

      {/* Portal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl relative z-10">
        {portals.map((portal, i) => {
          const Icon = portal.icon;
          return (
            <motion.div
              key={portal.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: "easeOut" }}
              onClick={() => portal.active && navigate(portal.href)}
              className={`
                group relative rounded-2xl border ${portal.border}
                bg-gradient-to-br ${portal.color}
                hub-card
                shadow-lg ${portal.glow}
                transition-all duration-300
                ${portal.active
                  ? "cursor-pointer hover:scale-[1.025] hover:shadow-xl hover:border-white/30"
                  : "cursor-not-allowed opacity-60"}
              `}
            >
              <div className="p-6 flex flex-col gap-4 h-full">
                {/* Icon + coming soon badge */}
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center ${portal.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!portal.active && (
                    <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/40">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1.5 flex-1">
                  <h2 className="text-base font-semibold text-white/90 leading-snug">
                    {portal.label}
                  </h2>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                {/* Arrow for active */}
                {portal.active && (
                  <div className="flex justify-end">
                    <div className={`w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center ${portal.iconColor} transition-transform duration-200 group-hover:translate-x-1`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>

              {/* Inner top highlight */}
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="mt-16 text-xs text-white/25 tracking-widest uppercase relative z-10"
      >
        Occu-Med Network Search Hub © 2025
      </motion.p>
    </div>
  );
}
