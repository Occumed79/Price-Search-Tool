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
import ReportPage from "@/pages/ReportPage";
import SharedToolsPage from "@/pages/SharedToolsPage";
import NavBar from "@/components/NavBar";
import { useLocation } from "wouter";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const SELF_NAV_ROUTES = ["/report"]; // these pages have their own internal navbar

// ── Teal-Cyan floating orb background for inner portal pages ──────────────────
function PortalTealBackground() {
  return (
    <>
      <style>{`
        @keyframes portal-orb1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(60px, -80px) scale(1.12); }
          50%  { transform: translate(15px, -140px) scale(0.90); }
          75%  { transform: translate(-40px, -55px) scale(1.07); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes portal-orb2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(-70px, 65px) scale(1.15); }
          66%  { transform: translate(55px, 100px) scale(0.86); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes portal-orb3 {
          0%, 100% { opacity: 0.60; transform: scale(1); }
          50%       { opacity: 1.00; transform: scale(1.16); }
        }
      `}</style>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden",
        background:"linear-gradient(160deg,#020d12 0%,#041820 20%,#052018 50%,#030f18 80%,#020a10 100%)" }}>
        {/* Bright cyan — top-left */}
        <div style={{
          position:"absolute", top:"-5%", left:"-3%",
          width:"650px", height:"650px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(0,229,255,0.45) 0%, rgba(0,188,212,0.22) 35%, transparent 68%)",
          filter:"blur(55px)",
          animation:"portal-orb1 24s ease-in-out infinite",
        }} />
        {/* Deep teal — bottom-right */}
        <div style={{
          position:"absolute", bottom:"-8%", right:"-4%",
          width:"700px", height:"700px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(0,150,136,0.42) 0%, rgba(38,166,154,0.20) 40%, transparent 70%)",
          filter:"blur(60px)",
          animation:"portal-orb2 30s ease-in-out infinite",
          animationDelay:"-14s",
        }} />
        {/* Green — mid-right */}
        <div style={{
          position:"absolute", top:"40%", right:"5%",
          width:"420px", height:"420px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(102,187,106,0.30) 0%, rgba(56,142,60,0.14) 45%, transparent 70%)",
          filter:"blur(46px)",
          animation:"portal-orb3 16s ease-in-out infinite",
          animationDelay:"-6s",
        }} />
        {/* Aqua — top-right */}
        <div style={{
          position:"absolute", top:"3%", right:"7%",
          width:"300px", height:"300px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(0,229,255,0.50) 0%, rgba(0,212,220,0.24) 38%, transparent 68%)",
          filter:"blur(38px)",
          animation:"portal-orb3 12s ease-in-out infinite",
          animationDelay:"-3s",
        }} />
        {/* Seafoam — bottom-left */}
        <div style={{
          position:"absolute", bottom:"6%", left:"8%",
          width:"380px", height:"380px", borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(38,166,154,0.35) 0%, rgba(0,188,212,0.16) 42%, transparent 70%)",
          filter:"blur(50px)",
          animation:"portal-orb1 20s ease-in-out infinite",
          animationDelay:"-10s",
        }} />
      </div>
    </>
  );
}

function Layout() {
  const [location] = useLocation();
  const isHub = location === "/";

  return (
    <div
      className="min-h-screen text-foreground flex flex-col"
      style={{ position: "relative", isolation: "isolate" }}
    >
      {/* Teal glow on ALL pages including hub */}
      <PortalTealBackground />

      {/* Navbar on portal pages */}
      {!isHub && !SELF_NAV_ROUTES.some(r => location.startsWith(r)) && <NavBar />}

      <main
        className="flex-1"
        style={{ position: "relative", zIndex: 10 }}
      >
        <Switch>
          <Route path="/" component={HubPage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/saved" component={SavedPage} />
          <Route path="/searches" component={SearchesPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/report" component={ReportPage} />
          <Route path="/shared-tools" component={SharedToolsPage} />
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
