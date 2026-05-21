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
import BulkExtendPage from "@/pages/bulk-extend-page";
import { ProtectedRoute } from "./lib/protected-route";

/**
 * OUHVE ABM Router
 *
 * 첫 화면(`/`)은 Module 8 Owner Report — AI 운영 리포트.
 * 브리프 #15: "기존 CRM형 첫 화면이 아니라, AI 운영 리포트형 첫 화면".
 * 기존 GLFAV HomePage는 `/dashboard`로 이동 (Phase 2에서 OUHVE 톤으로 재정렬 예정).
 */
function AppRouter() {
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
      {/* OUHVE ABM — Module 8 Owner Report — /report 에서 접근 */}
      <ProtectedRoute path="/report" component={OwnerReportPage} />
      {/* OUHVE ABM — GAP-21 단체 연장 */}
      <ProtectedRoute path="/bulk-extend" component={BulkExtendPage} />
      {/* 루트(/) 는 HomePage — 사이드바 메뉴 + 모든 OUHVE 기능 접근점. Owner Report 링크는 사이드바에 추가됨. */}
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/:rest*" component={HomePage} />
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
            <AppRouter />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
