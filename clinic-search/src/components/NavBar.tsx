import { Link, useLocation } from "wouter";
import { Activity, Bookmark, Clock, Settings, ChevronLeft } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69db321c6efb66daf94886ba/ad765f27e_omLogo_header.png";

const navItems = [
  { href: "/search",   label: "Search",   icon: Activity },
  { href: "/saved",    label: "Saved",    icon: Bookmark },
  { href: "/searches", label: "History",  icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function NavBar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50"
      style={{
        background: "rgba(4,9,26,0.75)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        borderBottom: "1px solid rgba(147,210,255,0.10)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back to Hub */}
          <Link href="/">
            <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-xs font-medium mr-1"
              style={{ color: "rgba(147,210,255,0.50)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(147,210,255,0.85)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(147,210,255,0.50)")}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Hub
            </button>
          </Link>
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.10)" }} />
          <img src={LOGO_URL} alt="Occu-Med" className="h-6 w-auto object-contain opacity-70" />
          <div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.90)" }}>
              Web Price Search
            </span>
            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background:"rgba(56,189,248,0.15)", color:"rgb(125,211,252)", border:"1px solid rgba(56,189,248,0.25)" }}>
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
                  style={active ? {
                    background: "rgba(56,189,248,0.15)",
                    color: "rgb(125,211,252)",
                    border: "1px solid rgba(56,189,248,0.28)",
                  } : {
                    color: "rgba(255,255,255,0.50)",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.80)";
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)";
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
