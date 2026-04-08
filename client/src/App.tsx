import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AccessGuard from "@/components/auth/AccessGuard";
import { AccessControlProvider } from "@/contexts/AccessControlContext";
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
        {appRoutes.map(({ path, component: Component, requirePeopleManager }) => (
          <Route key={path} path={path}>
            <AccessGuard path={path} requirePeopleManager={requirePeopleManager}>
              <Component />
            </AccessGuard>
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
        <AccessControlProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AccessControlProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
