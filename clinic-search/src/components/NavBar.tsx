import { Link, useLocation } from "wouter";
import { Activity, Bookmark, Clock, Settings, ChevronLeft } from "lucide-react";

// Updated to actual Occu-Med logo
const LOGO_URL = "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/2f069a7d6_occu-med-logo.png";

const navItems = [
  { href: "/search",   label: "Search",   icon: Activity },
  { href: "/saved",    label: "Saved",    icon: Bookmark },
  { href: "/searches", label: "History",  icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function NavBar() {
  const [location] = useLocation();

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(26,8,0,0.78)",
        backdropFilter: "blur(28px) saturate(180%) brightness(0.9)",
        WebkitBackdropFilter: "blur(28px) saturate(180%) brightness(0.9)",
        borderBottom: "1px solid rgba(255,160,60,0.12)",
        boxShadow: "0 1px 0 rgba(255,200,80,0.05), 0 4px 24px rgba(0,0,0,0.45)",
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back to Hub */}
          <Link href="/">
            <button
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-xs font-medium mr-1"
              style={{ color: "rgba(255,180,80,0.50)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,180,80,0.90)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,180,80,0.50)")}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Hub
            </button>
          </Link>
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.10)" }} />
          {/* Logo */}
          <img
            src={LOGO_URL}
            alt="Occu-Med"
            className="h-7 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1)", opacity: 0.75 }}
          />
          <div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.90)" }}>
              Web Price Search
            </span>
            <span
              className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(251,146,60,0.15)",
                color: "rgba(253,186,116,0.95)",
                border: "1px solid rgba(251,146,60,0.28)",
              }}
            >
              BETA
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href === "/search" && location === "/");
            return (
              <Link key={href} href={href}>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={
                    active
                      ? {
                          background: "rgba(251,146,60,0.18)",
                          color: "rgba(253,186,116,0.98)",
                          border: "1px solid rgba(251,146,60,0.32)",
                        }
                      : {
                          color: "rgba(255,255,255,0.48)",
                          border: "1px solid transparent",
                        }
                  }
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,200,120,0.85)";
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.48)";
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
