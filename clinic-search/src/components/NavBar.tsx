import { Link, useLocation } from "wouter";
import { Activity, Bookmark, Clock, Settings, ChevronLeft } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69db321c6efb66daf94886ba/ad765f27e_omLogo_header.png";

const navItems = [
  { href: "/search", label: "Search", icon: Activity },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/searches", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function NavBar() {
  const [location] = useLocation();

  return (
    <header className="glass-sidebar border-b border-white/[0.06] sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back to Hub */}
          <Link href="/">
            <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all text-xs font-medium mr-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Hub
            </button>
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <img src={LOGO_URL} alt="Occu-Med" className="h-6 w-auto object-contain opacity-70" />
          <div>
            <span className="text-sm font-semibold text-white/90 tracking-tight">
              Web Price Search
            </span>
            <span className="ml-2 text-[10px] font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    active
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                  }`}
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
