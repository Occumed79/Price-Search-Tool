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
import HubNavBar from "@/components/HubNavBar";
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

function Layout() {
  const [location] = useLocation();
  const isHub = location === "/";
  const isFullBleed = FULL_BLEED_ROUTES.some(r => location.startsWith(r));

  return (
    <div className={`min-h-screen ${isHub ? "hub-bg" : "atmo-bg"} text-foreground flex flex-col`}>
      {!isFullBleed && (isHub ? <HubNavBar /> : <NavBar />)}
      <main className={isFullBleed ? "flex-1 flex flex-col" : "flex-1"}>
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
