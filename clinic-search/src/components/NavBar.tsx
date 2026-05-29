import { Link, useLocation } from "wouter";
import { Activity, Bookmark, Clock, Settings, ChevronLeft } from "lucide-react";
import occuMedLogo from "@/assets/occu-med-logo.png";
const LOGO_URL = occuMedLogo;

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
        background: "rgba(2,14,24,0.82)",
        backdropFilter: "blur(28px) saturate(200%) brightness(1.05)",
        WebkitBackdropFilter: "blur(28px) saturate(200%) brightness(1.05)",
        borderBottom: "1px solid rgba(0,229,255,0.14)",
        boxShadow: "0 1px 0 rgba(0,229,255,0.06), 0 4px 24px rgba(0,0,0,0.50)",
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-xs font-medium mr-1"
              style={{ color: "rgba(0,229,255,0.50)",
                background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.12)",
                borderRadius: "8px", padding: "4px 10px" }}
              onMouseEnter={e => { e.currentTarget.style.color="rgba(0,229,255,0.90)"; e.currentTarget.style.background="rgba(0,229,255,0.12)"; e.currentTarget.style.borderColor="rgba(0,229,255,0.30)"; }}
              onMouseLeave={e => { e.currentTarget.style.color="rgba(0,229,255,0.50)"; e.currentTarget.style.background="rgba(0,229,255,0.05)"; e.currentTarget.style.borderColor="rgba(0,229,255,0.12)"; }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Hub
            </button>
          </Link>
          <div className="w-px h-4" style={{ background: "rgba(0,229,255,0.12)" }} />
          <img src={LOGO_URL} alt="Occu-Med" style={{ height:"34px", width:"auto", objectFit:"contain", display:"block" }} />
          <div>
            <span className="text-sm font-semibold tracking-tight" style={{ color:"rgba(255,255,255,0.90)" }}>
              Web Price Search
            </span>
            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background:"rgba(0,229,255,0.12)", color:"rgba(0,229,255,0.95)", border:"1px solid rgba(0,229,255,0.25)" }}>
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
                  style={active
                    ? { background:"rgba(0,229,255,0.14)", color:"rgba(0,229,255,0.98)", border:"1px solid rgba(0,229,255,0.30)" }
                    : { color:"rgba(255,255,255,0.45)", border:"1px solid transparent" }
                  }
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color="rgba(0,229,255,0.80)"; (e.currentTarget as HTMLElement).style.background="rgba(0,229,255,0.06)"; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.background="transparent"; } }}
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
