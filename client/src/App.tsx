import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppShell from "./layouts/AppShell";
import { defaultRoute } from "./app/navigation";
import RouteRedirect from "./app/RouteRedirect";
import { appRoutes } from "./app/routes";

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/">
          <RouteRedirect to={defaultRoute} />
        </Route>
        {appRoutes.map(({ path, component: Component }) => (
          <Route key={path} path={path}>
            <Component />
          </Route>
        ))}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
