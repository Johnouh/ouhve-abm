import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardAccentLine, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, AlertTriangle, Activity, Shield } from "lucide-react";

/**
 * OUHVE ABM — PushPress GAP-7 흡수
 * Retention Signals — At-Risk 7일 전 행동 시그널 점수화.
 */

interface Signal {
  memberId: number;
  memberName: string;
  riskScore: number;
  signals: {
    attendanceDropRate: number;
    daysToExpiry: number | null;
    consecutiveSkipDays: number;
    consultationGapDays: number | null;
  };
  trend: "improving" | "stable" | "worsening";
  predictedAction: string;
  recommendedIntervention: string;
}

interface Payload {
  generatedAt: string;
  totalAnalyzed: number;
  atRisk: number;
  critical: number;
  topSignals: Signal[];
  cohortAvgRisk: number;
}

export function RetentionSignalsCard() {
  const { data, isLoading } = useQuery<Payload>({
    queryKey: ["/api/retention-signals"],
    refetchInterval: 10 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <Card className="hover-elevate overflow-visible">
        <CardAccentLine />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            이탈 시그널 (At-Risk 7일 전)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">분석 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-elevate overflow-visible">
      <CardAccentLine />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            이탈 시그널
          </CardTitle>
          <span className="text-xs text-muted-foreground">{data.totalAnalyzed}명 분석</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">

        {/* 빅 KPI */}
        <div className="grid grid-cols-3 gap-3">
          <KpiCell label="평균 위험도" value={`${data.cohortAvgRisk}`} suffix="점" />
          <KpiCell label="위험 (50+)" value={`${data.atRisk}`} suffix="명" highlight />
          <KpiCell label="즉시 (80+)" value={`${data.critical}`} suffix="명" danger />
        </div>

        {/* Top 시그널 */}
        {data.topSignals.length === 0 ? (
          <div className="py-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 mb-2" aria-hidden="true">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm font-medium">위험 시그널 없음</p>
            <p className="text-xs text-muted-foreground mt-1">모든 회원이 안정적입니다.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {data.topSignals.slice(0, 6).map((s) => (
              <Link key={s.memberId} href={`/members/${s.memberId}`}>
                <div className={`flex items-start gap-3 p-2.5 rounded-md hover-elevate active-elevate-2 cursor-pointer border ${
                  s.riskScore >= 80 ? "border-red-500/30 bg-red-500/5" :
                  s.riskScore >= 50 ? "border-amber-400/30 bg-amber-400/5" :
                  "border-transparent"
                }`}>
                  <RiskBadge score={s.riskScore} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{s.memberName}</span>
                      <TrendIcon trend={s.trend} />
                      {s.signals.daysToExpiry !== null && s.signals.daysToExpiry <= 14 && (
                        <Badge variant="outline" className="text-[10px] shrink-0 bg-amber-400/10 text-amber-400 border-amber-400/20">
                          만료 D-{s.signals.daysToExpiry}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.predictedAction}</p>
                    <p className="text-xs text-foreground mt-1 truncate">
                      <span className="text-primary font-medium">→</span> {s.recommendedIntervention}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span>출석↓ {s.signals.attendanceDropRate}%</span>
                      <span>·</span>
                      <span>연속결석 {s.signals.consecutiveSkipDays}일</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function KpiCell({ label, value, suffix, highlight, danger }: {
  label: string; value: string; suffix: string; highlight?: boolean; danger?: boolean;
}) {
  const color = danger ? "text-red-400" : highlight ? "text-primary" : "";
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold tabular-nums mt-0.5 ${color}`}>
        {value}
        <span className="text-xs font-medium text-muted-foreground ml-0.5">{suffix}</span>
      </div>
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  const tone =
    score >= 80 ? "bg-red-500/10 text-red-400 border-red-500/30" :
    score >= 50 ? "bg-amber-400/10 text-amber-400 border-amber-400/30" :
    "bg-orange-500/10 text-orange-400 border-orange-500/30";
  return (
    <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${tone}`}>
      <span className="text-sm font-bold tabular-nums">{score}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: Signal["trend"] }) {
  if (trend === "improving") return <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" aria-label="개선중" />;
  if (trend === "worsening") return <TrendingDown className="w-3 h-3 text-red-400 shrink-0" aria-label="악화" />;
  return <Minus className="w-3 h-3 text-muted-foreground shrink-0" aria-label="안정" />;
}
