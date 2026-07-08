// 결제 콜백 페이지 (Payment Callback Page)
// 빌게이트 결제 완료 후 RETURN_URL로 리다이렉트되는 페이지
// Billgate redirects here after payment completion

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PaymentResult = {
  success: boolean;
  orderId: string;
  amount: number;
  message: string;
  authNumber?: string;
};

export default function PaymentCallbackPage() {
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    // URL 파라미터에서 결제 결과 추출 (Extract payment result from URL params)
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success") === "true";
    const orderId = params.get("orderId") || "";
    const amount = parseInt(params.get("amount") || "0", 10);
    const message = params.get("message") || (success ? "결제가 완료되었습니다" : "결제에 실패했습니다");
    const authNumber = params.get("authNumber") || undefined;

    setResult({ success, orderId, amount, message, authNumber });
  }, []);

  const goBack = () => {
    window.location.href = "/payment-terminal";
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          {/* 결과 아이콘 (Result icon) */}
          {result.success ? (
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 shrink-0" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600 shrink-0" />
            </div>
          )}

          {/* 결과 메시지 (Result message) */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              {result.success ? "결제 완료" : "결제 실패"}
            </h2>
            <p className="text-sm text-muted-foreground">{result.message}</p>
          </div>

          {/* 결제 정보 (Payment details) */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문번호</span>
              <span className="font-medium tabular-nums">{result.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">결제금액</span>
              <span className="font-bold text-lg tabular-nums">
                {result.amount.toLocaleString()}원
              </span>
            </div>
            {result.authNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">승인번호</span>
                <span className="font-medium tabular-nums">{result.authNumber}</span>
              </div>
            )}
          </div>

          {/* 경고 메시지 (Warning for failures) */}
          {!result.success && (
            <div className="flex items-start gap-2 text-left bg-amber-50 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                결제 실패 시 자동으로 취소 처리됩니다. 문제가 지속되면 고객센터에 문의해주세요.
              </p>
            </div>
          )}

          {/* 돌아가기 버튼 (Back button) */}
          <Button onClick={goBack} className="w-full" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
            결제 터미널로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
