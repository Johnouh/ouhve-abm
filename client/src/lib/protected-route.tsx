// 🔒 보호된 라우트 컴포넌트 (Protected Route Component)
// 🎯 Purpose: 인증된 사용자만 접근할 수 있는 라우트를 보호하는 HOC (Higher-Order Component to protect routes accessible only to authenticated users)
// 🔐 Security: 세션 기반 인증 확인 및 미인증 사용자 리다이렉트 (Session-based authentication check and redirect for unauthenticated users)

import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// 🏷️ 보호된 라우트 프롭스 타입 정의 (Protected route props type definition)
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string; // 라우트 경로 (Route path)
  component: () => React.JSX.Element; // 렌더링할 컴포넌트 (Component to render)
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {/* ⏳ 인증 상태 로딩 중 (Authentication state loading) */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      )}
      
      {/* 🚫 미인증 사용자 로그인 페이지로 리다이렉트 (Redirect unauthenticated users to login page) */}
      {!isLoading && !user && <Redirect to="/auth" />}
      
      {/* ✅ 인증된 사용자는 컴포넌트 렌더링 (Render component for authenticated users) */}
      {!isLoading && user && <Component />}
    </Route>
  );
}
