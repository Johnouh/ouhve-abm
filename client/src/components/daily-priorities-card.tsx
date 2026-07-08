import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardAccentLine, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Phone, CreditCard, MessageSquare, Calendar, Box, CheckCircle2 } from "lucide-react";

/**
 * OUHVE ABM — PushPress GAP-8 흡수
 * "Daily Priorities" — Owner Report를 "조회" → "실행"으로 전환.
 * "오늘 누구한테 집중?" 시스템이 직접 제안.
 */

type ActionCategory = "긴급" | "재등록" | "케어" | "운영" | "기회";
type ActionType = "call_member" | "review_payment" | "schedule_consultation" | "check_locker" | "send_notice";

interface DailyPriority {
  id: string;
  category: ActionCategory;
  type: ActionType;
  title: string;
  reason: string;
  recommendedDeadline: string;
  targetType: "member" | "locker" | "payment";
  targetId: number | null;
  targetLabel: string;
  priorityScore: number;
}

interface Payload {
  generatedAt: string;
  totalActions: number;
  byCategory: Record<ActionCategory, number>;
  priorities: DailyPriority[];
  empty: boolean;
  emptyReason?: string;
}

const CATEGORY_STYLE: Record<ActionCategory, string> = {
  긴급:   "bg-red-500/10 text-red-400 border-red-500/20",
  재등록: "bg-primary/10 text-primary border-primary/20",
  케어:   "bg-orange-500/10 text-orange-400 border-orange-500/20",
  운영:   "bg-muted text-muted-foreground border-border",
  기회:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const TYPE_ICON: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  call_member: Phone,
  review_payment: CreditCard,
  schedule_consultation: Calendar,
  check_locker: Box,
  send_notice: MessageSquare,
};

export function DailyPrioritiesCard() {
  const { data, isLoading } = useQuery<Payload>({
    queryKey: ["/api/daily-priorities"],
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <Card className="hover-elevate overflow-visible">
        <CardAccentLine />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            오늘 처리할 액션
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            오늘 처리할 액션
            <Badge variant="outline" className="ml-1 tabular-nums">{data.totalActions}</Badge>
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
              style={{ boxShadow: "0 0 0 3px hsl(var(--accent) / 0.25)" }}
              aria-hidden="true"
            />
            OUHVE AI 실시간 제안
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">

        {data.empty ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mb-3" aria-hidden="true">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium">모든 운영이 정상입니다</p>
            <p className="text-xs text-muted-foreground mt-1">{data.emptyReason}</p>
          </div>
        ) : (
          <>
            {/* 카테고리 분포 */}
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {(Object.keys(data.byCategory) as ActionCategory[]).map((cat) => {
                const count = data.byCategory[cat];
                return (
                  <div
                    key={cat}
                    className={`px-2 py-1.5 rounded-md border text-center ${CATEGORY_STYLE[cat]}`}
                  >
                    <div className="text-[10px] uppercase tracking-wide opacity-80">{cat}</div>
                    <div className="text-base font-bold tabular-nums">{count}</div>
                  </div>
                );
              })}
            </div>

            {/* 액션 리스트 */}
            <div className="space-y-1.5">
              {data.priorities.map((p) => {
                const Icon = TYPE_ICON[p.type];
                const link =
                  p.targetType === "member" && p.targetId
                    ? `/members/${p.targetId}`
                    : "#";
                return (
                  <Link key={p.id} href={link}>
                    <div className={`flex items-start gap-3 p-2.5 rounded-md hover-elevate active-elevate-2 cursor-pointer border ${
                      p.category === "긴급" ? "border-red-500/30 bg-red-500/5" : "border-transparent"
                    }`}>
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${CATEGORY_STYLE[p.category]}`}>
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{p.title}</span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${CATEGORY_STYLE[p.category]}`}>
                            {p.recommendedDeadline}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.reason}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 text-[10px] text-muted-foreground text-right">
              생성: {new Date(data.generatedAt).toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}
