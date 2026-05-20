import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Users, AlertTriangle, Calendar, TrendingUp,
  ArrowRight, ChevronRight, CheckCircle2, AlertCircle,
  Phone, MessageSquare, Heart, Building2,
} from "lucide-react";
import { AttendanceHeatmapCard } from "@/components/attendance-heatmap-card";

/**
 * OUHVE ABM — Module 8: Owner Report (첫 화면)
 *
 * 브리프 #15: "기존 CRM형 첫 화면이 아니라, AI 운영 리포트형 첫 화면"
 *
 * 대표가 들어왔을 때 봐야 할 단 하나의 화면 — 회원 목록 X.
 * 1) 인사 + 프로필 완성도 (덜 채워졌으면 유도)
 * 2) 자연어 내러티브 (오늘 운영 요약)
 * 3) 4 KPI
 * 4) AI 추천 액션 상위 5건 (클릭 가능)
 * 5) 리스크 분해 (배지)
 *
 * Design system:
 *   - Persimmon: 모든 헤더 아이콘 칩, KPI 강조, 진행바, CTA
 *   - Teal: 도형 점만 (Goal/Active 상태 점)
 */

const STATUS_COLORS: Record<string, string> = {
  미납: "bg-red-500/10 text-red-400 border-red-500/20",
  이탈위험: "bg-red-500/10 text-red-400 border-red-500/20",
  상담미처리: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  만료임박: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  재등록가능: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  출석감소: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  관심필요: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  휴면: "bg-muted text-muted-foreground border-border",
};

interface OwnerReport {
  generatedAt: string;
  greeting: string;
  profileCompletion: { percent: number; isComplete: boolean; nudge?: string };
  kpis: {
    activeMembers: number;
    expiringThisWeek: number;
    actionableMembers: number;
    weeklyAttendanceRate: number;
  };
  topActions: Array<{
    priority: number;
    memberId: number;
    memberName: string;
    status: string;
    reason: string;
    recommendedAction: string;
  }>;
  riskBreakdown: Record<string, number>;
  narrative: string;
}

export default function OwnerReportPage() {
  const { data, isLoading } = useQuery<OwnerReport>({
    queryKey: ["/api/owner-report"],
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
  });

  return (
    <div className="p-3 md:p-6 bg-background min-h-full">

      {/* 헤더 — 인사말 + 라이브 동기화 점 (Teal) */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
              style={{ boxShadow: "0 0 0 3px hsl(var(--accent) / 0.25)" }}
              aria-hidden="true"
            />
            OUHVE AI · 실시간 운영 리포트
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
            {data?.greeting ?? "OUHVE ABM"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.generatedAt
              ? `생성: ${new Date(data.generatedAt).toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
              : "리포트 생성 중..."}
          </p>
        </div>
        <Link href="/business-profile">
          <Button variant="outline" size="sm" className="shrink-0">
            <Building2 className="w-4 h-4 mr-2" />
            센터 프로필
          </Button>
        </Link>
      </div>

      {/* 프로필 완성도 nudge (미완성일 때만) */}
      {data && !data.profileCompletion.isComplete && (
        <Card className="mb-6 hover-elevate overflow-visible border-primary/20">
          <CardAccentLine />
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-1">AI 운영 직원이 깨어나는 중</h3>
                <p className="text-xs text-muted-foreground mb-3">{data.profileCompletion.nudge}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${data.profileCompletion.percent}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-sm font-semibold text-primary tabular-nums">
                    {data.profileCompletion.percent}%
                  </span>
                  <Link href="/business-profile">
                    <Button size="sm" variant="ghost">
                      채우기 <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI 자연어 내러티브 */}
      <Card className="mb-6 hover-elevate overflow-visible">
        <CardAccentLine />
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                오늘 운영 요약
              </h2>
              <p className="text-base leading-relaxed">{data?.narrative ?? "..."}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label="활성 회원"
          value={data?.kpis.activeMembers ?? 0}
          suffix="명"
          loading={isLoading}
        />
        <KpiCard
          icon={<AlertCircle className="w-4 h-4" />}
          label="케어 액션"
          value={data?.kpis.actionableMembers ?? 0}
          suffix="명"
          highlight
          loading={isLoading}
        />
        <KpiCard
          icon={<Calendar className="w-4 h-4" />}
          label="이번주 만료/재등록"
          value={data?.kpis.expiringThisWeek ?? 0}
          suffix="명"
          loading={isLoading}
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="평균 출석률"
          value={Math.round((data?.kpis.weeklyAttendanceRate ?? 0) * 100)}
          suffix="%"
          loading={isLoading}
        />
      </div>

      {/* AI 추천 액션 — 상위 5건 */}
      <Card className="mb-6 hover-elevate overflow-visible">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            오늘 처리할 액션 ({data?.topActions.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!data || data.topActions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {data.topActions.map((action) => (
                <ActionRow key={action.memberId} action={action} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GAP-19 (AssistFit 흡수) — 시간대별 출석 패턴 */}
      <div className="mb-6">
        <AttendanceHeatmapCard />
      </div>

      {/* 리스크 분해 — 배지 그리드 */}
      <Card className="hover-elevate overflow-visible">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            회원 상태 분포
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {data && Object.entries(data.riskBreakdown).map(([status, count]) => (
              <div
                key={status}
                className={`px-3 py-2 rounded-md border ${STATUS_COLORS[status] ?? "bg-muted border-border"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{status}</span>
                  <span className="text-base font-bold tabular-nums">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function KpiCard({ icon, label, value, suffix, highlight, loading }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <Card className="hover-elevate overflow-visible relative">
      <CardAccentLine />
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide mb-2">
          <span className={`shrink-0 ${highlight ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true">
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
        <div className={`text-2xl md:text-3xl font-bold tabular-nums ${highlight ? "text-primary" : ""}`}>
          {loading ? "..." : value.toLocaleString()}
          <span className="text-base font-medium text-muted-foreground ml-1">{suffix}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionRow({ action }: {
  action: {
    memberId: number;
    memberName: string;
    status: string;
    reason: string;
    recommendedAction: string;
  };
}) {
  return (
    <Link href={`/members/${action.memberId}`}>
      <div className="flex items-start gap-3 p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-semibold">
          {action.memberName.slice(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{action.memberName}</span>
            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[action.status] ?? ""}`}>
              {action.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.reason}</p>
          <p className="text-xs text-foreground mt-1 truncate">
            <span className="text-primary font-medium">→</span> {action.recommendedAction}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" aria-hidden="true" />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="py-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-3" aria-hidden="true">
        <CheckCircle2 className="w-6 h-6 text-accent" />
      </div>
      <p className="text-sm font-medium">오늘 처리할 액션이 없습니다</p>
      <p className="text-xs text-muted-foreground mt-1">회원 데이터가 더 쌓이면 AI가 운영 제안을 시작합니다.</p>
    </div>
  );
}
