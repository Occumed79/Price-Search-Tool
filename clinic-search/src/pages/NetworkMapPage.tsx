import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Maximize2, ExternalLink } from "lucide-react";
import { useState } from "react";

const MAP_URL = "https://network-map-tool.onrender.com";

export default function NetworkMapPage() {
  const [, navigate] = useLocation();
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Sub-toolbar */}
      {!fullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-sidebar border-b border-white/[0.06] flex items-center justify-between px-4 h-11 shrink-0"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all text-xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Hub
            </button>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-xs font-semibold text-white/70 tracking-tight">Network Map</span>
            <span className="text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full ml-1">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-white/35 hover:text-white/60 hover:bg-white/[0.05] transition-all text-xs"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-white/35 hover:text-white/60 hover:bg-white/[0.05] transition-all text-xs"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Fullscreen exit bar */}
      {fullscreen && (
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-10 bg-black/60 backdrop-blur-sm">
          <span className="text-xs text-white/50 font-medium">Network Map — Fullscreen</span>
          <button
            onClick={() => setFullscreen(false)}
            className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1"
          >
            Exit Fullscreen
          </button>
        </div>
      )}

      {/* iFrame */}
      <div className={`flex-1 relative ${fullscreen ? "fixed inset-0 z-40" : ""}`}>
        <iframe
          src={MAP_URL}
          title="Occu-Med Network Map"
          className="w-full h-full border-0"
          allow="geolocation; fullscreen"
          loading="eager"
        />
      </div>
    </div>
  );
}
