import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ErrorBoundary } from "@/components/error-boundary";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import GroupLessonAddPage from "@/pages/group-lesson-add-page";
import GroupLessonEditPage from "@/pages/group-lesson-edit-page";
import PaymentTerminalPage from "@/pages/payment-terminal-page";
import PaymentCallbackPage from "@/pages/payment-callback-page";
import PayPage from "@/pages/pay-page";
import KioskAuthPage from "@/pages/kiosk-auth-page";
import KioskHomePage from "@/pages/kiosk-home-page";
import BusinessProfilePage from "@/pages/business-profile-page";
import OwnerReportPage from "@/pages/owner-report-page";
import { ProtectedRoute } from "./lib/protected-route";
import { Loader2 } from "lucide-react";

// Landing pages (lazy loaded)
const LandingIndex = lazy(() => import("@/pages/landing/index"));
const LandingService = lazy(() => import("@/pages/landing/service"));
const LandingSettlement = lazy(() => import("@/pages/landing/settlement"));
const LandingAssurance = lazy(() => import("@/pages/landing/assurance"));
const LandingMap = lazy(() => import("@/pages/landing/map"));
const LandingContact = lazy(() => import("@/pages/landing/contact"));
const LandingSimulator = lazy(() => import("@/pages/landing/simulator"));

/** Domain detection: business.glallpay.com = CRM, otherwise = Landing */
const isCrmDomain = window.location.hostname === "business.glallpay.com";

function LandingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A1628]">
      <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
    </div>
  );
}

function LazyLanding({ Component }: { Component: React.LazyExoticComponent<() => React.JSX.Element> }) {
  return (
    <Suspense fallback={<LandingFallback />}>
      <Component />
    </Suspense>
  );
}

/** CRM Router — business.glallpay.com */
function CrmRouter() {
  return (
    <Switch>
      <Route path="/pay/:orderId" component={PayPage} />
      <Route path="/kiosk" component={KioskAuthPage} />
      <Route path="/kiosk/home" component={KioskHomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/payment-terminal" component={PaymentTerminalPage} />
      <ProtectedRoute path="/payment-callback" component={PaymentCallbackPage} />
      <ProtectedRoute path="/group-lessons/:id/edit" component={GroupLessonEditPage} />
      <ProtectedRoute path="/group-lesson-add" component={GroupLessonAddPage} />
      {/* OUHVE ABM — Module 1 Business Profile */}
      <ProtectedRoute path="/business-profile" component={BusinessProfilePage} />
      {/* OUHVE ABM — Module 8 Owner Report (첫 화면 후보 — HomePage 대체 예정) */}
      <ProtectedRoute path="/report" component={OwnerReportPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/:rest*" component={HomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

/** Landing Router — www.glallpay.com / glallpay.com / localhost */
function LandingRouter() {
  return (
    <Switch>
      <Route path="/">{() => <LazyLanding Component={LandingIndex} />}</Route>
      <Route path="/service">{() => <LazyLanding Component={LandingService} />}</Route>
      <Route path="/settlement">{() => <LazyLanding Component={LandingSettlement} />}</Route>
      <Route path="/assurance">{() => <LazyLanding Component={LandingAssurance} />}</Route>
      <Route path="/map">{() => <LazyLanding Component={LandingMap} />}</Route>
      <Route path="/contact">{() => <LazyLanding Component={LandingContact} />}</Route>
      <Route path="/simulator">{() => <LazyLanding Component={LandingSimulator} />}</Route>
      {/* CRM 접근 시 business 도메인으로 안내 */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/pay/:orderId" component={PayPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            {isCrmDomain ? <CrmRouter /> : <LandingRouter />}
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
