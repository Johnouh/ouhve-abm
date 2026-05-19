import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TriangleAlert,
  ArrowLeft,
  AlertTriangle,
  Building2,
  Store,
  Dumbbell,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CustomDialog } from "@/components/ui/custom-dialog";

// Registration type
type RegType = "franchise" | "branch" | "trainer" | null;
type FranchiseStep = "terms" | "info" | "done";
type BranchStep = "code" | "confirm" | "terms" | "info" | "done";

// Schemas
const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

const franchiseInfoSchema = z.object({
  businessName: z.string().min(1, "사업자명을 입력하세요"),
  ownerName: z.string().min(1, "대표자명을 입력하세요"),
  ownerPhone: z.string().min(10, "연락처는 10자 이상이어야 합니다").regex(/^[0-9-]+$/, "숫자와 하이픈만 입력 가능합니다"),
  username: z.string().min(3, "아이디는 3자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, "영문과 숫자를 포함해야 합니다"),
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력하세요"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

const branchInfoSchema = z.object({
  branchName: z.string().min(1, "지점명을 입력하세요"),
  managerName: z.string().min(1, "담당자명을 입력하세요"),
  managerPhone: z.string().min(10, "연락처는 10자 이상이어야 합니다").regex(/^[0-9-]+$/, "숫자와 하이픈만 입력 가능합니다"),
  username: z.string().min(3, "아이디는 3자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, "영문과 숫자를 포함해야 합니다"),
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력하세요"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type FranchiseFormData = z.infer<typeof franchiseInfoSchema>;
type BranchFormData = z.infer<typeof branchInfoSchema>;

// Shared card wrapper with original design
function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="bg-white rounded-2xl shadow-2xl border-0 overflow-hidden">
      <CardAccentLine />
      <div className="bg-gradient-to-r from-primary to-primary/80 p-1">
        <div className="bg-white rounded-2xl">
          <CardContent className="p-8 space-y-6">
            {children}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

// OUHVE ABM logo header
function LogoHeader({ subtitle, onBack }: { subtitle: string; onBack?: () => void }) {
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center space-x-2 mb-4 relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute left-0 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="text-2xl font-bold tracking-tight">
          <span className="text-gray-900">OUHVE</span>
          <span className="text-primary"> ABM</span>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">{subtitle}</h2>
    </div>
  );
}

// Progress bar
function ProgressBar({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <>
      <div className="flex items-center space-x-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full ${
              i < step
                ? "bg-gradient-to-r from-primary to-primary/80"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </>
  );
}

// Footer — 사업자 정보는 OUHVE 법인 확정 시 채움
function AuthFooter() {
  return (
    <div className="text-center pt-6 space-y-1">
      <p className="text-[10px] text-gray-300 mt-1">
        &copy; {new Date().getFullYear()} OUHVE ABM. All rights reserved.
      </p>
    </div>
  );
}

// Styled input class
const inputClass = "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary/40 transition-all duration-200";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();

  // Main state
  const [showRegister, setShowRegister] = useState(false);
  const [regType, setRegType] = useState<RegType>(null);

  // Franchise registration
  const [franchiseStep, setFranchiseStep] = useState<FranchiseStep>("terms");
  const [franchiseTermsAgreed, setFranchiseTermsAgreed] = useState({
    service: false, privacy: false, personalInfo: false, marketing: false,
  });

  // Branch registration
  const [branchStep, setBranchStep] = useState<BranchStep>("code");
  const [branchCode, setBranchCode] = useState("");
  const [verifiedFranchise, setVerifiedFranchise] = useState<{ id: number; name: string; businessName: string } | null>(null);
  const [branchTermsAgreed, setBranchTermsAgreed] = useState({
    service: false, privacy: false, personalInfo: false, marketing: false,
  });

  // Alert dialog
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean; title: string; description: string;
  }>({ isOpen: false, title: "", description: "" });

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // Franchise form
  const franchiseForm = useForm<FranchiseFormData>({
    resolver: zodResolver(franchiseInfoSchema),
    defaultValues: { businessName: "", ownerName: "", ownerPhone: "", username: "", password: "", confirmPassword: "" },
  });

  // Branch form
  const branchForm = useForm<BranchFormData>({
    resolver: zodResolver(branchInfoSchema),
    defaultValues: { branchName: "", managerName: "", managerPhone: "", username: "", password: "", confirmPassword: "" },
  });

  // Redirect if logged in
  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  // Mutations
  const franchiseRegMutation = useMutation({
    mutationFn: async (data: FranchiseFormData) => {
      const res = await apiRequest("POST", "/api/auth/register/franchise", {
        username: data.username, password: data.password,
        businessName: data.businessName, ownerName: data.ownerName, ownerPhone: data.ownerPhone,
      });
      return res.json();
    },
    onSuccess: () => setFranchiseStep("done"),
    onError: (err: Error) => {
      setAlertDialog({ isOpen: true, title: "가입 실패", description: err.message });
    },
  });

  const branchRegMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      const res = await apiRequest("POST", "/api/auth/register/branch", {
        username: data.username, password: data.password,
        franchiseCode: branchCode, branchName: data.branchName,
        managerName: data.managerName, managerPhone: data.managerPhone,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/user"], data);
      setBranchStep("done");
    },
    onError: (err: Error) => {
      setAlertDialog({ isOpen: true, title: "가입 실패", description: err.message });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("GET", `/api/franchise/verify-code/${code}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      setVerifiedFranchise(data);
      setBranchStep("confirm");
    },
    onError: () => {
      setAlertDialog({ isOpen: true, title: "코드 확인 실패", description: "유효하지 않은 프랜차이즈 코드입니다." });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const resetRegistration = () => {
    setRegType(null);
    setFranchiseStep("terms");
    setFranchiseTermsAgreed({ service: false, privacy: false, personalInfo: false, marketing: false });
    franchiseForm.reset();
    setBranchStep("code");
    setBranchCode("");
    setVerifiedFranchise(null);
    setBranchTermsAgreed({ service: false, privacy: false, personalInfo: false, marketing: false });
    branchForm.reset();
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
    resetRegistration();
  };

  const loginUsername = loginForm.watch("username");
  const loginPassword = loginForm.watch("password");
  const isLoginFormValid = loginUsername && loginPassword;

  const franchiseAllRequired = franchiseTermsAgreed.service && franchiseTermsAgreed.privacy && franchiseTermsAgreed.personalInfo;
  const branchAllRequired = branchTermsAgreed.service && branchTermsAgreed.privacy && branchTermsAgreed.personalInfo;

  // Shared terms agreement UI
  const renderTermsContent = (
    agreed: typeof franchiseTermsAgreed,
    setAgreed: React.Dispatch<React.SetStateAction<typeof franchiseTermsAgreed>>,
    allRequired: boolean,
    onNext: () => void,
    onBack: () => void,
    step: number,
    total: number,
    labels: string[],
  ) => (
    <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <AuthCard>
          <LogoHeader subtitle="회원가입" onBack={onBack} />
          <ProgressBar step={step} total={total} labels={labels} />

          <div className="space-y-4">
            <div className="border-b border-primary/20 pb-3">
              <h3 className="text-lg font-semibold text-gray-900">약관 동의</h3>
              <p className="text-sm text-gray-600 mt-1">서비스 이용을 위해 필요한 약관에 동의해주세요</p>
            </div>

            {/* All terms */}
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
              <Checkbox
                id="all-terms"
                checked={allRequired && agreed.marketing}
                onCheckedChange={(checked) => {
                  const v = checked === true;
                  setAgreed({ service: v, privacy: v, personalInfo: v, marketing: v });
                }}
                className="border-2 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="all-terms" className="text-sm font-semibold text-gray-900 cursor-pointer">
                모든 약관에 동의 합니다
              </Label>
            </div>

            <div className="space-y-3">
              {[
                { id: "service", label: "만 14세 이상입니다.", required: true, key: "service" as const },
                { id: "privacy", label: "이용약관 동의", required: true, key: "privacy" as const, showLink: true },
                { id: "personalInfo", label: "개인정보 수집 및 이용 동의서", required: true, key: "personalInfo" as const, showLink: true },
                { id: "marketing", label: "마케팅 정보 수신 동의", required: false, key: "marketing" as const },
              ].map((term) => (
                <div key={term.id} className="flex items-center space-x-3 p-3 rounded-lg hover-elevate">
                  <Checkbox
                    id={term.id}
                    checked={agreed[term.key]}
                    onCheckedChange={(checked) =>
                      setAgreed((prev) => ({ ...prev, [term.key]: checked === true }))
                    }
                    className="border-2 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor={term.id} className="text-sm text-gray-700 flex-1 cursor-pointer">
                    <span className="font-medium">{term.label}</span>{" "}
                    <span className={term.required ? "text-red-500 font-bold" : "text-gray-500"}>
                      ({term.required ? "필수" : "선택"})
                    </span>
                  </Label>
                  {term.showLink && (
                    <button className="text-primary text-sm hover:text-primary font-medium hover:underline">
                      전문 보기
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={onNext}
            className={`w-full py-4 font-semibold transition-all duration-200 rounded-xl text-lg ${
              allRequired
                ? "bg-gradient-to-r from-primary to-primary/80 hover-elevate text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!allRequired}
          >
            다음 단계
          </Button>

          <AuthFooter />
        </AuthCard>
      </div>
    </div>
  );

  // ===== REGISTRATION TYPE SELECTION =====
  if (showRegister && regType === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <AuthCard>
            <LogoHeader subtitle="회원가입" onBack={handleBackToLogin} />
            <p className="text-sm text-gray-600 text-center">가입 유형을 선택해주세요</p>

            <div className="space-y-3">
              {/* Franchise */}
              <button
                onClick={() => setRegType("franchise")}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-primary/40 hover-elevate hover:shadow-md transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">프랜차이즈 가입</div>
                    <div className="text-sm text-gray-500 group-hover:text-primary transition-colors">새로운 프랜차이즈를 등록합니다</div>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary rotate-180 transition-all duration-200 group-hover:translate-x-1 shrink-0" />
              </button>

              {/* Branch */}
              <button
                onClick={() => setRegType("branch")}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-primary/40 hover-elevate hover:shadow-md transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">지점 가입</div>
                    <div className="text-sm text-gray-500 group-hover:text-primary transition-colors">기존 프랜차이즈의 지점을 등록합니다</div>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary rotate-180 transition-all duration-200 group-hover:translate-x-1 shrink-0" />
              </button>

              {/* Trainer - Coming Soon */}
              <div className="w-full p-4 border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                    <Dumbbell className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-500">트레이너 가입</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Coming Soon</Badge>
                    </div>
                    <div className="text-sm text-gray-400">트레이너로 등록합니다</div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full py-4 font-medium border-2 border-primary/20 text-primary hover-elevate hover:border-primary/40 transition-all duration-200 rounded-xl"
              onClick={handleBackToLogin}
            >
              이미 계정이 있으신가요? 로그인
            </Button>

            <AuthFooter />
          </AuthCard>
        </div>
      </div>
    );
  }

  // ===== FRANCHISE FLOW =====
  if (showRegister && regType === "franchise") {
    // Terms
    if (franchiseStep === "terms") {
      return renderTermsContent(
        franchiseTermsAgreed, setFranchiseTermsAgreed, franchiseAllRequired,
        () => setFranchiseStep("info"), () => setRegType(null),
        1, 3, ["약관동의", "정보입력", "완료"],
      );
    }

    // Info
    if (franchiseStep === "info") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            <AuthCard>
              <LogoHeader subtitle="프랜차이즈 정보 입력" onBack={() => setFranchiseStep("terms")} />
              <ProgressBar step={2} total={3} labels={["약관동의", "정보입력", "완료"]} />

              <div className="space-y-4">
                <div className="border-b border-primary/20 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">사업자 정보</h3>
                  <p className="text-sm text-gray-600 mt-1">프랜차이즈 등록을 위한 정보를 입력해주세요</p>
                </div>

                <form onSubmit={franchiseForm.handleSubmit((data) => franchiseRegMutation.mutate(data))} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">사업자명</Label>
                    <Input className={inputClass} placeholder="예: OO 피트니스" {...franchiseForm.register("businessName")} />
                    {franchiseForm.formState.errors.businessName && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{franchiseForm.formState.errors.businessName.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">대표자명</Label>
                    <Input className={inputClass} placeholder="홍길동" {...franchiseForm.register("ownerName")} />
                    {franchiseForm.formState.errors.ownerName && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{franchiseForm.formState.errors.ownerName.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">대표자 연락처</Label>
                    <Input className={inputClass} placeholder="010-1234-5678" {...franchiseForm.register("ownerPhone")} />
                    {franchiseForm.formState.errors.ownerPhone && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{franchiseForm.formState.errors.ownerPhone.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="border-t border-primary/20 pt-3">
                    <p className="text-sm text-gray-600">로그인 계정 정보</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">아이디</Label>
                    <Input className={inputClass} placeholder="아이디 (3자 이상)" {...franchiseForm.register("username")} />
                    {franchiseForm.formState.errors.username && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{franchiseForm.formState.errors.username.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">비밀번호</Label>
                    <Input type="password" className={inputClass} placeholder="비밀번호 (6자 이상, 영문+숫자)" {...franchiseForm.register("password")} />
                    {franchiseForm.formState.errors.password && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{franchiseForm.formState.errors.password.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">비밀번호 확인</Label>
                    <Input type="password" className={inputClass} placeholder="비밀번호 확인" {...franchiseForm.register("confirmPassword")} />
                    {franchiseForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{franchiseForm.formState.errors.confirmPassword.message}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 hover-elevate text-white font-semibold transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                    disabled={franchiseRegMutation.isPending}
                  >
                    {franchiseRegMutation.isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />처리 중...</>
                    ) : "가입 신청"}
                  </Button>
                </form>
              </div>

              <AuthFooter />
            </AuthCard>
          </div>
        </div>
      );
    }

    // Done
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <AuthCard>
            <ProgressBar step={3} total={3} labels={["약관동의", "정보입력", "완료"]} />

            <div className="text-center space-y-4 py-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">가입 신청 완료</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                프랜차이즈 가입 신청이 접수되었습니다.<br />
                관리자 승인 후 로그인이 가능합니다.
              </p>
            </div>

            <Button
              onClick={handleBackToLogin}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 hover-elevate text-white font-semibold transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
            >
              로그인 페이지로
            </Button>

            <AuthFooter />
          </AuthCard>
        </div>
      </div>
    );
  }

  // ===== BRANCH FLOW =====
  if (showRegister && regType === "branch") {
    // Code input
    if (branchStep === "code") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            <AuthCard>
              <LogoHeader subtitle="프랜차이즈 코드 입력" onBack={() => setRegType(null)} />

              <div className="space-y-4">
                <div className="border-b border-primary/20 pb-3">
                  <p className="text-sm text-gray-600">소속 프랜차이즈에서 발급받은 코드를 입력하세요.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">프랜차이즈 코드</Label>
                  <Input
                    className={inputClass}
                    placeholder="예: GL-A1B2C3"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                  />
                </div>

                <Button
                  onClick={() => verifyCodeMutation.mutate(branchCode)}
                  disabled={!branchCode.trim() || verifyCodeMutation.isPending}
                  className={`w-full py-4 font-semibold transition-all duration-200 rounded-xl text-lg ${
                    branchCode.trim()
                      ? "bg-gradient-to-r from-primary to-primary/80 hover-elevate text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {verifyCodeMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />확인 중...</>
                  ) : (
                    <><Search className="mr-2 h-5 w-5 shrink-0" />코드 확인</>
                  )}
                </Button>
              </div>

              <AuthFooter />
            </AuthCard>
          </div>
        </div>
      );
    }

    // Confirm franchise
    if (branchStep === "confirm") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            <AuthCard>
              <LogoHeader subtitle="프랜차이즈 확인" onBack={() => { setBranchStep("code"); setVerifiedFranchise(null); }} />

              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{verifiedFranchise?.name}</div>
                  <div className="text-sm text-gray-600 truncate">{verifiedFranchise?.businessName}</div>
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                위 프랜차이즈의 지점으로 가입합니다.<br />
                맞으시면 다음을 눌러주세요.
              </p>

              <Button
                onClick={() => setBranchStep("terms")}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 hover-elevate text-white font-semibold transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
              >
                다음 단계
              </Button>

              <AuthFooter />
            </AuthCard>
          </div>
        </div>
      );
    }

    // Terms
    if (branchStep === "terms") {
      return renderTermsContent(
        branchTermsAgreed, setBranchTermsAgreed, branchAllRequired,
        () => setBranchStep("info"), () => setBranchStep("confirm"),
        2, 4, ["코드입력", "약관동의", "정보입력", "완료"],
      );
    }

    // Info
    if (branchStep === "info") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            <AuthCard>
              <LogoHeader subtitle="지점 정보 입력" onBack={() => setBranchStep("terms")} />
              <ProgressBar step={3} total={4} labels={["코드입력", "약관동의", "정보입력", "완료"]} />

              {/* Franchise info badge */}
              <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-primary truncate">{verifiedFranchise?.name}</span>
              </div>

              <div className="space-y-4">
                <div className="border-b border-primary/20 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900">지점 정보</h3>
                  <p className="text-sm text-gray-600 mt-1">지점 등록을 위한 정보를 입력해주세요</p>
                </div>

                <form onSubmit={branchForm.handleSubmit((data) => branchRegMutation.mutate(data))} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">지점명</Label>
                    <Input className={inputClass} placeholder="예: 강남점" {...branchForm.register("branchName")} />
                    {branchForm.formState.errors.branchName && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{branchForm.formState.errors.branchName.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">담당자명</Label>
                    <Input className={inputClass} placeholder="홍길동" {...branchForm.register("managerName")} />
                    {branchForm.formState.errors.managerName && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{branchForm.formState.errors.managerName.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">담당자 연락처</Label>
                    <Input className={inputClass} placeholder="010-1234-5678" {...branchForm.register("managerPhone")} />
                    {branchForm.formState.errors.managerPhone && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{branchForm.formState.errors.managerPhone.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="border-t border-primary/20 pt-3">
                    <p className="text-sm text-gray-600">로그인 계정 정보</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">아이디</Label>
                    <Input className={inputClass} placeholder="아이디 (3자 이상)" {...branchForm.register("username")} />
                    {branchForm.formState.errors.username && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{branchForm.formState.errors.username.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">비밀번호</Label>
                    <Input type="password" className={inputClass} placeholder="비밀번호 (6자 이상, 영문+숫자)" {...branchForm.register("password")} />
                    {branchForm.formState.errors.password && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{branchForm.formState.errors.password.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">비밀번호 확인</Label>
                    <Input type="password" className={inputClass} placeholder="비밀번호 확인" {...branchForm.register("confirmPassword")} />
                    {branchForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                        <span>{branchForm.formState.errors.confirmPassword.message}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 hover-elevate text-white font-semibold transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                    disabled={branchRegMutation.isPending}
                  >
                    {branchRegMutation.isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />처리 중...</>
                    ) : "가입 완료"}
                  </Button>
                </form>
              </div>

              <AuthFooter />
            </AuthCard>
          </div>
        </div>
      );
    }

    // Done
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <AuthCard>
            <ProgressBar step={4} total={4} labels={["코드입력", "약관동의", "정보입력", "완료"]} />

            <div className="text-center space-y-4 py-6">
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-green-300 rounded-full animate-ping mx-auto"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">가입 완료</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                지점 가입이 완료되었습니다.<br />
                자동으로 로그인됩니다.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse" style={{ width: "100%" }}></div>
              </div>
            </div>

            <AuthFooter />
          </AuthCard>
        </div>
      </div>
    );
  }

  // ===== DEFAULT LOGIN SCREEN =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <AuthCard>
          {/* Logo */}
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center space-x-1 tracking-tight">
              <span className="text-3xl font-bold text-black">OUHVE</span>
              <span className="text-3xl font-bold text-primary"> ABM</span>
            </div>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/80 mx-auto rounded-full"></div>
          </div>

          {/* Login Form Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">로그인</h2>
            <p className="text-sm text-gray-600">OUHVE ABM에 오신 것을 환영합니다</p>
          </div>

          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">아이디</Label>
              <Input
                id="username"
                type="text"
                placeholder="아이디를 입력해주세요"
                className={inputClass}
                {...loginForm.register("username")}
              />
              {loginForm.formState.errors.username && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                  <span>{loginForm.formState.errors.username.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력해주세요"
                className={inputClass}
                {...loginForm.register("password")}
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 inline text-amber-500 shrink-0" />
                  <span>{loginForm.formState.errors.password.message}</span>
                </p>
              )}
            </div>

            {loginMutation.error && (
              <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertDescription>{loginMutation.error.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className={`w-full py-4 font-semibold transition-all duration-200 rounded-xl text-lg ${
                isLoginFormValid
                  ? "bg-gradient-to-r from-primary to-primary/80 hover-elevate text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              disabled={loginMutation.isPending || !isLoginFormValid}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />로그인 중...</>
              ) : "로그인"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full py-4 font-medium border-2 border-primary/20 text-primary hover-elevate hover:border-primary/40 transition-all duration-200 rounded-xl"
              onClick={() => setShowRegister(true)}
            >
              회원가입
            </Button>
          </form>

          <AuthFooter />
        </AuthCard>
      </div>

      {/* Custom Alert Dialog */}
      <CustomDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        onConfirm={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        description={alertDialog.description}
        confirmText="확인"
        type="alert"
      />
    </div>
  );
}
