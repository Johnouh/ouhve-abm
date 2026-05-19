// 🏪 키오스크 전용 홈 페이지 (Kiosk Home Page)
// 🎯 Purpose: kiosk.ouhve.app 전용 — 단말기 결제만, 미니멀 UI
// 🔒 Auth: 미인증 시 /kiosk로 리다이렉트

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import KioskPaymentView from "@/components/kiosk-payment-view";

export default function KioskHomePage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, logoutMutation } = useAuth();

  // 미인증 시 키오스크 로그인으로 이동 (Redirect to kiosk login if not authenticated)
  useEffect(() => {
    if (!isLoading && !user) setLocation("/kiosk");
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user || !user.franchiseId) return null;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => setLocation("/kiosk"),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <KioskPaymentView
          franchiseId={user.franchiseId}
          onBack={handleLogout}
          kioskMode={true}
        />
      </div>
    </div>
  );
}
