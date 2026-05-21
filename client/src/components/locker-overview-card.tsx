import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardAccentLine, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, AlertTriangle, History, ChevronRight } from "lucide-react";

/**
 * OUHVE ABM — GAP-14 (AssistFit page-067/080 흡수)
 * 락커 운영 가시화 — 점유율 + 만료 임박 + 회수 이력
 */

interface LockerOverview {
  totalLockers: number;
  occupied: number;
  vacant: number;
  occupancyRate: number;
  bySection: { section: string; total: number; occupied: number; rate: number }[];
  byType: { type: string; total: number; occupied: number }[];
  expiringSoon: { id: number; number: number; section: string; memberId: number | null; endDate: string | null; daysLeft: number }[];
  recentRecoveries: { id: number; lockerNumber: number; memberName: string | null; recoveryDate: string; reason: string | null }[];
  expectedMonthlyRevenue: number;
}

export function LockerOverviewCard() {
  const { data, isLoading } = useQuery<LockerOverview>({
    queryKey: ["/api/locker-overview"],
    refetchInterval: 10 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <Card className="hover-elevate overflow-visible">
        <CardAccentLine />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Box className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            락커 운영 보드
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  const occupancyPct = Math.round(data.occupancyRate * 100);

  return (
    <Card className="hover-elevate overflow-visible">
      <CardAccentLine />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Box className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            락커 운영 보드
          </CardTitle>
          <span className="text-xs text-muted-foreground">전체 {data.totalLockers}개</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">

        {/* 빅 KPI 4개 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="점유율" value={`${occupancyPct}%`} highlight />
          <Kpi label="이용 중" value={`${data.occupied}`} suffix="개" />
          <Kpi label="빈 락커" value={`${data.vacant}`} suffix="개" />
          <Kpi label="예상 월 매출" value={`₩${(data.expectedMonthlyRevenue / 10000).toFixed(0)}`} suffix="만" />
        </div>

        {/* 점유율 막대 */}
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">전체 점유율</div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${occupancyPct}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 섹션별 */}
        {data.bySection.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">섹션별</div>
            <div className="space-y-1.5">
              {data.bySection.map((s) => (
                <div key={s.section} className="flex items-center gap-2">
                  <span className="text-xs w-16 truncate text-muted-foreground">{s.section}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${Math.round(s.rate * 100)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xs tabular-nums w-12 text-right">{s.occupied}/{s.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 만료 임박 */}
        {data.expiringSoon.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" aria-hidden="true" />
              만료 임박 14일 이내 ({data.expiringSoon.length})
            </div>
            <div className="space-y-1">
              {data.expiringSoon.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-amber-400/5 border border-amber-400/20">
                  <span className="text-xs font-medium">#{l.number} <span className="text-muted-foreground">({l.section})</span></span>
                  <span className="text-xs tabular-nums text-amber-500 font-semibold">D-{l.daysLeft}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최근 회수 */}
        {data.recentRecoveries.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
              <History className="w-3 h-3 shrink-0" aria-hidden="true" />
              최근 회수 (재배정 후보)
            </div>
            <div className="space-y-1">
              {data.recentRecoveries.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md hover-elevate text-xs">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium">#{r.lockerNumber}</span>
                  <span className="text-muted-foreground truncate">{r.memberName ?? "-"}</span>
                  <span className="text-muted-foreground ml-auto tabular-nums shrink-0">
                    {new Date(r.recoveryDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.totalLockers === 0 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 mb-2" aria-hidden="true">
              <Box className="w-5 h-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">아직 락커가 등록되지 않았습니다</p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function Kpi({ label, value, suffix, highlight }: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold tabular-nums mt-0.5 ${highlight ? "text-primary" : ""}`}>
        {value}
        {suffix && <span className="text-xs font-medium text-muted-foreground ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}
