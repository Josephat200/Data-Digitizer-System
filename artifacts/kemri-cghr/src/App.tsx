import { useEffect } from "react";
import { setupApi } from "./lib/api";
import { useAuth } from "./lib/auth";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ScreeningList from "@/pages/screening-list";
import ScreeningForm from "@/pages/screening-form";
import ParticipantDetail from "@/pages/participant-detail";
import EnrolmentList from "@/pages/enrolment-list";
import AncList from "@/pages/anc-list";
import DeliveryList from "@/pages/delivery-list";
import CloseoutList from "@/pages/closeout-list";
import AuditLog from "@/pages/audit-log";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

setupApi();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function RootRedirect({ token }: { token: string | null }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(token ? "/dashboard" : "/login");
  }, [token, setLocation]);
  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) setLocation("/login");
  }, [token, setLocation]);

  if (!token) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { token, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      if (token) {
        timeout = setTimeout(() => {
          logout();
          alert("Session expired due to inactivity.");
        }, 30 * 60 * 1000);
      }
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(e => document.addEventListener(e, resetTimeout));
    resetTimeout();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimeout));
      clearTimeout(timeout);
    };
  }, [token, logout]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => <RootRedirect token={token} />}
      </Route>
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/screening"><ProtectedRoute component={ScreeningList} /></Route>
      <Route path="/screening/new"><ProtectedRoute component={ScreeningForm} /></Route>
      <Route path="/screening/:id/edit"><ProtectedRoute component={ScreeningForm} /></Route>
      <Route path="/screening/:id"><ProtectedRoute component={ParticipantDetail} /></Route>
      <Route path="/enrolment"><ProtectedRoute component={EnrolmentList} /></Route>
      <Route path="/anc"><ProtectedRoute component={AncList} /></Route>
      <Route path="/delivery"><ProtectedRoute component={DeliveryList} /></Route>
      <Route path="/closeout"><ProtectedRoute component={CloseoutList} /></Route>
      <Route path="/audit"><ProtectedRoute component={AuditLog} /></Route>
      <Route path="/reports"><ProtectedRoute component={Reports} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
