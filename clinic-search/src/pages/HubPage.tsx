import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69db321c6efb66daf94886ba/ad765f27e_omLogo_header.png";

const ICONS: Record<string, string> = {
  "network-search":      "https://media.base44.com/images/public/69db321c6efb66daf94886ba/76eaef212_27eaa482-1634-442a-9c4b-71dd8b7f562d.png",
  "network-map":         "https://media.base44.com/images/public/69db321c6efb66daf94886ba/8cf8e806c_b30f67cd-6434-401b-b1f4-fc3b5a5845ab.png",
  "provider-directory":  "https://media.base44.com/images/public/69db321c6efb66daf94886ba/d657dde75_57995dde-592c-444b-8c5e-215a1ac7cff8.png",
  "report-generator":    "https://media.base44.com/images/public/69db321c6efb66daf94886ba/3902de502_ChatGPTImageApr12202606_48_32PM.png",
  "international-search":"https://media.base44.com/images/public/69db321c6efb66daf94886ba/3f3aade05_2f676fa8-9f28-4b52-9a2a-c4488f34861b.png",
  "pricing-transparency":"https://media.base44.com/images/public/69db321c6efb66daf94886ba/36be68237_ChatGPTImageApr12202607_42_15PM.png",
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
    <div className="min-h-screen w-full bg-[#04091a] relative overflow-hidden flex flex-col items-center justify-center px-6 py-16">

      {/* ── Animated glowing orb background ── */}
      <style>{`
        @keyframes hub-orb1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(60px, 80px) scale(1.12); }
          50%  { transform: translate(20px, 150px) scale(0.92); }
          75%  { transform: translate(-40px, 60px) scale(1.06); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes hub-orb2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(-80px, -60px) scale(1.15); }
          50%  { transform: translate(-30px, -120px) scale(0.88); }
          75%  { transform: translate(50px, -50px) scale(1.08); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes hub-orb3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(100px, -80px) scale(1.2); }
          66%  { transform: translate(-60px, 60px) scale(0.85); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes hub-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(1.18); }
        }
        @keyframes hub-crown {
          0%, 100% { opacity: 0.40; transform: scaleX(1); }
          50%       { opacity: 0.60; transform: scaleX(1.08); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Crown beam — top center */}
        <div style={{
          position:"absolute", top:"-8%", left:"50%",
          transform:"translateX(-50%)",
          width:"900px", height:"500px",
          borderRadius:"50%",
          background:"radial-gradient(ellipse at center, rgba(147,210,255,0.45) 0%, rgba(96,165,250,0.20) 40%, transparent 70%)",
          filter:"blur(50px)",
          animation:"hub-crown 12s ease-in-out infinite",
        }} />
        {/* Left drift orb */}
        <div style={{
          position:"absolute", top:"20%", left:"-8%",
          width:"580px", height:"580px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(56,189,248,0.55) 0%, rgba(56,189,248,0.25) 35%, transparent 70%)",
          filter:"blur(38px)",
          animation:"hub-orb1 22s ease-in-out infinite",
        }} />
        {/* Right drift orb */}
        <div style={{
          position:"absolute", bottom:"-10%", right:"-6%",
          width:"650px", height:"650px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(99,102,241,0.45) 0%, rgba(56,189,248,0.25) 40%, transparent 70%)",
          filter:"blur(42px)",
          animation:"hub-orb2 27s ease-in-out infinite",
          animationDelay:"-11s",
        }} />
        {/* Center accent */}
        <div style={{
          position:"absolute", top:"35%", left:"38%",
          width:"420px", height:"420px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(0,200,230,0.40) 0%, rgba(56,189,248,0.18) 40%, transparent 70%)",
          filter:"blur(34px)",
          animation:"hub-orb3 17s ease-in-out infinite",
          animationDelay:"-6s",
        }} />
        {/* Top-right sparkle */}
        <div style={{
          position:"absolute", top:"5%", right:"8%",
          width:"260px", height:"260px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(147,210,255,0.70) 0%, rgba(56,189,248,0.35) 40%, transparent 70%)",
          filter:"blur(22px)",
          animation:"hub-pulse 8s ease-in-out infinite",
          animationDelay:"-3s",
        }} />
        {/* Bottom left fill */}
        <div style={{
          position:"absolute", bottom:"8%", left:"6%",
          width:"340px", height:"340px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(59,130,246,0.50) 0%, rgba(96,165,250,0.22) 40%, transparent 70%)",
          filter:"blur(30px)",
          animation:"hub-pulse 14s ease-in-out infinite",
          animationDelay:"-7s",
        }} />
        {/* Noise grain overlay */}
        <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}} />
      </div>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4 mb-16 relative z-10"
      >
        {/* Logo pill — glass style matching Insight Hub */}
        <div className="inline-flex items-center justify-center mb-2 px-8 py-4 rounded-2xl"
          style={{
            background:"linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 100%)",
            backdropFilter:"blur(32px) saturate(200%)",
            WebkitBackdropFilter:"blur(32px) saturate(200%)",
            border:"1px solid rgba(255,255,255,0.20)",
            boxShadow:"0 0 0 1px rgba(255,255,255,0.05) inset, 0 12px 40px rgba(0,0,0,0.40), 0 0 80px rgba(147,210,255,0.18)",
          }}
        >
          <img src={LOGO_URL} alt="Occu-Med" className="h-14 w-auto object-contain" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none text-center"
          style={{
            background:"linear-gradient(135deg, #ffffff 0%, #93c5fd 40%, #e0f2fe 100%)",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            backgroundClip:"text",
            filter:"drop-shadow(0 0 32px rgba(147,210,255,0.65)) drop-shadow(0 0 8px rgba(255,255,255,0.35))",
          }}
        >
          Network Search <span style={{
            background:"linear-gradient(135deg, #38bdf8 0%, #93c5fd 60%, #bae6fd 100%)",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            backgroundClip:"text",
          }}>Hub</span>
        </h1>
        <p className="text-lg md:text-xl text-sky-200/60 max-w-2xl mx-auto font-light leading-relaxed text-center tracking-wide">
          The network intelligence platform for Occu-Med — searching prices, mapping providers, and generating insights across every region.
        </p>
        {/* Divider */}
        <div style={{
          width:"128px", height:"1px",
          background:"linear-gradient(90deg, transparent, rgba(147,210,255,0.6), transparent)",
          marginTop:"4px",
        }} />
      </motion.div>

      {/* ── Portal Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
        {portals.map((portal, i) => (
          <motion.div
            key={portal.id}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => handlePortalClick(portal)}
            className="group relative rounded-2xl flex flex-col items-center text-center gap-5 p-8 transition-all duration-300"
            style={{
              background: portal.active
                ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(56,189,248,0.06) 50%, rgba(255,255,255,0.04) 100%)"
                : "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: portal.active
                ? "1px solid rgba(147,210,255,0.20)"
                : "1px solid rgba(255,255,255,0.07)",
              boxShadow: portal.active
                ? "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10), 0 0 40px rgba(56,189,248,0.06)"
                : "0 4px 16px rgba(0,0,0,0.25)",
              cursor: portal.active ? "pointer" : "not-allowed",
            }}
            onMouseEnter={e => {
              if (!portal.active) return;
              (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14), 0 0 60px rgba(56,189,248,0.14)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(147,210,255,0.35)";
            }}
            onMouseLeave={e => {
              if (!portal.active) return;
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10), 0 0 40px rgba(56,189,248,0.06)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(147,210,255,0.20)";
            }}
          >
            {/* Icon */}
            <div className="relative">
              <img
                src={ICONS[portal.id]}
                alt={portal.label}
                className={`w-64 h-64 object-contain transition-transform duration-300 drop-shadow-2xl
                  ${portal.active ? "group-hover:scale-110" : "grayscale opacity-40"}`}
              />
              {portal.active && (
                <div className="absolute inset-0 rounded-full blur-2xl scale-125 -z-10 transition-all duration-300"
                  style={{ background: "rgba(56,189,248,0.18)" }} />
              )}
            </div>

            {/* Label */}
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold text-white/90 leading-snug tracking-tight">
                {portal.label}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(186,230,253,0.50)" }}>
                {portal.description}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-2 w-full flex items-center justify-between">
              {portal.active ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                      style={{ background:"rgba(56,189,248,0.15)", border:"1px solid rgba(56,189,248,0.30)", color:"rgb(125,211,252)" }}>
                      Live
                    </span>
                    {portal.external && (
                      <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                        style={{ background:"rgba(168,85,247,0.15)", border:"1px solid rgba(168,85,247,0.30)", color:"rgb(216,180,254)" }}>
                        External
                      </span>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1"
                    style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"rgb(125,211,252)" }}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </>
              ) : (
                <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.10)", color:"rgba(255,255,255,0.30)" }}>
                  Coming Soon
                </span>
              )}
            </div>

            {/* Specular edge highlights */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{ background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)" }} />
            <div className="absolute inset-y-0 left-0 w-px rounded-l-2xl"
              style={{ background:"linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04), transparent)" }} />
          </motion.div>
        ))}
      </div>

      {/* ── Footer ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.7 }}
        className="mt-20 text-[11px] tracking-[0.25em] uppercase relative z-10"
        style={{ color: "rgba(255,255,255,0.20)" }}
      >
        Occu-Med Network Search Hub © 2025
      </motion.p>
    </div>
  );
}
