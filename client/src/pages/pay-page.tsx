// 결제 링크 페이지 (Pay Link Page)
// SMS/링크복사로 전달된 URL 접속 시 결제 진행
// 인증 불필요 — 공개 페이지

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, AlertCircle, CheckCircle2, Store } from "lucide-react";

interface PaymentInfo {
  orderId: string;
  orderDate: string;
  amount: number;
  itemName: string;
  itemCode: string;
  status: string;
  serviceId: string;
  serviceCode: string;
  hashKey: string;
  returnUrl: string;
  protocolType: string;
  storeName: string;
  expired?: boolean;
}

// 빌게이트 결제 URL 매핑 (Billgate payment URL by service code)
const getBillgatePayUrl = (baseUrl: string, serviceCode: string, isMobile: boolean): string => {
  switch (serviceCode) {
    case "0900": return `${baseUrl}/credit${isMobile ? "/smartphone" : ""}/certify.jsp`;
    case "1000": return `${baseUrl}/account${isMobile ? "/smartphone" : ""}/certify.jsp`;
    case "1100": return `${baseUrl}/mobile${isMobile ? "/smartphone" : ""}/certify.jsp`;
    case "1800": return `${baseUrl}/vaccount/certify.jsp`;
    default: return `${baseUrl}/credit${isMobile ? "/smartphone" : ""}/certify.jsp`;
  }
};

export default function PayPage() {
  const params = useParams<{ orderId: string }>();
  const [payInfo, setPayInfo] = useState<PaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayInfo = async () => {
      try {
        const res = await fetch(`/api/pg/pay/${params.orderId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "결제 정보를 불러올 수 없습니다");
          return;
        }
        const data = await res.json();
        setPayInfo(data);
      } catch {
        setError("서버 연결에 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayInfo();
  }, [params.orderId]);

  // Billgate form POST 결제 실행 (Execute Billgate payment via form POST)
  const handlePay = () => {
    if (!payInfo) return;

    const oldForm = document.getElementById("billgate_pay_form");
    if (oldForm) oldForm.remove();

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const billgateBase = payInfo.protocolType === "https_tpay"
      ? "https://tpay.billgate.net"
      : "https://pay.billgate.net";
    const payUrl = getBillgatePayUrl(billgateBase, payInfo.serviceCode, isMobile);

    const form = document.createElement("form");
    form.id = "billgate_pay_form";
    form.name = "billgate_pay_form";
    form.method = "POST";
    form.action = payUrl;
    form.acceptCharset = "euc-kr";

    const fields: Record<string, string> = {
      SERVICE_ID: payInfo.serviceId,
      SERVICE_CODE: payInfo.serviceCode,
      ORDER_ID: payInfo.orderId,
      ORDER_DATE: payInfo.orderDate,
      AMOUNT: payInfo.amount.toString(),
      ITEM_CODE: payInfo.itemCode,
      ITEM_NAME: payInfo.itemName,
      USER_ID: "link_customer",
      USER_NAME: "",
      USER_EMAIL: "",
      USER_IP: "0.0.0.0",
      CURRENCY: "0000",
      OPCODE: "0000",
      RETURN_URL: payInfo.returnUrl,
      HASH_KEY: payInfo.hashKey,
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);

    if (isMobile) {
      form.submit();
    } else {
      form.target = "billgate_pay_form";
      window.open("", "billgate_pay_form",
        "width=640,height=613,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=no,left=150,top=150"
      );
      form.submit();
    }
  };

  const formatPrice = (price: number) => price.toLocaleString("ko-KR");

  // 로딩 (Loading)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 에러 (Error)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto shrink-0" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 만료/완료된 결제 (Expired or completed payment)
  if (payInfo?.expired || payInfo?.status !== "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-3">
            {payInfo?.status === "completed" ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto shrink-0" />
                <p className="text-sm font-medium text-green-600">결제가 완료되었습니다</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto shrink-0" />
                <p className="text-sm font-medium text-amber-600">결제가 만료되었거나 처리중입니다</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 결제 화면 (Payment screen)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm overflow-hidden">
        {/* 상단 가게 정보 (Store info header) */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white text-center">
          <Store className="w-8 h-8 mx-auto mb-2 shrink-0" />
          <p className="text-sm font-medium opacity-90">{payInfo.storeName}</p>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* 상품 정보 (Product info) */}
          <div className="text-center space-y-1">
            <p className="text-base font-semibold text-gray-900">{payInfo.itemName}</p>
            <p className="text-3xl font-bold text-orange-600 tabular-nums">
              {formatPrice(payInfo.amount)}<span className="text-base font-normal">원</span>
            </p>
          </div>

          {/* 결제하기 버튼 (Pay button) */}
          <Button
            onClick={handlePay}
            className="w-full h-14 text-base font-bold bg-orange-500 hover:bg-orange-600 rounded-xl"
          >
            <CreditCard className="w-5 h-5 mr-2 shrink-0" />
            결제하기
          </Button>

          {/* 주문번호 (Order ID) */}
          <p className="text-[10px] text-center text-muted-foreground">
            주문번호: {payInfo.orderId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
