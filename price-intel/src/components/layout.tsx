import { Link, useLocation } from "wouter";
import { Search, Bookmark, History, Shield, ArrowLeft, ChevronRight, Sparkles } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const HUB_URL = (import.meta.env.VITE_HUB_URL as string | undefined) ?? "https://price-search-tool.onrender.com";

// Neon logo — matches hub
const LOGO_URL = "https://base44.app/api/apps/69dc7fa90871ac017d7a1394/files/mp/public/69dc7fa90871ac017d7a1394/9e200f82d_bf25943c4_Logo1.png";

const PORTALS = [
  { id: 1, name: "Network Search",        subtitle: "US Self-Pay Search",     href: `${HUB_URL}/search`,      active: false },
  { id: 2, name: "Network Map",           subtitle: "Geographic Coverage",    href: `${HUB_URL}/network-map`, active: false },
  { id: 3, name: "Provider Acquisition",  subtitle: "Provider Registry",      href: "#",                       active: false },
  { id: 4, name: "Report Generator",      subtitle: "Analytics & Reports",    href: `${HUB_URL}/report`,      active: false },
  { id: 5, name: "Global Intelligence",   subtitle: "International Search",   href: "/",                       active: true  },
  { id: 6, name: "Pricing Transparency",  subtitle: "Transparency DB",        href: "#",                       active: false },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/",          label: "Intelligence", icon: Search  },
    { href: "/bookmarks", label: "Bookmarks",    icon: Bookmark },
    { href: "/history",   label: "History",      icon: History  },
    { href: "/admin",     label: "Diagnostics",  icon: Shield   },
  ];

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <header
        className="flex-none h-16 z-50 sticky top-0 px-6 flex items-center justify-between"
        style={{
          background: "rgba(14, 6, 30, 0.82)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderBottom: "1px solid rgba(120, 80, 255, 0.18)",
          boxShadow: "0 1px 0 rgba(160,100,255,0.06), 0 4px 24px rgba(0,0,0,0.50)",
        }}
      >
        {/* Left: back-to-hub + neon logo + portal switcher */}
        <div className="flex items-center gap-2">

          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-all"
            style={{ color: "rgba(180,130,255,0.55)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(200,160,255,0.90)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(180,130,255,0.55)")}
            title="Back to Occu-Med Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </a>

          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.10)" }} />

          {/* Neon logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src={LOGO_URL}
              alt="Occu-Med"
              style={{ height: "34px", width: "auto", objectFit: "contain", display: "block" }}
            />
            <div>
              <span className="font-bold text-sm tracking-tight leading-none block" style={{ color: "rgba(255,255,255,0.92)" }}>
                Global Intelligence
              </span>
              <span className="text-[10px] font-medium leading-none tracking-wider uppercase" style={{ color: "rgba(160,100,255,0.75)" }}>
                Portal 5
              </span>
            </div>
          </Link>

          {/* Portal switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-1 h-8 px-2.5 rounded-xl text-xs gap-1"
                style={{ color: "rgba(180,130,255,0.60)" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Portals</span>
                <ChevronRight className="w-3 h-3 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 border-border/40 shadow-2xl"
              style={{ background: "rgba(14,6,30,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(120,80,255,0.20)" }}
            >
              <DropdownMenuLabel className="text-xs uppercase tracking-wider font-semibold" style={{ color: "rgba(180,130,255,0.60)" }}>
                Occu-Med Network
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.07)" }} />
              {PORTALS.map((p) => (
                <DropdownMenuItem key={p.id} asChild>
                  <a
                    href={p.href}
                    target={p.active ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={p.active
                        ? { background: "rgba(160,100,255,0.25)", color: "rgba(200,160,255,1)" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.40)" }
                      }
                    >
                      {p.id}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold" style={{ color: p.active ? "rgba(200,160,255,1)" : "rgba(255,255,255,0.80)" }}>
                        {p.name}
                      </div>
                      <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{p.subtitle}</div>
                    </div>
                    {p.active && <span className="ml-auto text-xs font-semibold" style={{ color: "rgba(180,130,255,0.90)" }}>Active</span>}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={isActive
                  ? { background: "rgba(120,80,255,0.18)", color: "rgba(200,160,255,0.98)", border: "1px solid rgba(120,80,255,0.30)" }
                  : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }
                }
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(200,160,255,0.80)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
              >
                <Icon className="w-4 h-4" style={{ opacity: isActive ? 1 : 0.6 }} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
