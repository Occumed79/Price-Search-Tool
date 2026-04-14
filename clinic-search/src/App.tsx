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
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const FULL_BLEED_ROUTES = ["/network-map"];

// Animated orb background used on all non-hub portal pages
function PortalGlowBackground() {
  return (
    <>
      <style>{`
        @keyframes portal-orb1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(55px, 70px) scale(1.10); }
          50%  { transform: translate(15px, 130px) scale(0.91); }
          75%  { transform: translate(-35px, 55px) scale(1.05); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes portal-orb2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(-75px, -55px) scale(1.14); }
          50%  { transform: translate(-25px, -110px) scale(0.87); }
          75%  { transform: translate(45px, -45px) scale(1.07); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes portal-orb3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(90px, -70px) scale(1.18); }
          66%  { transform: translate(-55px, 55px) scale(0.85); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes portal-pulse {
          0%, 100% { opacity: 0.50; transform: scale(1); }
          50%       { opacity: 0.80; transform: scale(1.15); }
        }
      `}</style>
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}>
        {/* Top-left primary orb */}
        <div style={{
          position:"absolute", top:"-8%", left:"-5%",
          width:"560px", height:"560px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(56,189,248,0.52) 0%, rgba(56,189,248,0.22) 35%, transparent 70%)",
          filter:"blur(38px)",
          animation:"portal-orb1 21s ease-in-out infinite",
        }} />
        {/* Bottom-right indigo-cyan orb */}
        <div style={{
          position:"absolute", bottom:"-10%", right:"-5%",
          width:"640px", height:"640px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(99,102,241,0.42) 0%, rgba(56,189,248,0.22) 40%, transparent 70%)",
          filter:"blur(42px)",
          animation:"portal-orb2 26s ease-in-out infinite",
          animationDelay:"-10s",
        }} />
        {/* Center cyan accent */}
        <div style={{
          position:"absolute", top:"30%", left:"32%",
          width:"420px", height:"420px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(0,200,230,0.38) 0%, rgba(56,189,248,0.16) 40%, transparent 70%)",
          filter:"blur(34px)",
          animation:"portal-orb3 16s ease-in-out infinite",
          animationDelay:"-5s",
        }} />
        {/* Top-right sparkle */}
        <div style={{
          position:"absolute", top:"4%", right:"9%",
          width:"250px", height:"250px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(147,210,255,0.65) 0%, rgba(56,189,248,0.30) 40%, transparent 70%)",
          filter:"blur(22px)",
          animation:"portal-pulse 8s ease-in-out infinite",
          animationDelay:"-3s",
        }} />
        {/* Bottom-left fill */}
        <div style={{
          position:"absolute", bottom:"8%", left:"7%",
          width:"320px", height:"320px",
          borderRadius:"50%",
          background:"radial-gradient(circle at center, rgba(59,130,246,0.45) 0%, rgba(96,165,250,0.20) 40%, transparent 70%)",
          filter:"blur(28px)",
          animation:"portal-pulse 13s ease-in-out infinite",
          animationDelay:"-7s",
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
        background: "#04091a",
        position: "relative",
        isolation: "isolate",
      }}
    >
      {/* Animated glow background on all portal pages (not hub, which has its own) */}
      {!isHub && !isFullBleed && <PortalGlowBackground />}

      {/* Navbar */}
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
