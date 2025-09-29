import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Enterprises from "@/pages/Enterprises";
import People from "@/pages/People";
import Opportunities from "@/pages/Opportunities";
import Tasks from "@/pages/Tasks";
import Copilot from "@/pages/Copilot";
import BulkImport from "@/pages/BulkImport";
import Settings from "@/pages/Settings";
import Partners from "@/pages/Partners";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // If loading or not authenticated, show only landing and partners routes
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/partners" component={Partners} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // If authenticated, show all authenticated routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/directory*" component={Landing} />
      <Route path="/enterprises" component={Enterprises} />
      <Route path="/people" component={People} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/partners" component={Partners} />
      <Route path="/copilot" component={Copilot} />
      <Route path="/bulk-import" component={BulkImport} />
      <Route path="/settings*" component={Settings} />
      <Route path="/analytics" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Analytics</h1><p>Coming soon...</p></div>} />
      <Route path="/maps" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Maps API</h1><p>Coming soon...</p></div>} />
      <Route component={NotFound} />
    </Switch>
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
