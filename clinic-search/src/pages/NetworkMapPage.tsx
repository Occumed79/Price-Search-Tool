import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Maximize2, ExternalLink } from "lucide-react";
import { useState } from "react";

const MAP_URL = "https://network-map-tool.onrender.com";

export default function NetworkMapPage() {
  const [, navigate] = useLocation();
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#0a0a0f" }}>
      {/* Sub-toolbar */}
      {!fullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            height: "44px",
            flexShrink: 0,
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "4px 8px", borderRadius: "8px", border: "none",
                background: "transparent", color: "rgba(255,255,255,0.4)",
                cursor: "pointer", fontSize: "12px", fontWeight: 500,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} />
              Hub
            </button>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Network Map</span>
            <span style={{
              fontSize: "10px", fontWeight: 500,
              background: "rgba(16,185,129,0.15)", color: "#34d399",
              border: "1px solid rgba(16,185,129,0.2)",
              padding: "2px 6px", borderRadius: "9999px", marginLeft: 4,
            }}>LIVE</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", padding: "4px 8px",
                borderRadius: "8px", color: "rgba(255,255,255,0.35)",
                textDecoration: "none",
              }}
              title="Open in new tab"
            >
              <ExternalLink style={{ width: 14, height: 14 }} />
            </a>
            <button
              onClick={() => setFullscreen(true)}
              style={{
                display: "flex", alignItems: "center", padding: "4px 8px",
                borderRadius: "8px", border: "none", background: "transparent",
                color: "rgba(255,255,255,0.35)", cursor: "pointer",
              }}
              title="Fullscreen"
            >
              <Maximize2 style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Fullscreen exit bar */}
      {fullscreen && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 40,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            Network Map — Fullscreen
          </span>
          <button
            onClick={() => setFullscreen(false)}
            style={{
              fontSize: 12, color: "rgba(255,255,255,0.5)", border: "none",
              background: "transparent", cursor: "pointer", padding: "4px 8px",
            }}
          >
            Exit Fullscreen
          </button>
        </div>
      )}

      {/* iFrame — fills all remaining space */}
      <iframe
        src={MAP_URL}
        title="Occu-Med Network Map"
        style={{ flex: 1, border: "none", width: "100%", display: "block" }}
        allow="geolocation; fullscreen"
        loading="eager"
      />
    </div>
  );
}
