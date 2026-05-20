import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardAccentLine, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

/**
 * OUHVE ABM — Module 8 보강 (GAP-19 from AssistFit absorption)
 *
 * 시간대별 출석 위젯 — Owner Report에 임베드.
 * AssistFit page-082/033 패턴 흡수:
 *   - 빅 KPI (총 출석 / 일평균) — tabular-nums, Persimmon
 *   - 24시간 막대 차트 (시간대 분포)
 *   - 피크/한산 시간대 칩 (Top 3)
 *   - 도형 색은 Persimmon 솔리드, 강조는 Teal 점 (도형 전용 규칙 준수)
 */

interface HourBin { hour: number; count: number; pct: number }
interface PeakHour { hour: number; count: number; label: string }

interface Analytics {
  periodDays: number;
  totalCheckIns: number;
  uniqueMembers: number;
  hourlyDistribution: HourBin[];
  weekdayDistribution: { weekday: number; weekdayLabel: string; count: number; pct: number }[];
  peakHours: PeakHour[];
  quietHours: PeakHour[];
  avgPerDay: number;
}

export function AttendanceHeatmapCard() {
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/attendance-analytics"],
    refetchInterval: 10 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <Card className="hover-elevate overflow-visible">
        <CardAccentLine />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            시간대별 출석 패턴
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  // 24시간 막대 — max로 정규화
  const maxCount = Math.max(...data.hourlyDistribution.map((h) => h.count), 1);

  return (
    <Card className="hover-elevate overflow-visible">
      <CardAccentLine />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            시간대별 출석 패턴
          </CardTitle>
          <span className="text-xs text-muted-foreground">최근 {data.periodDays}일</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">

        {/* 빅 KPI 3개 — AssistFit page-033 패턴 */}
        <div className="grid grid-cols-3 gap-3">
          <KpiBlock label="총 출석" value={data.totalCheckIns} suffix="회" highlight />
          <KpiBlock label="고유 회원" value={data.uniqueMembers} suffix="명" />
          <KpiBlock label="일평균" value={data.avgPerDay} suffix="회" />
        </div>

        {/* 24시간 막대 차트 */}
        {data.totalCheckIns > 0 ? (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              시간대 분포
            </div>
            <div className="flex items-end gap-[2px] h-20" role="img" aria-label="24시간 출석 분포">
              {data.hourlyDistribution.map((h) => {
                const pct = h.count === 0 ? 0 : Math.max((h.count / maxCount) * 100, 4);
                const isPeak = data.peakHours.some((p) => p.hour === h.hour);
                return (
                  <div
                    key={h.hour}
                    className="flex-1 flex flex-col justify-end relative group"
                    title={`${String(h.hour).padStart(2, "0")}시: ${h.count}회 (${h.pct}%)`}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-colors ${
                        isPeak ? "bg-primary" : "bg-primary/30"
                      }`}
                      style={{ height: `${pct}%` }}
                      aria-hidden="true"
                    />
                  </div>
                );
              })}
            </div>
            {/* 시간대 라벨 (0, 6, 12, 18, 23만) */}
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
              <span>0</span>
              <span>6</span>
              <span>12</span>
              <span>18</span>
              <span>23</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-2">
            아직 출석 기록이 충분하지 않습니다.
          </div>
        )}

        {/* 피크/한산 시간대 칩 */}
        {data.peakHours.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                <TrendingUp className="w-3 h-3 shrink-0" aria-hidden="true" />
                피크
              </div>
              <div className="flex flex-wrap gap-1">
                {data.peakHours.map((p) => (
                  <span
                    key={p.hour}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary font-medium"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                      aria-hidden="true"
                    />
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                <TrendingDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                한산
              </div>
              <div className="flex flex-wrap gap-1">
                {data.quietHours.map((q) => (
                  <span
                    key={q.hour}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground font-medium"
                  >
                    {q.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 요일별 분포 (있을 때만) */}
        {data.totalCheckIns > 0 && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              요일별
            </div>
            <div className="grid grid-cols-7 gap-1">
              {data.weekdayDistribution.map((w) => {
                const pct = data.totalCheckIns === 0 ? 0 : (w.count / data.totalCheckIns) * 100;
                return (
                  <div key={w.weekday} className="text-center">
                    <div className="text-[10px] text-muted-foreground mb-1">{w.weekdayLabel}</div>
                    <div className="h-12 bg-muted rounded-sm relative overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary/60"
                        style={{ height: `${pct * 2}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-[10px] tabular-nums mt-1">{w.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function KpiBlock({ label, value, suffix, highlight }: {
  label: string;
  value: number;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold tabular-nums mt-0.5 ${highlight ? "text-primary" : ""}`}>
        {value.toLocaleString()}
        <span className="text-xs font-medium text-muted-foreground ml-0.5">{suffix}</span>
      </div>
    </div>
  );
}
