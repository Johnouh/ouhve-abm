// 🏪 키오스크 결제 뷰 (Kiosk Payment View)
// 🎯 Purpose: 상품 카테고리 탭 + 상품 그리드 + 결제 플로우 (수기/단말기)
// 📐 Layout: 모바일 뷰 (max-w-md)

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, ShoppingBag, CreditCard, Smartphone, QrCode,
  MessageSquare, Link2, Copy, Check, Loader2, ChevronLeft,
  ChevronRight, Monitor, Wifi, X, Dumbbell, Users as UsersIcon,
  Package, LogOut,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// PG 상품 타입 (pg_products 테이블 — Billgate PG 연동)
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

// 단말기 타입
interface Terminal {
  id: number;
  name: string;
  binNumber: string;
  status: string;
  description?: string;
}

// 키오스크 내부 화면 상태
type KioskScreen =
  | "product-list"     // 상품 목록 (카테고리 탭 + 그리드)
  | "product-detail"   // 상품 상세 + 결제 방식 선택
  | "manual-payment"   // 수기결제 (QR/SMS/카드/링크)
  | "terminal-select"  // 단말기 선택
  | "terminal-waiting" // 단말기 결제 대기 화면
  | "terminal-manage"; // 단말기 관리

const ITEMS_PER_PAGE = 6;

// 카테고리별 아이콘 매핑 (Category icon mapping)
// 카테고리 아이콘 — products/pgProducts 테이블 공통 기준
const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  "회원권": Dumbbell,
  "PT": UsersIcon,
  "개인PT": UsersIcon,
  "그룹수업": UsersIcon,
  "락커": Package,
  "기타": ShoppingBag,
};

interface KioskPaymentViewProps {
  onBack: () => void;
  franchiseId: number;
  kioskMode?: boolean; // 키오스크 전용 모드 — 단말기 결제만, 수기결제 숨김 (Kiosk-only mode — terminal payment only)
}

export default function KioskPaymentView({ onBack, franchiseId, kioskMode = false }: KioskPaymentViewProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 화면 상태 (Screen state)
  const [screen, setScreen] = useState<KioskScreen>("product-list");
  const [selectedProduct, setSelectedProduct] = useState<PgProduct | null>(null);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);

  // 상품 목록 상태 (Product list state)
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [currentPage, setCurrentPage] = useState(1);

  // 수기결제 상태 (Manual payment state)
  const [generatedLink, setGeneratedLink] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsName, setSmsName] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // 단말기 관리 상태 (Terminal management state)
  const [terminalForm, setTerminalForm] = useState({ name: "", binNumber: "", description: "" });
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [showTerminalForm, setShowTerminalForm] = useState(false);

  // 데이터 페칭 — PG 상품 (Data fetching — PG products for Billgate integration)
  const { data: pgProducts = [], isLoading: productsLoading } = useQuery<PgProduct[]>({
    queryKey: ["/api/pg/products"],
  });

  const { data: terminals = [], isLoading: terminalsLoading } = useQuery<Terminal[]>({
    queryKey: ["/api/terminals"],
  });

  // 활성 상품만 필터 (Filter active PG products only)
  const activeProducts = useMemo(() =>
    pgProducts.filter(p => p.isActive),
    [pgProducts]
  );

  // 카테고리 목록 추출 (Extract category list)
  const categories = useMemo(() => {
    const cats = new Set(activeProducts.map(p => p.category || "기타"));
    return ["전체", ...Array.from(cats)];
  }, [activeProducts]);

  // 카테고리 필터링 + 페이지네이션 (Category filtering + pagination)
  const filteredProducts = useMemo(() => {
    if (activeCategory === "전체") return activeProducts;
    return activeProducts.filter(p => (p.category || "기타") === activeCategory);
  }, [activeProducts, activeCategory]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 카테고리 변경 시 페이지 초기화
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  // 상품 선택 — kioskMode 시 단말기 선택 화면으로 바로 이동 (Product selection — jump to terminal-select in kiosk mode)
  const handleProductClick = (product: PgProduct) => {
    setSelectedProduct(product);
    setScreen(kioskMode ? "terminal-select" : "product-detail");
  };

  // ============================
  // 결제 관련 뮤테이션 (Payment mutations)
  // ============================

  // 링크결제 생성 (Create link payment)
  const linkMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pg/link", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedLink(data.linkUrl);
      toast({ title: "결제 링크가 생성되었습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "링크 생성 실패", description: error.message, variant: "destructive" });
    },
  });

  // PG 결제 준비 (Prepare PG payment)
  const prepareMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pg/prepare", data);
      return res.json();
    },
    onSuccess: (data) => {
      openBillgatePayment(data);
    },
    onError: (error: Error) => {
      toast({ title: "결제 준비 실패", description: error.message, variant: "destructive" });
    },
  });

  // SMS 발송 없음 — sms: URI 스킴으로 기기 문자 앱 오픈 (No API call — opens native SMS app)

  // 단말기 CRUD 뮤테이션 (Terminal CRUD mutations)
  const createTerminalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/terminals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminals"] });
      toast({ title: "단말기가 등록되었습니다" });
      resetTerminalForm();
    },
    onError: (error: Error) => {
      toast({ title: "단말기 등록 실패", description: error.message, variant: "destructive" });
    },
  });

  const updateTerminalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/terminals/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminals"] });
      toast({ title: "단말기가 수정되었습니다" });
      resetTerminalForm();
    },
  });

  const deleteTerminalMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/terminals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminals"] });
      toast({ title: "단말기가 삭제되었습니다" });
    },
  });

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
  const openBillgatePayment = (paymentData: any) => {
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
      USER_ID: "kiosk_guest",
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
      form.submit();
    } else {
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
  };

  // 수기결제 시작 — 결제 링크 생성 (Start manual payment — generate link)
  const handleManualPayment = () => {
    if (!selectedProduct) return;
    linkMutation.mutate({
      amount: selectedProduct.price,
      itemName: selectedProduct.name,
      itemCode: selectedProduct.itemCode,
      userName: "현장 고객",
      userPhone: "",
    });
    setScreen("manual-payment");
  };

  // 카드결제 — Billgate PG API 호출 (Card payment — Billgate PG API call)
  const handleCardPayment = () => {
    if (!selectedProduct) return;
    prepareMutation.mutate({
      amount: selectedProduct.price,
      itemName: selectedProduct.name,
      itemCode: selectedProduct.itemCode,
      userName: "현장 고객",
      userPhone: "",
      serviceCode: "0900", // 0900 = 신용카드 (Billgate service code)
    });
  };

  // 링크 복사 (Copy link)
  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      toast({ title: "링크가 복사되었습니다" });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast({ title: "복사 실패", variant: "destructive" });
    }
  };

  // SMS 전송 — sms: URI 스킴 (Opens native SMS app with pre-filled message)
  const handleSendSms = () => {
    if (!generatedLink || !smsPhone || !selectedProduct) return;
    const formattedAmount = selectedProduct.price.toLocaleString("ko-KR");
    const namePrefix = smsName ? `${smsName} 고객님, ` : "";
    const message = `${namePrefix}${selectedProduct.name}에 대한 ${formattedAmount}원 결제 URL입니다. 아래 URL에 접속하여 결제를 진행해주세요.\n${generatedLink}`;
    const phone = smsPhone.replace(/-/g, "");
    // iOS: sms:번호&body=메시지, Android: sms:번호?body=메시지
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const smsUri = `sms:${phone}${isIOS ? "&" : "?"}body=${encodeURIComponent(message)}`;
    window.location.href = smsUri;
    toast({ title: "문자 앱이 열렸습니다", description: "전송 버튼을 눌러주세요" });
    setShowSms(false);
    setSmsPhone("");
    setSmsName("");
  };

  // 단말기 폼 초기화
  const resetTerminalForm = () => {
    setTerminalForm({ name: "", binNumber: "", description: "" });
    setEditingTerminal(null);
    setShowTerminalForm(false);
  };

  // 단말기 저장
  const handleSaveTerminal = () => {
    if (!terminalForm.name || !terminalForm.binNumber) {
      toast({ title: "이름과 BIN번호를 입력해주세요", variant: "destructive" });
      return;
    }
    if (editingTerminal) {
      updateTerminalMutation.mutate({ id: editingTerminal.id, data: terminalForm });
    } else {
      createTerminalMutation.mutate(terminalForm);
    }
  };

  // 단말기 수정 시작
  const handleEditTerminal = (t: Terminal) => {
    setEditingTerminal(t);
    setTerminalForm({ name: t.name, binNumber: t.binNumber, description: t.description || "" });
    setShowTerminalForm(true);
  };

  // 가격 포맷 (Format price)
  const formatPrice = (price: number) => price.toLocaleString("ko-KR");


  // ============================
  // 상품 목록 화면 (Product List Screen)
  // ============================
  const renderProductList = () => (
    <div className="space-y-4">
      {/* 헤더 (Header) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!kioskMode && (
            <button onClick={onBack} className="p-2 rounded-lg hover-elevate">
              <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">키오스크 결제</h1>
            <p className="text-xs text-muted-foreground truncate">상품을 선택하여 결제를 진행하세요</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScreen("terminal-manage")}
            className="p-2 rounded-lg hover-elevate"
            title="단말기 관리"
          >
            <Monitor className="w-5 h-5 text-gray-500 shrink-0" />
          </button>
          {kioskMode && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover-elevate"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5 text-gray-500 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 탭 (Category tabs) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover-elevate"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 상품 그리드 (Product grid) */}
      {productsLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-28 w-full" />
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-muted-foreground">등록된 상품이 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">관리 페이지에서 상품을 추가해주세요</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setLocation("/")}
          >
            <ShoppingBag className="w-4 h-4 mr-2 shrink-0" />
            상품 관리 페이지로 이동
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {paginatedProducts.map((product) => {
            const cat = product.category || "기타";
            const IconComp = CATEGORY_ICONS[cat] || Package;
            return (
              <Card
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="overflow-hidden cursor-pointer hover-elevate transition-all"
              >
                {/* 상품 이미지 영역 — 카테고리 아이콘으로 대체 */}
                <div className="h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <IconComp className="w-10 h-10 text-gray-300 shrink-0" />
                </div>
                <CardContent className="p-3 space-y-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-bold text-orange-600 tabular-nums">
                      {formatPrice(product.price)}<span className="text-xs font-normal">원</span>
                    </p>
                    <Badge variant="outline" className="text-[10px] shrink-0">{cat}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 (Pagination) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover-elevate disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                currentPage === page
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover-elevate"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover-elevate disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );

  // ============================
  // 상품 상세 화면 (Product Detail Screen)
  // ============================
  const renderProductDetail = () => {
    if (!selectedProduct) return null;
    const cat = selectedProduct.category || "기타";
    const IconComp = CATEGORY_ICONS[cat] || Package;

    return (
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("product-list")} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate">상품 상세</h1>
        </div>

        {/* 상품 정보 카드 */}
        <Card className="overflow-hidden">
          <div className="h-36 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
            <IconComp className="w-14 h-14 text-orange-300 shrink-0" />
          </div>
          <CardContent className="p-4 space-y-3">
            <div>
              <Badge variant="outline" className="text-xs mb-2">{cat}</Badge>
              <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
              {selectedProduct.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedProduct.description}</p>
              )}
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-xs text-muted-foreground">상품코드: {selectedProduct.itemCode}</p>
              <p className="text-2xl font-bold text-orange-600 tabular-nums">
                {formatPrice(selectedProduct.price)}<span className="text-sm font-normal">원</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 결제 방식 선택 (Payment method selection) */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">결제 방식을 선택하세요</p>

          <button
            onClick={handleManualPayment}
            className="w-full rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-md hover-elevate active-elevate-2 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-primary-foreground shrink-0" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-base">수기결제</p>
                <p className="text-xs text-primary-foreground/80 mt-0.5">QR / SMS / 카드결제 / 링크복사</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setScreen("terminal-select")}
            className="w-full rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 p-5 text-white shadow-md hover-elevate transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Monitor className="w-6 h-6 text-white shrink-0" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-base">단말기결제</p>
                <p className="text-xs text-gray-300 mt-0.5">등록된 단말기로 카드 결제</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  };

  // ============================
  // 수기결제 화면 (Manual Payment Screen)
  // ============================
  const renderManualPayment = () => {
    if (!selectedProduct) return null;

    return (
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setScreen("product-detail"); setGeneratedLink(""); setShowQr(false); setShowSms(false); }} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate">수기결제</h1>
        </div>

        {/* 결제 요약 (Payment summary) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedProduct.category || "기타"}</p>
              </div>
              <p className="text-xl font-bold text-orange-600 tabular-nums shrink-0">
                {formatPrice(selectedProduct.price)}<span className="text-xs font-normal">원</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 결제 링크 생성 상태 */}
        {linkMutation.isPending && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500 shrink-0" />
            <span className="text-sm text-muted-foreground">결제 링크 생성 중...</span>
          </div>
        )}

        {/* 4가지 결제 기능 버튼 (4 payment action buttons) */}
        <div className="grid grid-cols-2 gap-3">
          {/* QR 결제 */}
          <button
            onClick={() => { setShowQr(!showQr); setShowSms(false); }}
            disabled={!generatedLink}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border border-gray-200 bg-white hover-elevate transition-all disabled:opacity-40"
          >
            <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-orange-600 shrink-0" />
            </div>
            <span className="text-sm font-medium text-gray-700">QR결제</span>
          </button>

          {/* SMS 전송 */}
          <button
            onClick={() => { setShowSms(!showSms); setShowQr(false); }}
            disabled={!generatedLink}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border border-gray-200 bg-white hover-elevate transition-all disabled:opacity-40"
          >
            <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600 shrink-0" />
            </div>
            <span className="text-sm font-medium text-gray-700">SMS전송</span>
          </button>

          {/* 카드결제 */}
          <button
            onClick={handleCardPayment}
            disabled={prepareMutation.isPending}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border border-gray-200 bg-white hover-elevate transition-all disabled:opacity-40"
          >
            <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center">
              {prepareMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin text-orange-600 shrink-0" />
              ) : (
                <CreditCard className="w-5 h-5 text-orange-600 shrink-0" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">카드결제</span>
          </button>

          {/* 링크복사 */}
          <button
            onClick={handleCopyLink}
            disabled={!generatedLink}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border border-gray-200 bg-white hover-elevate transition-all disabled:opacity-40"
          >
            <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center">
              {linkCopied ? (
                <Check className="w-5 h-5 text-green-600 shrink-0" />
              ) : (
                <Copy className="w-5 h-5 text-orange-600 shrink-0" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {linkCopied ? "복사됨" : "링크복사"}
            </span>
          </button>
        </div>

        {/* QR 코드 표시 영역 */}
        {showQr && generatedLink && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-gray-700">QR코드를 스캔하여 결제하세요</p>
              <div className="bg-white p-3 rounded-xl border">
                <QRCodeSVG value={generatedLink} size={180} />
              </div>
              <p className="text-xs text-muted-foreground text-center break-all">{generatedLink}</p>
            </CardContent>
          </Card>
        )}

        {/* SMS 전송 폼 */}
        {showSms && generatedLink && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">SMS로 결제 링크 전송</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">수신자 이름</Label>
                  <Input
                    value={smsName}
                    onChange={(e) => setSmsName(e.target.value)}
                    placeholder="이름 입력"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">전화번호</Label>
                  <Input
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={handleSendSms}
                disabled={!smsPhone}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                문자 앱으로 전송
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ============================
  // 단말기 선택 화면 (Terminal Select Screen)
  // ============================
  const renderTerminalSelect = () => {
    const activeTerminals = terminals.filter(t => t.status === "활성");

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen(kioskMode ? "product-list" : "product-detail")} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate">단말기 선택</h1>
        </div>

        {/* 상품 요약 */}
        {selectedProduct && (
          <Card>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 truncate">{selectedProduct.name}</span>
              <span className="text-sm font-bold text-orange-600 tabular-nums shrink-0">
                {formatPrice(selectedProduct.price)}원
              </span>
            </CardContent>
          </Card>
        )}

        {terminalsLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : activeTerminals.length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-muted-foreground">등록된 단말기가 없습니다</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => setScreen("terminal-manage")}
            >
              단말기 등록하기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTerminals.map((terminal) => (
              <button
                key={terminal.id}
                onClick={() => {
                  setSelectedTerminal(terminal);
                  setScreen("terminal-waiting");
                }}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 hover-elevate transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <Monitor className="w-5 h-5 text-gray-600 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{terminal.name}</p>
                    <p className="text-xs text-muted-foreground truncate">BIN: {terminal.binNumber}</p>
                  </div>
                  <Badge className="bg-green-50 text-green-600 border-green-200 shrink-0">활성</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================
  // 단말기 결제 대기 화면 (Terminal Waiting Screen)
  // ============================
  const renderTerminalWaiting = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      {/* 카드 일러스트 + 애니메이션 */}
      <div className="relative">
        <div className="w-32 h-44 rounded-2xl bg-gradient-to-b from-gray-800 to-orange-900 shadow-xl flex items-center justify-center">
          <div className="w-10 h-7 rounded bg-yellow-400 absolute top-5 left-5" />
          <Wifi className="w-10 h-10 text-white/40 mt-8 shrink-0" />
        </div>
        {/* 웨이브 애니메이션 */}
        <div className="flex gap-2 items-end justify-center mt-4">
          <div className="w-2 h-5 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-8 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-11 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">결제 대기중입니다</h2>
        <p className="text-sm text-muted-foreground">
          카드를 단말기에 삽입하거나 터치해주세요
        </p>
        {selectedTerminal && (
          <p className="text-xs text-muted-foreground">
            단말기: {selectedTerminal.name} (BIN: {selectedTerminal.binNumber})
          </p>
        )}
        {selectedProduct && (
          <p className="text-lg font-bold text-orange-600 tabular-nums mt-2">
            {formatPrice(selectedProduct.price)}원
          </p>
        )}
      </div>

      <Button
        variant="outline"
        onClick={() => {
          setSelectedTerminal(null);
          setScreen("terminal-select");
        }}
        className="mt-4"
      >
        <X className="w-4 h-4 mr-2 shrink-0" />
        결제 취소
      </Button>
    </div>
  );

  // ============================
  // 단말기 관리 화면 (Terminal Management Screen)
  // ============================
  const renderTerminalManage = () => (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("product-list")} className="p-2 rounded-lg hover-elevate">
            <ArrowLeft className="w-5 h-5 text-gray-600 shrink-0" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate">단말기 관리</h1>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetTerminalForm();
            setShowTerminalForm(true);
          }}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <span className="text-xs">단말기 추가</span>
        </Button>
      </div>

      {/* 등록/수정 폼 */}
      {showTerminalForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              {editingTerminal ? "단말기 수정" : "새 단말기 등록"}
            </p>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">단말기 이름</Label>
                <Input
                  value={terminalForm.name}
                  onChange={(e) => setTerminalForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="예: 카운터 1번 단말기"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">BIN 번호</Label>
                <Input
                  value={terminalForm.binNumber}
                  onChange={(e) => setTerminalForm(f => ({ ...f, binNumber: e.target.value }))}
                  placeholder="단말기 고유 식별번호"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">설명 (선택)</Label>
                <Input
                  value={terminalForm.description}
                  onChange={(e) => setTerminalForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="메모"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveTerminal}
                disabled={createTerminalMutation.isPending || updateTerminalMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {(createTerminalMutation.isPending || updateTerminalMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" />
                )}
                {editingTerminal ? "수정" : "등록"}
              </Button>
              <Button variant="outline" onClick={resetTerminalForm} className="flex-1">
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 단말기 목록 */}
      {terminalsLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : terminals.length === 0 ? (
        <div className="text-center py-12">
          <Monitor className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-muted-foreground">등록된 단말기가 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">상단의 "단말기 추가" 버튼으로 등록하세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {terminals.map((terminal) => (
            <Card key={terminal.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Monitor className="w-5 h-5 text-gray-600 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{terminal.name}</p>
                      <p className="text-xs text-muted-foreground truncate">BIN: {terminal.binNumber}</p>
                      {terminal.description && (
                        <p className="text-xs text-muted-foreground truncate">{terminal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={terminal.status === "활성"
                      ? "bg-green-50 text-green-600 border-green-200"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                    }>
                      {terminal.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleEditTerminal(terminal)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      updateTerminalMutation.mutate({
                        id: terminal.id,
                        data: { status: terminal.status === "활성" ? "비활성" : "활성" },
                      });
                    }}
                  >
                    {terminal.status === "활성" ? "비활성화" : "활성화"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("이 단말기를 삭제하시겠습니까?")) {
                        deleteTerminalMutation.mutate(terminal.id);
                      }
                    }}
                  >
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ============================
  // 화면 라우팅 (Screen routing)
  // ============================
  const renderScreen = () => {
    switch (screen) {
      case "product-list": return renderProductList();
      case "product-detail": return renderProductDetail();
      case "manual-payment": return renderManualPayment();
      case "terminal-select": return renderTerminalSelect();
      case "terminal-waiting": return renderTerminalWaiting();
      case "terminal-manage": return renderTerminalManage();
      default: return renderProductList();
    }
  };

  return renderScreen();
}
