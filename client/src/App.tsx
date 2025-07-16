import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ClimbLog from "@/pages/climb-log";
import Stats from "@/pages/stats";
import BottomNav from "@/components/bottom-nav";
import MobileHeader from "@/components/mobile-header";

function Router() {
  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative">
      <MobileHeader />
      <main className="pb-20 px-4">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/climb-log" component={ClimbLog} />
          <Route path="/stats" component={Stats} />
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
