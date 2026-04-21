import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HubPage from "@/pages/HubPage";
import SearchPage from "@/pages/SearchPage";
import SavedPage from "@/pages/SavedPage";
import SearchesPage from "@/pages/SearchesPage";
import SettingsPage from "@/pages/SettingsPage";
import NetworkMapPage from "@/pages/NetworkMapPage";
import ReportPage from "@/pages/ReportPage";
import NavBar from "@/components/NavBar";
import { useLocation } from "wouter";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const FULL_BLEED_ROUTES = ["/network-map"];

// ── Sunset glow background for inner portal pages ─────────────────────────────
function PortalSunsetBackground() {
  return (
    <>
      <style>{`
        @keyframes sunset-orb1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(50px, 60px) scale(1.08); }
          50%  { transform: translate(12px, 120px) scale(0.93); }
          75%  { transform: translate(-30px, 50px) scale(1.04); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes sunset-orb2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(-60px, -50px) scale(1.12); }
          66%  { transform: translate(40px, -90px) scale(0.88); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes sunset-orb3 {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%       { opacity: 0.75; transform: scale(1.12); }
        }
      `}</style>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
        {/* Amber-orange top-left */}
        <div style={{
          position:"absolute", top:"-6%", left:"-4%",
          width:"580px", height:"580px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(251,146,60,0.38) 0%, rgba(234,88,12,0.18) 35%, transparent 70%)",
          filter:"blur(40px)",
          animation:"sunset-orb1 22s ease-in-out infinite",
        }} />
        {/* Crimson-rose bottom-right */}
        <div style={{
          position:"absolute", bottom:"-8%", right:"-4%",
          width:"620px", height:"620px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(185,28,28,0.32) 0%, rgba(159,18,57,0.18) 40%, transparent 70%)",
          filter:"blur(44px)",
          animation:"sunset-orb2 28s ease-in-out infinite",
          animationDelay:"-12s",
        }} />
        {/* Deep purple center-right */}
        <div style={{
          position:"absolute", top:"35%", right:"10%",
          width:"380px", height:"380px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(88,28,135,0.35) 0%, rgba(126,34,206,0.16) 40%, transparent 70%)",
          filter:"blur(36px)",
          animation:"sunset-orb3 14s ease-in-out infinite",
          animationDelay:"-6s",
        }} />
        {/* Warm gold top-right sparkle */}
        <div style={{
          position:"absolute", top:"5%", right:"8%",
          width:"240px", height:"240px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(245,158,11,0.50) 0%, rgba(251,146,60,0.22) 40%, transparent 70%)",
          filter:"blur(24px)",
          animation:"sunset-orb3 10s ease-in-out infinite",
          animationDelay:"-3s",
        }} />
        {/* Mauve bottom-left */}
        <div style={{
          position:"absolute", bottom:"10%", left:"6%",
          width:"300px", height:"300px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(139,0,90,0.30) 0%, rgba(185,28,28,0.14) 40%, transparent 70%)",
          filter:"blur(30px)",
          animation:"sunset-orb3 16s ease-in-out infinite",
          animationDelay:"-8s",
        }} />
      </div>
    </>
  );
}

function Layout() {
  const [location] = useLocation();
  const isHub = location === "/";
  const isFullBleed = FULL_BLEED_ROUTES.some(r => location.startsWith(r));

  return (
    <div
      className="min-h-screen text-foreground flex flex-col"
      style={{
        background: "linear-gradient(160deg, #1a0800 0%, #2d1000 20%, #150510 60%, #0d0318 100%)",
        position: "relative",
        isolation: "isolate",
      }}
    >
      {/* Sunset glow on portal pages */}
      {!isHub && !isFullBleed && <PortalSunsetBackground />}

      {/* Navbar on portal pages */}
      {!isFullBleed && !isHub && <NavBar />}

      <main
        className={isFullBleed ? "flex-1 flex flex-col" : "flex-1"}
        style={{ position: "relative", zIndex: 10 }}
      >
        <Switch>
          <Route path="/" component={HubPage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/saved" component={SavedPage} />
          <Route path="/searches" component={SearchesPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/network-map" component={NetworkMapPage} />
          <Route path="/report" component={ReportPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout />
          </WouterRouter>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
