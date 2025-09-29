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
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/enterprises" component={Enterprises} />
          <Route path="/people" component={People} />
          <Route path="/opportunities" component={Opportunities} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/copilot" component={Copilot} />
          <Route path="/bulk-import" component={BulkImport} />
          <Route path="/settings*" component={Settings} />
        </>
      )}
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
