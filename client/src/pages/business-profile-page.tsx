import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Sparkles, MapPin, Clock, Users, Target, Heart, AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * OUHVE ABM — Module 1: Business Profile
 *
 * 운영자가 센터 정체성을 입력하는 화면.
 * AI Operation Assistant(Module 7)가 의미 있는 운영 제안을 하려면
 * 이 7가지 컨텍스트가 필요하다.
 *
 * 완성도가 100%가 되면 AI 추천 모듈이 잠금 해제된다는 메시지로 유도.
 */

const WELLNESS_CATEGORIES = ["헬스장", "PT샵", "필라테스", "요가", "뷰티샵", "복합"] as const;
const DAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
] as const;

interface ProfileCompletion {
  filled: number;
  total: number;
  percent: number;
  missingFields: string[];
  isComplete: boolean;
}

interface FranchiseProfile {
  id: number;
  name: string;
  description?: string | null;
  wellnessCategory?: string | null;
  region?: string | null;
  operatingHours?: Record<string, string> | null;
  mainPrograms?: string[] | null;
  primaryAudience?: string | null;
  philosophy?: string | null;
  topConcern?: string | null;
  profileCompletedAt?: string | null;
}

export default function BusinessProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ franchise: FranchiseProfile; completion: ProfileCompletion }>({
    queryKey: ["/api/business-profile"],
  });

  const [form, setForm] = useState({
    wellnessCategory: "",
    region: "",
    operatingHours: {} as Record<string, string>,
    mainPrograms: [] as string[],
    mainProgramsInput: "",
    primaryAudience: "",
    philosophy: "",
    topConcern: "",
  });

  useEffect(() => {
    if (data?.franchise) {
      const f = data.franchise;
      setForm({
        wellnessCategory: f.wellnessCategory ?? "",
        region: f.region ?? "",
        operatingHours: f.operatingHours ?? {},
        mainPrograms: f.mainPrograms ?? [],
        mainProgramsInput: (f.mainPrograms ?? []).join(", "),
        primaryAudience: f.primaryAudience ?? "",
        philosophy: f.philosophy ?? "",
        topConcern: f.topConcern ?? "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("PUT", "/api/business-profile", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-profile"] });
      toast({ title: "프로필 저장 완료", description: "OUHVE AI가 더 정확한 제안을 시작합니다." });
    },
    onError: (err: Error) => {
      toast({ title: "저장 실패", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    const programs = form.mainProgramsInput.split(",").map((s) => s.trim()).filter(Boolean);
    saveMutation.mutate({
      wellnessCategory: form.wellnessCategory || null,
      region: form.region || null,
      operatingHours: Object.keys(form.operatingHours).length > 0 ? form.operatingHours : null,
      mainPrograms: programs.length > 0 ? programs : null,
      primaryAudience: form.primaryAudience || null,
      philosophy: form.philosophy || null,
      topConcern: form.topConcern || null,
    });
  };

  const completion = data?.completion;
  const isComplete = completion?.isComplete ?? false;

  return (
    <div className="p-3 md:p-6 bg-background min-h-full">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">Business Profile</h1>
            <p className="text-sm text-muted-foreground truncate">센터 정체성 — AI 운영 직원의 컨텍스트 베이스</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="shrink-0">
          <Save className="w-4 h-4 mr-2" />
          저장
        </Button>
      </div>

      {/* 완성도 카드 */}
      <Card className="mb-6 hover-elevate overflow-visible">
        <CardAccentLine />
        <CardContent className="pt-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h2 className="text-base font-semibold">
                  {isComplete ? "AI 운영 직원 활성화 완료" : "AI 운영 직원을 깨우는 중"}
                </h2>
                <span className="text-2xl font-bold tabular-nums text-primary">{completion?.percent ?? 0}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isComplete
                  ? "모든 컨텍스트가 채워졌습니다. AI Assistant가 매일 운영 제안을 생성합니다."
                  : `7가지 중 ${completion?.filled ?? 0}개 채움. 나머지 ${(completion?.total ?? 7) - (completion?.filled ?? 0)}개를 채우면 AI 추천이 더 정확해집니다.`}
              </p>
              {/* 진행 바 — Persimmon */}
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${completion?.percent ?? 0}%` }}
                  aria-hidden="true"
                />
              </div>
              {/* 활성화 상태 점 (Teal accent — 도형 전용) */}
              {isComplete && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-accent"
                    style={{ boxShadow: "0 0 0 3px hsl(var(--accent) / 0.25)" }}
                    aria-hidden="true"
                  />
                  AI 동기화 활성
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 입력 폼 — 2 컬럼 그리드 (md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 1. 센터 유형 */}
        <Card className="hover-elevate overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              센터 유형
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value={form.wellnessCategory} onValueChange={(v) => setForm({ ...form, wellnessCategory: v })}>
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {WELLNESS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* 2. 지역 */}
        <Card className="hover-elevate overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              지역
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="예: 서울 강남구"
            />
          </CardContent>
        </Card>

        {/* 3. 운영 시간 */}
        <Card className="md:col-span-2 hover-elevate overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              운영 시간 (요일별)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {DAYS.map((day) => (
                <div key={day.key}>
                  <Label className="text-xs text-muted-foreground">{day.label}</Label>
                  <Input
                    value={form.operatingHours[day.key] ?? ""}
                    onChange={(e) => setForm({
                      ...form,
                      operatingHours: { ...form.operatingHours, [day.key]: e.target.value },
                    })}
                    placeholder="09:00-22:00"
                    className="mt-1 text-sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. 주요 프로그램 */}
        <Card className="hover-elevate overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              주요 프로그램
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={form.mainProgramsInput}
              onChange={(e) => setForm({ ...form, mainProgramsInput: e.target.value })}
              placeholder="PT, 그룹수업, 필라테스 (쉼표로 구분)"
            />
            {form.mainProgramsInput && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.mainProgramsInput.split(",").map((p) => p.trim()).filter(Boolean).map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. 주 고객층 */}
        <Card className="hover-elevate overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              주 고객층
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={form.primaryAudience}
              onChange={(e) => setForm({ ...form, primaryAudience: e.target.value })}
              placeholder="예: 30대 여성 직장인"
            />
          </CardContent>
        </Card>

        {/* 6. 운영 철학 */}
        <Card className="md:col-span-2 hover-elevate overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              운영 철학
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={form.philosophy}
              onChange={(e) => setForm({ ...form, philosophy: e.target.value })}
              placeholder="센터를 어떤 가치로 운영하시나요? (한 문단)"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* 7. 현재 가장 큰 문제 */}
        <Card className="md:col-span-2 hover-elevate overflow-visible">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              현재 가장 큰 운영 문제
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={form.topConcern}
              onChange={(e) => setForm({ ...form, topConcern: e.target.value })}
              placeholder="요즘 운영하면서 가장 부담스러운 일은? (AI가 우선 개선안을 제안합니다)"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-2">
              이 항목은 AI Operation Assistant의 첫 진단 시드가 됩니다.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* 하단 저장 (모바일에서 헤더 버튼 못 닿는 경우) */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "저장 중..." : "프로필 저장"}
        </Button>
      </div>
    </div>
  );
}
