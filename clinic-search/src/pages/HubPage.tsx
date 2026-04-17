import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69db321c6efb66daf94886ba/ad765f27e_omLogo_header.png";

const CARD_IMAGES: Record<string, string> = {
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
    <div
      className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "linear-gradient(170deg, #0c0628 0%, #080320 45%, #050118 100%)" }}
    >

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes hub-orb1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(90px, 110px) scale(1.18); }
          50%  { transform: translate(35px, 210px) scale(0.88); }
          75%  { transform: translate(-70px, 90px) scale(1.12); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes hub-orb2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(-110px, -90px) scale(1.22); }
          50%  { transform: translate(-50px, -170px) scale(0.84); }
          75%  { transform: translate(80px, -70px) scale(1.14); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes hub-orb3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(140px, -110px) scale(1.28); }
          66%  { transform: translate(-90px, 90px) scale(0.80); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes hub-pulse {
          0%, 100% { opacity: 0.70; transform: scale(1); }
          50%       { opacity: 1.00; transform: scale(1.28); }
        }
        @keyframes hub-crown {
          0%, 100% { opacity: 0.65; transform: scaleX(1); }
          50%       { opacity: 0.90; transform: scaleX(1.15); }
        }
      `}</style>

      {/* ── Animated orb layer ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Crown beam — powerful violet-to-cyan */}
        <div style={{
          position: "absolute", top: "-12%", left: "50%",
          transform: "translateX(-50%)",
          width: "1200px", height: "650px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.65) 0%, rgba(109,40,217,0.38) 28%, rgba(56,189,248,0.18) 52%, transparent 70%)",
          filter: "blur(58px)",
          animation: "hub-crown 10s ease-in-out infinite",
        }} />

        {/* Left — deep violet */}
        <div style={{
          position: "absolute", top: "12%", left: "-12%",
          width: "780px", height: "780px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(139,92,246,0.72) 0%, rgba(109,40,217,0.40) 35%, transparent 70%)",
          filter: "blur(44px)",
          animation: "hub-orb1 19s ease-in-out infinite",
        }} />

        {/* Right bottom — indigo-purple */}
        <div style={{
          position: "absolute", bottom: "-14%", right: "-10%",
          width: "820px", height: "820px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(99,102,241,0.68) 0%, rgba(139,92,246,0.35) 38%, transparent 70%)",
          filter: "blur(50px)",
          animation: "hub-orb2 24s ease-in-out infinite",
          animationDelay: "-13s",
        }} />

        {/* Center soft violet bloom */}
        <div style={{
          position: "absolute", top: "38%", left: "33%",
          width: "560px", height: "560px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(167,139,250,0.55) 0%, rgba(139,92,246,0.28) 42%, transparent 70%)",
          filter: "blur(40px)",
          animation: "hub-orb3 14s ease-in-out infinite",
          animationDelay: "-5s",
        }} />

        {/* Top-right — cyan accent spark */}
        <div style={{
          position: "absolute", top: "2%", right: "5%",
          width: "340px", height: "340px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(56,189,248,0.85) 0%, rgba(14,165,233,0.50) 40%, transparent 70%)",
          filter: "blur(26px)",
          animation: "hub-pulse 6s ease-in-out infinite",
          animationDelay: "-2s",
        }} />

        {/* Bottom-left — rich purple fill */}
        <div style={{
          position: "absolute", bottom: "4%", left: "2%",
          width: "460px", height: "460px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(124,58,237,0.68) 0%, rgba(139,92,246,0.30) 42%, transparent 70%)",
          filter: "blur(38px)",
          animation: "hub-pulse 11s ease-in-out infinite",
          animationDelay: "-6s",
        }} />

        {/* Bottom-center bridge orb */}
        <div style={{
          position: "absolute", bottom: "-6%", left: "28%",
          width: "600px", height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(109,40,217,0.60) 0%, rgba(99,102,241,0.30) 45%, transparent 72%)",
          filter: "blur(48px)",
          animation: "hub-orb1 17s ease-in-out infinite",
          animationDelay: "-8s",
        }} />

        {/* Mid-right — secondary cyan */}
        <div style={{
          position: "absolute", top: "45%", right: "-5%",
          width: "380px", height: "380px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(56,189,248,0.55) 0%, rgba(14,165,233,0.22) 48%, transparent 74%)",
          filter: "blur(34px)",
          animation: "hub-orb3 21s ease-in-out infinite",
          animationDelay: "-10s",
        }} />

        {/* Noise grain overlay */}
        <div className="absolute inset-0 opacity-[0.028]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4 mb-16 relative z-10"
      >
        {/* Logo pill */}
        <div
          className="inline-flex items-center justify-center mb-2 px-8 py-4 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(139,92,246,0.08) 100%)",
            backdropFilter: "blur(32px) saturate(200%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset, 0 12px 40px rgba(0,0,0,0.45), 0 0 80px rgba(139,92,246,0.28)",
          }}
        >
          <img src={LOGO_URL} alt="Occu-Med" className="h-14 w-auto object-contain" />
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold tracking-tight leading-none text-center"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 38%, #e0f2fe 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 36px rgba(139,92,246,0.75)) drop-shadow(0 0 10px rgba(255,255,255,0.35))",
          }}
        >
          Network Search{" "}
          <span style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #a78bfa 55%, #c4b5fd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Hub
          </span>
        </h1>

        <p
          className="text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed text-center tracking-wide"
          style={{ color: "rgba(196,181,253,0.62)" }}
        >
          The network intelligence platform for Occu-Med — searching prices, mapping providers, and generating insights across every region.
        </p>

        <div style={{
          width: "140px", height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.75), rgba(56,189,248,0.50), transparent)",
          marginTop: "4px",
        }} />
      </motion.div>

      {/* ── Portal Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl relative z-10">
        {portals.map((portal, i) => (
          <motion.div
            key={portal.id}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => handlePortalClick(portal)}
            className="group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
            style={{
              background: portal.active
                ? "linear-gradient(170deg, rgba(139,92,246,0.14) 0%, rgba(22,14,50,0.88) 35%, rgba(12,7,28,0.92) 100%)"
                : "rgba(12,7,28,0.65)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: portal.active
                ? "1px solid rgba(139,92,246,0.28)"
                : "1px solid rgba(255,255,255,0.07)",
              boxShadow: portal.active
                ? "0 4px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10), 0 0 48px rgba(139,92,246,0.10)"
                : "0 4px 16px rgba(0,0,0,0.40)",
              cursor: portal.active ? "pointer" : "not-allowed",
            }}
            onMouseEnter={e => {
              if (!portal.active) return;
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-5px)";
              el.style.boxShadow = "0 20px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 70px rgba(139,92,246,0.25), 0 0 140px rgba(99,102,241,0.12)";
              el.style.borderColor = "rgba(167,139,250,0.48)";
            }}
            onMouseLeave={e => {
              if (!portal.active) return;
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "";
              el.style.boxShadow = "0 4px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10), 0 0 48px rgba(139,92,246,0.10)";
              el.style.borderColor = "rgba(139,92,246,0.28)";
            }}
          >
            {/* ── Photo banner (top ~45% of card) ── */}
            <div className="relative w-full overflow-hidden flex-shrink-0" style={{ height: "168px" }}>

              {/* Indicator dot — top-left, Insight Hub style */}
              <div
                className="absolute top-3 left-3 z-20 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(20,12,44,0.80)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${portal.active ? "rgba(167,139,250,0.45)" : "rgba(255,255,255,0.12)"}`,
                  boxShadow: portal.active ? "0 0 14px rgba(139,92,246,0.40)" : "none",
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: portal.active
                      ? "radial-gradient(circle, rgba(167,139,250,1) 0%, rgba(139,92,246,0.7) 100%)"
                      : "rgba(100,100,120,0.45)",
                    boxShadow: portal.active ? "0 0 8px rgba(139,92,246,0.80)" : "none",
                  }}
                />
              </div>

              <img
                src={CARD_IMAGES[portal.id]}
                alt={portal.label}
                className={`w-full h-full object-cover object-center transition-transform duration-700 ${
                  portal.active ? "group-hover:scale-105" : "grayscale opacity-35"
                }`}
              />

              {/* Gradient fade from image into card body */}
              <div
                className="absolute inset-x-0 bottom-0 h-20"
                style={{ background: "linear-gradient(to top, rgba(14,8,32,0.96) 0%, rgba(14,8,32,0.40) 60%, transparent 100%)" }}
              />

              {/* Top-edge vignette */}
              <div
                className="absolute inset-x-0 top-0 h-10"
                style={{ background: "linear-gradient(to bottom, rgba(14,8,32,0.45), transparent)" }}
              />

              {/* Hover tint overlay */}
              {portal.active && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(56,189,248,0.04) 100%)" }}
                />
              )}
            </div>

            {/* ── Text content below image ── */}
            <div className="flex flex-col gap-2 px-5 pt-3 pb-5 flex-1">

              {/* Top specular highlight on card body */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)" }}
              />

              <h2
                className="text-[15px] font-semibold leading-snug tracking-tight"
                style={{ color: portal.active ? "rgba(255,255,255,0.93)" : "rgba(255,255,255,0.35)" }}
              >
                {portal.label}
              </h2>

              <p
                className="text-[13px] leading-relaxed flex-1"
                style={{ color: portal.active ? "rgba(196,181,253,0.58)" : "rgba(255,255,255,0.22)" }}
              >
                {portal.description}
              </p>

              {/* Footer row */}
              <div className="flex items-center justify-between pt-2 mt-auto">
                {portal.active ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(139,92,246,0.18)",
                          border: "1px solid rgba(139,92,246,0.38)",
                          color: "rgb(196,181,253)",
                        }}
                      >
                        Live
                      </span>
                      {portal.external && (
                        <span
                          className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(56,189,248,0.14)",
                            border: "1px solid rgba(56,189,248,0.30)",
                            color: "rgb(125,211,252)",
                          }}
                        >
                          External
                        </span>
                      )}
                    </div>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1"
                      style={{
                        background: "rgba(139,92,246,0.16)",
                        border: "1px solid rgba(167,139,250,0.32)",
                        color: "rgb(167,139,250)",
                      }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </>
                ) : (
                  <span
                    className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "rgba(255,255,255,0.28)",
                    }}
                  >
                    Coming Soon
                  </span>
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
        transition={{ delay: 1.2, duration: 0.7 }}
        className="mt-20 text-[11px] tracking-[0.25em] uppercase relative z-10"
        style={{ color: "rgba(255,255,255,0.18)" }}
      >
        Occu-Med Network Search Hub © 2025
      </motion.p>
    </div>
  );
}
