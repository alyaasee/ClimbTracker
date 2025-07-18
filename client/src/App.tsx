import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ClimbLog from "@/pages/climb-log";
import Stats from "@/pages/stats";
import Profile from "@/pages/profile";
import Login from "@/pages/auth/login";
import Verify from "@/pages/auth/verify";
import BottomNav from "@/components/bottom-nav";
import MobileHeader from "@/components/mobile-header";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(228deg, rgba(206, 228, 210, 1) 0%, rgba(239, 115, 38, 1) 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-xl">🧗</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth/verify" component={Verify} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen relative" style={{ background: 'linear-gradient(228deg, rgba(206, 228, 210, 1) 0%, rgba(239, 115, 38, 1) 100%)' }}>
      <MobileHeader />
      <main className="pb-20 px-3">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/climb-log" component={ClimbLog} />
          <Route path="/stats" component={Stats} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
