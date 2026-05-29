import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Maximize2, ExternalLink, Minimize2 } from "lucide-react";
import { useState } from "react";

const MAP_URL = "https://network-map-tool.onrender.com";

export default function NetworkMapPage() {
  const [, navigate] = useLocation();
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg,#020d12 0%,#041820 20%,#052018 50%,#030f18 100%)",
    }}>

      {/* ── Floating orb background ─────────────────────────────────────── */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-8%", left:"-5%", width:"700px", height:"700px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(0,229,255,0.40) 0%, rgba(0,188,212,0.18) 38%, transparent 68%)",
          filter:"blur(70px)", animation:"portal-orb1 24s ease-in-out infinite" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:"750px", height:"750px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(0,150,136,0.38) 0%, rgba(38,166,154,0.18) 42%, transparent 70%)",
          filter:"blur(75px)", animation:"portal-orb2 30s ease-in-out infinite", animationDelay:"-14s" }} />
        <div style={{ position:"absolute", top:"30%", right:"5%", width:"400px", height:"400px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(102,187,106,0.28) 0%, rgba(56,142,60,0.12) 45%, transparent 70%)",
          filter:"blur(50px)", animation:"portal-orb3 18s ease-in-out infinite", animationDelay:"-6s" }} />
      </div>

      {/* ── Top toolbar ─────────────────────────────────────────────────── */}
      {!fullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: "relative", zIndex: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 20px", height: "52px", flexShrink: 0,
            background: "rgba(0,18,28,0.80)",
            borderBottom: "1px solid rgba(0,229,255,0.14)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 1px 0 rgba(0,229,255,0.06), 0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                display:"flex", alignItems:"center", gap:"5px",
                padding:"5px 10px", borderRadius:"8px",
                background:"rgba(0,229,255,0.07)", border:"1px solid rgba(0,229,255,0.18)",
                color:"rgba(0,229,255,0.80)", cursor:"pointer", fontSize:"12px", fontWeight:500,
                transition:"all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(0,229,255,0.14)"; e.currentTarget.style.borderColor="rgba(0,229,255,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(0,229,255,0.07)"; e.currentTarget.style.borderColor="rgba(0,229,255,0.18)"; }}
            >
              <ChevronLeft style={{ width:14, height:14 }} /> Hub
            </button>

            <div style={{ width:1, height:20, background:"rgba(0,229,255,0.12)" }} />

            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              {/* Pulsing indicator */}
              <div style={{ position:"relative", width:8, height:8 }}>
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,229,255,0.9)",
                  animation:"portal-orb3 2s ease-in-out infinite" }} />
                <div style={{ position:"absolute", inset:"-4px", borderRadius:"50%",
                  background:"rgba(0,229,255,0.25)", animation:"portal-orb3 2s ease-in-out infinite", animationDelay:"-1s" }} />
              </div>
              <span style={{ fontSize:"14px", fontWeight:700,
                background:"linear-gradient(135deg,#e0ffff,#00e5ff,#00bcd4)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                Network Coverage Map
              </span>
              <span style={{ fontSize:"10px", fontWeight:600,
                background:"rgba(0,229,255,0.14)", color:"rgba(0,229,255,0.95)",
                border:"1px solid rgba(0,229,255,0.30)", padding:"2px 8px", borderRadius:"20px" }}>
                LIVE
              </span>
            </div>
          </div>

          <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
            <a href={MAP_URL} target="_blank" rel="noopener noreferrer"
              style={{
                display:"flex", alignItems:"center", gap:"5px", padding:"5px 10px",
                borderRadius:"8px", background:"rgba(0,229,255,0.06)", border:"1px solid rgba(0,229,255,0.14)",
                color:"rgba(0,229,255,0.60)", textDecoration:"none", fontSize:"11px", fontWeight:500,
                transition:"all 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background="rgba(0,229,255,0.12)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background="rgba(0,229,255,0.06)"; }}
              title="Open in new tab"
            >
              <ExternalLink style={{ width:13, height:13 }} /> Open
            </a>
            <button
              onClick={() => setFullscreen(true)}
              style={{
                display:"flex", alignItems:"center", gap:"5px", padding:"5px 10px",
                borderRadius:"8px", border:"1px solid rgba(0,229,255,0.14)",
                background:"rgba(0,229,255,0.08)", color:"rgba(0,229,255,0.70)",
                cursor:"pointer", fontSize:"11px", fontWeight:500, transition:"all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(0,229,255,0.16)"; e.currentTarget.style.borderColor="rgba(0,229,255,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(0,229,255,0.08)"; e.currentTarget.style.borderColor="rgba(0,229,255,0.14)"; }}
              title="Fullscreen"
            >
              <Maximize2 style={{ width:13, height:13 }} /> Expand
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Fullscreen exit bar ─────────────────────────────────────────── */}
      {fullscreen && (
        <div style={{
          position:"absolute", top:0, left:0, right:0, zIndex:50,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 20px", height:44,
          background:"rgba(0,12,20,0.85)", backdropFilter:"blur(12px)",
          borderBottom:"1px solid rgba(0,229,255,0.12)",
        }}>
          <span style={{ fontSize:12, fontWeight:600,
            background:"linear-gradient(135deg,#00e5ff,#00bcd4)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Network Coverage Map — Fullscreen
          </span>
          <button
            onClick={() => setFullscreen(false)}
            style={{
              display:"flex", alignItems:"center", gap:"5px", fontSize:12, fontWeight:500,
              color:"rgba(0,229,255,0.70)", border:"1px solid rgba(0,229,255,0.20)",
              background:"rgba(0,229,255,0.08)", cursor:"pointer", padding:"4px 10px", borderRadius:"8px",
            }}
          >
            <Minimize2 style={{ width:13, height:13 }} /> Exit
          </button>
        </div>
      )}

      {/* ── Map frame — glass border, luminous glow ─────────────────────── */}
      <div style={{
        flex: 1, position:"relative", zIndex:10,
        margin: fullscreen ? "0" : "12px 16px 16px",
        borderRadius: fullscreen ? "0" : "20px",
        overflow:"hidden",
        border: fullscreen ? "none" : "1px solid rgba(0,229,255,0.22)",
        boxShadow: fullscreen ? "none" : "0 0 60px rgba(0,229,255,0.18), 0 0 120px rgba(0,188,212,0.10), 0 8px 40px rgba(0,0,0,0.7)",
      }}>
        {/* Corner glow accents */}
        {!fullscreen && <>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", zIndex:5, pointerEvents:"none",
            background:"linear-gradient(90deg,transparent,rgba(0,229,255,0.60),rgba(160,255,250,0.40),rgba(0,229,255,0.60),transparent)" }} />
          <div style={{ position:"absolute", top:0, left:0, bottom:0, width:"2px", zIndex:5, pointerEvents:"none",
            background:"linear-gradient(180deg,rgba(0,229,255,0.45),transparent 60%)" }} />
          <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"2px", zIndex:5, pointerEvents:"none",
            background:"linear-gradient(180deg,rgba(0,229,255,0.45),transparent 60%)" }} />
        </>}
        <iframe
          src={MAP_URL}
          title="Occu-Med Network Map"
          style={{ width:"100%", height:"100%", border:"none", display:"block" }}
          allow="geolocation; fullscreen"
          loading="eager"
        />
      </div>
    </div>
  );
}
