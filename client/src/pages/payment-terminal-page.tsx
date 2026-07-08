// 💳 결제 터미널 페이지 (Payment Terminal Page — PayKing Style)
// 🎯 Purpose: PG 결제 관리 대시보드 — 모바일 우선 레이아웃
// 📖 Reference: 페이킹(PayKing) 앱 디자인 참고

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Settings, ScanLine, CreditCard, Banknote, Search,
  Link2, ShoppingBag, Receipt, Users, Headphones, ChevronRight,
  X, Copy, Send, Check, AlertCircle, Loader2, RefreshCw,
  Calendar, Filter, MoreHorizontal, Plus, Edit, Trash2,
  QrCode, MessageSquare, Smartphone, ExternalLink,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import KioskPaymentView from "@/components/kiosk-payment-view";

// 메뉴 아이템 정의 (Menu item definitions)
const MENU_ITEMS = [
  { id: "transactions", icon: CreditCard, label: "결제현황", color: "text-orange-600" },
  { id: "deposits", icon: Banknote, label: "입금현황", color: "text-green-600" },
  { id: "search", icon: Search, label: "자료조회", color: "text-orange-600" },
  { id: "link-payment", icon: Link2, label: "링크결제", color: "text-orange-600" },
  { id: "pg-products", icon: ShoppingBag, label: "상품관리", color: "text-pink-600" },
  { id: "cash-receipt", icon: Receipt, label: "현금영수증", color: "text-teal-600" },
  { id: "pg-settings", icon: Settings, label: "PG설정", color: "text-gray-600" },
  { id: "help", icon: Headphones, label: "고객센터", color: "text-orange-600" },
];

type ActiveView = "main" | "pay" | "transactions" | "deposits" | "search" | "link-payment" | "link-payment-register" | "pg-products" | "cash-receipt" | "pg-settings" | "help" | "transaction-detail" | "kiosk";

interface PgTransaction {
  id: number;
  orderId: string;
  orderDate: string;
  transactionId?: string;
  amount: number;
  status: string;
  responseCode?: string;
  responseMessage?: string;
  authNumber?: string;
  authDate?: string;
  paymentMethod?: string;
  itemName?: string;
  userName?: string;
  userPhone?: string;
  cancelType?: string;
  cancelAmount?: number;
  cancelDate?: string;
  linkPaymentUrl?: string;
  createdAt: string;
}

interface PgProduct {
  id: number;
  name: string;
  price: number;
  itemCode: string;
  description?: string;
  category?: string;
  isActive: boolean;
  linkPaymentUrl?: string;
  orderId?: string;
}

interface PgSummary {
  todayAmount: number;
  todayCount: number;
  monthAmount: number;
  monthCount: number;
}

export default function PaymentTerminalPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = useState<ActiveView>("main");
  const [selectedTransaction, setSelectedTransaction] = useState<PgTransaction | null>(null);

  // 결제 폼 상태 (Payment form state)
  const [payAmount, setPayAmount] = useState("");
  const [payItemName, setPayItemName] = useState("");
  const [payUserName, setPayUserName] = useState("");
  const [payUserPhone, setPayUserPhone] = useState("");
  const [payServiceCode, setPayServiceCode] = useState("0900");
  const [selectedPayProduct, setSelectedPayProduct] = useState<PgProduct | null>(null);

  // 링크결제 폼 상태 (Link payment form state)
  const [linkAmount, setLinkAmount] = useState("");
  const [linkItemName, setLinkItemName] = useState("");
  const [linkUserName, setLinkUserName] = useState("");
  const [linkUserPhone, setLinkUserPhone] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  // 링크결제 개선 상태 (Link payment enhanced state)
  const [selectedLinkProduct, setSelectedLinkProduct] = useState<PgProduct | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsName, setSmsName] = useState("");
  const [linkSearchQuery, setLinkSearchQuery] = useState("");

  // 링크결제 등록 폼 상태 (Link payment register form state)
  const [linkRegName, setLinkRegName] = useState("");
  const [linkRegPrice, setLinkRegPrice] = useState("");
  const [linkRegCode, setLinkRegCode] = useState("");
  const [linkRegCategory, setLinkRegCategory] = useState("기타");

  // PG 설정 폼 상태 (PG settings form state)
  const [pgServiceId, setPgServiceId] = useState("");
  const [pgMode, setPgMode] = useState("test");
  const [pgApiKey, setPgApiKey] = useState("");
  const [pgApiIv, setPgApiIv] = useState("");

  // PG 상품 폼 상태 (PG product form state)
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState<PgProduct | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productCategory, setProductCategory] = useState("기타");

  // 데이터 페칭 (Data fetching)
  const { data: summary, isLoading: summaryLoading } = useQuery<PgSummary>({
    queryKey: ["/api/pg/summary"],
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<PgTransaction[]>({
    queryKey: ["/api/pg/transactions"],
  });

  const { data: pgProducts = [] } = useQuery<PgProduct[]>({
    queryKey: ["/api/pg/products"],
  });

  const { data: pgConfig } = useQuery<any>({
    queryKey: ["/api/pg/config"],
  });

  // PG 설정 로드 (Load PG config into form)
  useEffect(() => {
    if (pgConfig) {
      setPgServiceId(pgConfig.pgServiceId || "");
      setPgMode(pgConfig.pgMode || "test");
    }
  }, [pgConfig]);

  // 결제 준비 뮤테이션 (Prepare payment mutation)
  const prepareMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pg/prepare", data);
      return res.json();
    },
    onSuccess: (data) => {
      // 빌게이트 결제창 팝업 호출을 위한 폼 생성 (Create form for Billgate popup)
      openBillgatePayment(data);
    },
    onError: (error: Error) => {
      toast({ title: "결제 준비 실패", description: error.message, variant: "destructive" });
    },
  });

  // 링크결제 생성 뮤테이션 (Create link payment mutation)
  const linkMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pg/link", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedLink(data.linkUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/pg/transactions"] });
      toast({ title: "링크결제 생성 완료" });
    },
    onError: (error: Error) => {
      toast({ title: "링크결제 생성 실패", description: error.message, variant: "destructive" });
    },
  });

  // 링크결제 상품 등록 뮤테이션 (Create link product with auto link generation)
  const createLinkProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pg/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pg/products"] });
      toast({ title: "상품 등록 완료", description: "결제 링크가 자동 생성되었습니다" });
      setLinkRegName("");
      setLinkRegPrice("");
      setLinkRegCode("");
      setLinkRegCategory("기타");
      setActiveView("link-payment");
    },
    onError: (error: Error) => {
      toast({ title: "상품 등록 실패", description: error.message, variant: "destructive" });
    },
  });

  // SMS 발송 없음 — sms: URI 스킴으로 기기 문자 앱 오픈 (No API call — opens native SMS app)

  // 결제 취소 뮤테이션 (Cancel payment mutation)
  const cancelMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pg/cancel", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "결제 취소 완료" });
        queryClient.invalidateQueries({ queryKey: ["/api/pg/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/pg/summary"] });
        setActiveView("transactions");
      } else {
        toast({ title: "결제 취소 실패", description: data.responseMessage, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "결제 취소 실패", description: error.message, variant: "destructive" });
    },
  });

  // PG 설정 저장 뮤테이션 (Save PG config mutation)
  const configMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/pg/config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pg/config"] });
      toast({ title: "PG 설정 저장 완료" });
    },
    onError: (error: Error) => {
      toast({ title: "PG 설정 저장 실패", description: error.message, variant: "destructive" });
    },
  });

  // PG 상품 CRUD 뮤테이션 (PG Product CRUD mutations)
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pg/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pg/products"] });
      setShowProductForm(false);
      resetProductForm();
      toast({ title: "상품 등록 완료" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/pg/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pg/products"] });
      setShowProductForm(false);
      setEditProduct(null);
      resetProductForm();
      toast({ title: "상품 수정 완료" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pg/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pg/products"] });
      toast({ title: "상품 삭제 완료" });
    },
  });

  const resetProductForm = () => {
    setProductName("");
    setProductPrice("");
    setProductCode("");
    setProductCategory("기타");
  };

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

  // 빌게이트 결제창 열기 — certify.jsp로 폼 submit (Open Billgate certify page)
  const openBillgatePayment = useCallback((paymentData: any) => {
    // 1. 기존 폼 제거 (Remove existing form if any)
    const oldForm = document.getElementById("billgate_pay_form");
    if (oldForm) oldForm.remove();

    // 2. 모바일 여부 감지 (Detect mobile)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // 3. 빌게이트 서버 URL 결정 (Determine Billgate server URL)
    const billgateBase = paymentData.protocolType === "https_tpay"
      ? "https://tpay.billgate.net"
      : "https://pay.billgate.net";
    const payUrl = getBillgatePayUrl(billgateBase, paymentData.serviceCode, isMobile);

    // 4. 결제 폼 생성 (Create payment form)
    const form = document.createElement("form");
    form.id = "billgate_pay_form";
    form.name = "billgate_pay_form";
    form.method = "POST";
    form.action = payUrl;
    form.acceptCharset = "euc-kr";

    const fields: Record<string, string> = {
      SERVICE_ID: paymentData.serviceId,
      SERVICE_CODE: paymentData.serviceCode,
      ORDER_ID: paymentData.orderId,
      ORDER_DATE: paymentData.orderDate,
      AMOUNT: paymentData.amount,
      ITEM_CODE: paymentData.itemCode,
      ITEM_NAME: paymentData.itemName,
      USER_ID: user?.username || "guest",
      USER_NAME: paymentData.userName || "",
      USER_EMAIL: paymentData.userEmail || "",
      USER_IP: "0.0.0.0",
      CURRENCY: "0000",
      OPCODE: "0000",
      RETURN_URL: paymentData.returnUrl,
      HASH_KEY: paymentData.hashKey,
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);

    // 5. 팝업 또는 redirect 방식으로 결제창 호출
    if (isMobile) {
      // 모바일: 현재 창에서 redirect (submit 방식)
      form.submit();
    } else {
      // PC: 팝업으로 열기
      form.target = "billgate_pay_form";
      const popup = window.open("", "billgate_pay_form",
        "width=640,height=613,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=no,left=150,top=150"
      );
      if (!popup) {
        toast({ title: "팝업이 차단되었습니다", description: "팝업 차단을 해제해주세요.", variant: "destructive" });
        document.body.removeChild(form);
        return;
      }
      form.submit();
    }

    toast({ title: "결제창이 열렸습니다", description: "결제를 진행해주세요." });
    setActiveView("main");
    resetPayForm();
  }, [user, toast]);

  const resetPayForm = () => {
    setPayAmount("");
    setPayItemName("");
    setPayUserName("");
    setPayUserPhone("");
  };

  // 결제하기 핸들러 (Payment submit handler)
  const handlePay = () => {
    if (!payAmount || parseInt(payAmount) <= 0) {
      toast({ title: "결제 금액을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!payItemName) {
      toast({ title: "상품명을 입력해주세요", variant: "destructive" });
      return;
    }
    prepareMutation.mutate({
      amount: payAmount,
      itemName: payItemName,
      userName: payUserName,
      userPhone: payUserPhone,
      serviceCode: payServiceCode,
    });
  };

  // 링크결제 생성 핸들러 (Link payment create handler)
  const handleCreateLink = () => {
    if (!linkAmount || parseInt(linkAmount) <= 0) {
      toast({ title: "결제 금액을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!linkItemName) {
      toast({ title: "상품명을 입력해주세요", variant: "destructive" });
      return;
    }
    linkMutation.mutate({
      amount: linkAmount,
      itemName: linkItemName,
      userName: linkUserName,
      userPhone: linkUserPhone,
    });
  };

  // 링크 복사 (Copy link to clipboard)
  const copyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    toast({ title: "링크가 복사되었습니다" });
  };

  // 상태 배지 색상 (Status badge colors)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-50 text-green-600 border-green-200">승인</Badge>;
      case "cancelled": return <Badge className="bg-red-50 text-red-600 border-red-200">취소</Badge>;
      case "failed": return <Badge className="bg-gray-50 text-gray-600 border-gray-200">실패</Badge>;
      case "pending": return <Badge className="bg-amber-50 text-amber-600 border-amber-200">대기</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 날짜 포맷 (Format orderDate: YYYYMMDDHHMMSS → YYYY.MM.DD HH:MM)
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 12) return dateStr;
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)} ${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}`;
  };

  // ============================
  // 메인 대시보드 렌더링 (Main dashboard render)
  // ============================
  const renderMain = () => (
    <div className="space-y-4">
      {/* 헤더 (Header) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">OUHVE ABM Pay</h1>
            <p className="text-xs text-muted-foreground truncate">가맹점: {user?.name || "미설정"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
            {pgConfig?.pgMode === "production" ? "실거래" : "테스트"}
          </Badge>
          <button onClick={() => setActiveView("pg-settings")} className="p-2 rounded-lg hover-elevate">
            <Settings className="w-5 h-5 text-gray-500 shrink-0" />
          </button>
        </div>
      </div>

      {/* 결제 요약 카드 (Payment summary card) */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">금일 결제금액</p>
            {summaryLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-xl font-bold tabular-nums text-gray-900">
                {(summary?.todayAmount || 0).toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">원</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">{summary?.todayCount || 0}건</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">금월 결제금액</p>
            {summaryLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-xl font-bold tabular-nums text-gray-900">
                {(summary?.monthAmount || 0).toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">원</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">{summary?.monthCount || 0}건</p>
          </CardContent>
        </Card>
      </div>

      {/* 결제받기 메인 카드 (Main payment card — blue gradient) */}
      <button
        onClick={() => setActiveView("pay")}
        className="w-full rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 p-8 text-white shadow-lg hover-elevate transition-all"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <ScanLine className="w-8 h-8 text-white shrink-0" />
          </div>
          <span className="text-lg font-semibold">결제받기</span>
        </div>
      </button>

      {/* 키오스크 결제 버튼 (Kiosk payment button) */}
      <button
        onClick={() => setActiveView("kiosk")}
        className="w-full rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 p-6 text-white shadow-lg hover-elevate transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6 text-white shrink-0" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-base font-bold">키오스크 결제</span>
            <p className="text-xs text-orange-100 mt-0.5">상품 선택 후 결제를 진행합니다</p>
          </div>
        </div>
      </button>

      {/* 메뉴 그리드 4x2 (Menu grid 4x2) */}
      <div className="grid grid-cols-4 gap-3">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as ActiveView)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover-elevate transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
            </div>
            <span className="text-xs text-gray-700 font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 하단 안내 (Bottom notice) */}
      <div className="text-center py-3">
        <span className="text-xs text-muted-foreground">무이자할부 안내</span>
      </div>
    </div>
  );

  // ============================
  // 결제받기 (수기결제) 뷰 (Manual payment view)
  // ============================
  const renderPayView = () => {
    const activeProducts = pgProducts.filter(p => p.isActive);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveView("main"); setSelectedPayProduct(null); }} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <h2 className="text-lg font-bold">결제받기</h2>
        </div>

        {/* 등록 상품 선택 (Registered product selection) */}
        {activeProducts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">등록 상품 선택</Label>
            <div className="grid grid-cols-2 gap-2">
              {activeProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    const isSelected = selectedPayProduct?.id === p.id;
                    if (isSelected) {
                      setSelectedPayProduct(null);
                      setPayAmount("");
                      setPayItemName("");
                    } else {
                      setSelectedPayProduct(p);
                      setPayAmount(p.price.toString());
                      setPayItemName(p.name);
                    }
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPayProduct?.id === p.id
                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                      : "border-gray-200 bg-white hover-elevate"
                  }`}
                >
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-base font-bold tabular-nums mt-0.5">{p.price.toLocaleString()}원</p>
                  {p.category && (
                    <Badge variant="outline" className="text-[10px] mt-1">{p.category}</Badge>
                  )}
                </button>
              ))}
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-3 text-xs text-muted-foreground">또는 직접 입력</span>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="payAmount">결제 금액 *</Label>
              <Input
                id="payAmount"
                type="number"
                placeholder="0"
                value={payAmount}
                onChange={(e) => { setPayAmount(e.target.value); setSelectedPayProduct(null); }}
                className="text-2xl font-bold tabular-nums h-14 text-right"
              />
            </div>

            <div>
              <Label htmlFor="payItemName">상품명 *</Label>
              <Input
                id="payItemName"
                placeholder="상품명을 입력하세요"
                value={payItemName}
                onChange={(e) => { setPayItemName(e.target.value); setSelectedPayProduct(null); }}
              />
            </div>

            <div>
              <Label htmlFor="payServiceCode">결제 수단</Label>
              <Select value={payServiceCode} onValueChange={setPayServiceCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0900">신용카드</SelectItem>
                  <SelectItem value="1000">계좌이체</SelectItem>
                  <SelectItem value="1100">휴대폰</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payUserName">구매자명</Label>
                <Input
                  id="payUserName"
                  placeholder="이름"
                  value={payUserName}
                  onChange={(e) => setPayUserName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="payUserPhone">연락처</Label>
                <Input
                  id="payUserPhone"
                  placeholder="010-0000-0000"
                  value={payUserPhone}
                  onChange={(e) => setPayUserPhone(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handlePay}
              disabled={prepareMutation.isPending}
              className="w-full h-12 bg-primary text-primary-foreground hover-elevate active-elevate-2 font-semibold text-base"
            >
              {prepareMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />처리 중...</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2 shrink-0" />{payAmount ? `${parseInt(payAmount).toLocaleString()}원 결제하기` : "결제하기"}</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================
  // 결제현황 뷰 (Transaction list view)
  // ============================
  const renderTransactions = () => {
    // 결제현황 요약 (Transaction summary)
    const approvedTx = transactions.filter(t => t.status === "approved");
    const pendingTx = transactions.filter(t => t.status === "pending");
    const cancelledTx = transactions.filter(t => t.status === "cancelled");
    const totalApproved = approvedTx.reduce((sum, t) => sum + t.amount, 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView("main")} className="p-2 rounded-lg hover-elevate">
              <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
            </button>
            <h2 className="text-lg font-bold">결제현황</h2>
          </div>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/pg/transactions"] })} className="p-2 rounded-lg hover-elevate">
            <RefreshCw className="w-4 h-4 text-gray-500 shrink-0" />
          </button>
        </div>

        {/* 요약 카드 (Summary cards) */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">승인</p>
              <p className="text-sm font-bold tabular-nums text-green-600">{approvedTx.length}건</p>
              <p className="text-xs font-medium tabular-nums mt-0.5">{totalApproved.toLocaleString()}원</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">대기</p>
              <p className="text-sm font-bold tabular-nums text-amber-600">{pendingTx.length}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">취소</p>
              <p className="text-sm font-bold tabular-nums text-red-600">{cancelledTx.length}건</p>
            </CardContent>
          </Card>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">결제 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="hover-elevate cursor-pointer" onClick={() => {
                setSelectedTransaction(tx);
                setActiveView("transaction-detail");
              }}>
                <CardContent className="p-4 space-y-2">
                  {/* 상단: 상품명 + 상태 + 금액 (Top: item name + status + amount) */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{tx.itemName || "상품"}</p>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-base font-bold tabular-nums">{tx.amount.toLocaleString()}원</p>
                      {tx.cancelAmount ? (
                        <p className="text-xs text-red-500 tabular-nums">-{tx.cancelAmount.toLocaleString()}원</p>
                      ) : null}
                    </div>
                  </div>

                  {/* 중단: 상세 정보 (Middle: detail info) */}
                  <div className="bg-gray-50 rounded-lg p-2.5 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">결제수단</span>
                      <span className="font-medium">{tx.paymentMethod || "카드"}</span>
                    </div>
                    {tx.userName && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">구매자</span>
                        <span className="font-medium">{tx.userName}{tx.userPhone ? ` (${tx.userPhone})` : ""}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">주문번호</span>
                      <span className="font-medium tabular-nums truncate ml-2 max-w-[180px]">{tx.orderId}</span>
                    </div>
                    {tx.transactionId && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">거래번호</span>
                        <span className="font-medium tabular-nums truncate ml-2 max-w-[180px]">{tx.transactionId}</span>
                      </div>
                    )}
                    {tx.authNumber && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">승인번호</span>
                        <span className="font-medium tabular-nums">{tx.authNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* 하단: 날짜 + 링크결제 표시 (Bottom: date + link payment indicator) */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(tx.orderDate)}</span>
                    <div className="flex items-center gap-2">
                      {tx.linkPaymentUrl && (
                        <Badge variant="outline" className="text-[10px] py-0">
                          <Link2 className="w-2.5 h-2.5 mr-0.5 shrink-0" />링크
                        </Badge>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================
  // 거래 상세 뷰 (Transaction detail view)
  // ============================
  const renderTransactionDetail = () => {
    if (!selectedTransaction) return null;
    const tx = selectedTransaction;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView("transactions")} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <h2 className="text-lg font-bold">거래 상세</h2>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-center py-4">
              <p className="text-3xl font-bold tabular-nums">{tx.amount.toLocaleString()}원</p>
              <div className="mt-2">{getStatusBadge(tx.status)}</div>
            </div>

            <div className="border-t pt-3 space-y-2">
              {[
                ["상품명", tx.itemName],
                ["결제수단", tx.paymentMethod],
                ["구매자", tx.userName],
                ["연락처", tx.userPhone],
                ["주문번호", tx.orderId],
                ["거래번호", tx.transactionId],
                ["승인번호", tx.authNumber],
                ["결제일시", formatDate(tx.orderDate)],
                ["응답코드", tx.responseCode],
                ["응답메시지", tx.responseMessage],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium tabular-nums truncate ml-2 max-w-[200px]">{value}</span>
                </div>
              ))}
            </div>

            {tx.status === "approved" && (
              <Button
                onClick={() => cancelMutation.mutate({ pgTransactionId: tx.id, cancelType: "C", cancelAmount: tx.amount })}
                disabled={cancelMutation.isPending}
                variant="destructive"
                className="w-full mt-4"
              >
                {cancelMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />취소 처리 중...</>
                ) : "전체 취소"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================
  // 링크결제 뷰 (Link payment view)
  // ============================
  // 링크결제 — 링크 복사 핸들러 (Copy link payment URL)
  const handleCopyLinkUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({ title: "링크가 복사되었습니다" });
  };

  // 링크결제 — QR코드 다이얼로그 열기 (Open QR dialog)
  const handleOpenQr = (product: PgProduct) => {
    setSelectedLinkProduct(product);
    setShowQrDialog(true);
  };

  // 링크결제 — SMS 다이얼로그 열기 (Open SMS dialog)
  const handleOpenSms = (product: PgProduct) => {
    setSelectedLinkProduct(product);
    setSmsPhone("");
    setSmsName("");
    setShowSmsDialog(true);
  };

  // 링크결제 — SMS 발송 핸들러 — sms: URI 스킴 (Opens native SMS app)
  const handleSendSms = () => {
    if (!smsPhone) {
      toast({ title: "전화번호를 입력해주세요", variant: "destructive" });
      return;
    }
    if (!selectedLinkProduct) return;
    const formattedAmount = selectedLinkProduct.price.toLocaleString("ko-KR");
    const namePrefix = smsName ? `${smsName} 고객님, ` : "";
    const linkUrl = selectedLinkProduct.linkPaymentUrl || "";
    const message = `${namePrefix}${selectedLinkProduct.name}에 대한 ${formattedAmount}원 결제 URL입니다. 아래 URL에 접속하여 결제를 진행해주세요.\n${linkUrl}`;
    const phone = smsPhone.replace(/-/g, "");
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const smsUri = `sms:${phone}${isIOS ? "&" : "?"}body=${encodeURIComponent(message)}`;
    window.location.href = smsUri;
    toast({ title: "문자 앱이 열렸습니다", description: "전송 버튼을 눌러주세요" });
    setShowSmsDialog(false);
    setSmsPhone("");
    setSmsName("");
  };

  // 링크결제 등록 핸들러 (Link payment register handler)
  const handleRegisterLinkProduct = () => {
    if (!linkRegName) {
      toast({ title: "상품명을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!linkRegPrice || parseInt(linkRegPrice) <= 0) {
      toast({ title: "가격을 입력해주세요", variant: "destructive" });
      return;
    }
    createLinkProductMutation.mutate({
      name: linkRegName,
      price: parseInt(linkRegPrice),
      itemCode: linkRegCode || `LINK_${Date.now()}`,
      category: linkRegCategory,
    });
  };

  // 링크결제 상품 필터 (Filter link products by search query)
  const linkProducts = pgProducts.filter(
    (p) => p.linkPaymentUrl && (
      !linkSearchQuery ||
      p.name.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
      p.itemCode.toLowerCase().includes(linkSearchQuery.toLowerCase())
    )
  );

  // ============================
  // 링크결제 목록 뷰 (Link Payment List View)
  // ============================
  const renderLinkPayment = () => (
    <div className="space-y-4">
      {/* 헤더 (Header) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView("main")} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <h2 className="text-lg font-bold">결제링크</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveView("link-payment-register")} className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover-elevate">
            <Plus className="w-4 h-4 shrink-0" />등록
          </button>
        </div>
      </div>

      {/* 검색 (Search) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 shrink-0" />
        <Input
          placeholder="상품명, 코드 검색"
          value={linkSearchQuery}
          onChange={(e) => setLinkSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 상품 목록 (Product list with link payment actions) */}
      {linkProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Link2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-muted-foreground">등록된 결제링크 상품이 없습니다</p>
            <Button
              onClick={() => setActiveView("link-payment-register")}
              variant="outline"
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2 shrink-0" />상품 등록하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {linkProducts.map((product) => (
            <Card key={product.id} className="hover-elevate">
              <CardContent className="p-4 space-y-3">
                {/* 상품 정보 (Product info) */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    {product.category && (
                      <Badge variant="outline" className="text-xs mt-1">{product.category}</Badge>
                    )}
                  </div>
                  <p className="text-base font-bold tabular-nums shrink-0 ml-3">
                    {product.price.toLocaleString()}원
                  </p>
                </div>

                {/* 결제 링크 URL (Payment link URL) */}
                <div className="bg-gray-50 rounded-lg p-2.5 flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <p className="text-xs text-orange-600 truncate min-w-0">{product.linkPaymentUrl}</p>
                </div>

                {/* 3 액션 버튼 (3 action buttons: QR / SMS / Copy) */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleOpenQr(product)}
                  >
                    <QrCode className="w-3.5 h-3.5 mr-1 shrink-0" />QR코드
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleOpenSms(product)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1 shrink-0" />SMS전송
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleCopyLinkUrl(product.linkPaymentUrl!)}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1 shrink-0" />링크복사
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR 코드 다이얼로그 (QR Code Dialog) */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">QR 코드</DialogTitle>
            <DialogDescription className="text-center">
              고객이 이 QR코드를 스캔하면 결제 페이지로 이동합니다
            </DialogDescription>
          </DialogHeader>
          {selectedLinkProduct && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <QRCodeSVG
                  value={selectedLinkProduct.linkPaymentUrl || ""}
                  size={200}
                  level="M"
                />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{selectedLinkProduct.name}</p>
                <p className="text-lg font-bold tabular-nums">
                  {selectedLinkProduct.price.toLocaleString()}원
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-orange-600 break-all">{selectedLinkProduct.linkPaymentUrl}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleCopyLinkUrl(selectedLinkProduct.linkPaymentUrl!)}
              >
                <Copy className="w-4 h-4 mr-2 shrink-0" />링크 복사
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SMS 전송 다이얼로그 (SMS Send Dialog) */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>SMS 결제링크 전송</DialogTitle>
            <DialogDescription>
              고객에게 결제 링크를 SMS로 전송합니다
            </DialogDescription>
          </DialogHeader>
          {selectedLinkProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-semibold">{selectedLinkProduct.name}</p>
                <p className="text-base font-bold tabular-nums">
                  {selectedLinkProduct.price.toLocaleString()}원
                </p>
              </div>
              <div>
                <Label>수신자 이름</Label>
                <Input
                  placeholder="홍길동"
                  value={smsName}
                  onChange={(e) => setSmsName(e.target.value)}
                />
              </div>
              <div>
                <Label>전화번호 *</Label>
                <Input
                  placeholder="01012345678"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSendSms}
                disabled={!smsPhone}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Send className="w-4 h-4 mr-2 shrink-0" />문자 앱으로 전송
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // ============================
  // 링크결제 등록 뷰 (Link Payment Register View)
  // ============================
  const renderLinkPaymentRegister = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveView("link-payment")} className="p-2 rounded-lg hover-elevate">
          <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
        </button>
        <h2 className="text-lg font-bold">결제링크 등록</h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>상품명 *</Label>
            <Input
              placeholder="상품명을 입력하세요"
              value={linkRegName}
              onChange={(e) => setLinkRegName(e.target.value)}
            />
          </div>
          <div>
            <Label>가격 *</Label>
            <Input
              type="number"
              placeholder="0"
              value={linkRegPrice}
              onChange={(e) => setLinkRegPrice(e.target.value)}
              className="text-xl font-bold tabular-nums h-12 text-right"
            />
          </div>
          <div>
            <Label>상품코드</Label>
            <Input
              placeholder="자동 생성 (선택사항)"
              value={linkRegCode}
              onChange={(e) => setLinkRegCode(e.target.value)}
            />
          </div>
          <div>
            <Label>카테고리</Label>
            <Select value={linkRegCategory} onValueChange={setLinkRegCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="회원권">회원권</SelectItem>
                <SelectItem value="PT">PT</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-700">
              <Link2 className="w-3.5 h-3.5 inline mr-1 shrink-0" />
              등록 시 결제 링크가 자동으로 생성됩니다
            </p>
          </div>

          <Button
            onClick={handleRegisterLinkProduct}
            disabled={createLinkProductMutation.isPending}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            {createLinkProductMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />등록 중...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2 shrink-0" />상품 등록 + 결제링크 생성</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // ============================
  // PG 상품관리 뷰 (PG Product management view)
  // ============================
  const renderPgProducts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView("main")} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <h2 className="text-lg font-bold">상품관리</h2>
        </div>
        <Button size="sm" onClick={() => { resetProductForm(); setEditProduct(null); setShowProductForm(true); }}>
          <Plus className="w-4 h-4 mr-1 shrink-0" />등록
        </Button>
      </div>

      {pgProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">등록된 상품이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pgProducts.map((p) => (
            <Card key={p.id} className="hover-elevate">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.itemCode} · {p.category}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold tabular-nums">{p.price.toLocaleString()}원</span>
                  <button onClick={() => {
                    setEditProduct(p);
                    setProductName(p.name);
                    setProductPrice(p.price.toString());
                    setProductCode(p.itemCode);
                    setProductCategory(p.category || "기타");
                    setShowProductForm(true);
                  }} className="p-1.5 rounded hover-elevate">
                    <Edit className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button onClick={() => deleteProductMutation.mutate(p.id)} className="p-1.5 rounded hover-elevate">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 상품 등록/수정 다이얼로그 (Product add/edit dialog) */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? "상품 수정" : "상품 등록"}</DialogTitle>
            <DialogDescription className="sr-only">PG 결제용 상품 등록/수정</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>상품명 *</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="상품명" />
            </div>
            <div>
              <Label>가격 *</Label>
              <Input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>상품코드 *</Label>
              <Input value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="ITEM001" />
            </div>
            <div>
              <Label>카테고리</Label>
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="회원권">회원권</SelectItem>
                  <SelectItem value="PT">PT</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                const data = { name: productName, price: parseInt(productPrice), itemCode: productCode, category: productCategory };
                if (editProduct) {
                  updateProductMutation.mutate({ id: editProduct.id, data });
                } else {
                  createProductMutation.mutate(data);
                }
              }}
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
            >
              {editProduct ? "수정" : "등록"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ============================
  // PG 설정 뷰 (PG Settings view)
  // ============================
  const isSuperAdmin = user?.role === 'superadmin';

  const renderPgSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveView("main")} className="p-2 rounded-lg hover-elevate">
          <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
        </button>
        <h2 className="text-lg font-bold">PG 설정</h2>
      </div>

      {!isSuperAdmin && pgConfig?.pgServiceId && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-400">
            PG 설정은 관리자(Superadmin)가 관리합니다. 설정 변경이 필요하면 본사에 문의하세요.
          </p>
        </div>
      )}

      {isSuperAdmin && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-400">
            Superadmin 계정은 테스트 PG(M2103140)에 연결되어 있습니다.
            회사별 PG 설정은 홈 &gt; 회사 PG 관리에서 관리하세요.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>PG사</Label>
            <Input value="빌게이트 (Billgate)" disabled />
          </div>
          <div>
            <Label>SERVICE_ID (가맹점 ID)</Label>
            <Input
              placeholder="M2103140"
              value={pgServiceId}
              onChange={(e) => setPgServiceId(e.target.value)}
              disabled={!isSuperAdmin}
            />
          </div>
          <div>
            <Label>모드</Label>
            {isSuperAdmin ? (
              <Select value={pgMode} onValueChange={setPgMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">테스트</SelectItem>
                  <SelectItem value="production">실거래</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input value={pgMode === "production" ? "실거래" : "테스트"} disabled />
            )}
          </div>
          <div>
            <Label>API Key (암호화 키)</Label>
            <Input
              placeholder={pgConfig?.hasApiKey ? "설정됨" : "미설정"}
              value={pgApiKey}
              onChange={(e) => setPgApiKey(e.target.value)}
              type="password"
              disabled={!isSuperAdmin}
            />
          </div>
          <div>
            <Label>API IV</Label>
            <Input
              placeholder={pgConfig?.hasApiIv ? "설정됨" : "미설정"}
              value={pgApiIv}
              onChange={(e) => setPgApiIv(e.target.value)}
              type="password"
              disabled={!isSuperAdmin}
            />
          </div>
          {isSuperAdmin && (
            <Button
              className="w-full"
              onClick={() => configMutation.mutate({
                pgProvider: "billgate",
                pgServiceId: pgServiceId,
                pgMode: pgMode,
                pgApiKey: pgApiKey || undefined,
                pgApiIv: pgApiIv || undefined,
              })}
              disabled={configMutation.isPending}
            >
              {configMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />저장 중...</>
              ) : "설정 저장"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ============================
  // 입금현황 / 자료조회 / 현금영수증 / 고객센터 (Placeholder views)
  // ============================
  const renderPlaceholder = (title: string, icon: any, description: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveView("main")} className="p-2 rounded-lg hover-elevate">
          <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
        </button>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="text-center py-16">
        {icon}
        <p className="text-sm text-muted-foreground mt-3">{description}</p>
      </div>
    </div>
  );

  // ============================
  // 뷰 라우팅 (View routing)
  // ============================
  const renderContent = () => {
    switch (activeView) {
      case "main": return renderMain();
      case "pay": return renderPayView();
      case "transactions": return renderTransactions();
      case "transaction-detail": return renderTransactionDetail();
      case "link-payment": return renderLinkPayment();
      case "link-payment-register": return renderLinkPaymentRegister();
      case "pg-products": return renderPgProducts();
      case "pg-settings": return renderPgSettings();
      case "deposits": return renderPlaceholder("입금현황", <Banknote className="w-12 h-12 mx-auto text-gray-300" />, "가상계좌 입금 내역이 여기에 표시됩니다");
      case "search": return renderPlaceholder("자료조회", <Search className="w-12 h-12 mx-auto text-gray-300" />, "기간별 결제 데이터를 조회할 수 있습니다");
      case "cash-receipt": return renderPlaceholder("현금영수증", <Receipt className="w-12 h-12 mx-auto text-gray-300" />, "현금영수증 발행 기능이 여기에 표시됩니다");
      case "help": return renderPlaceholder("고객센터", <Headphones className="w-12 h-12 mx-auto text-gray-300" />, "빌게이트 기술지원: tech@billgate.net");
      case "kiosk": return <KioskPaymentView onBack={() => setActiveView("main")} franchiseId={(user as any)?.franchiseId || 1} />;
      default: return renderMain();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {renderContent()}
        <AppFooter variant="vertical" />
      </div>
    </div>
  );
}
