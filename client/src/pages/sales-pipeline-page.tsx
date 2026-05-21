import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, Phone, ArrowRight, TrendingUp, Users } from "lucide-react";

/**
 * OUHVE ABM — PushPress GAP-3 흡수 (Cycle 12)
 * Live Sales Pipeline — 예비회원 칸반 시각화 (신규리드 → 등록완료 / 이탈)
 */

type Stage = "신규리드" | "상담예약" | "체험중" | "가입임박" | "등록완료" | "이탈";

interface Card {
  id: number;
  customerName: string;
  phone: string;
  consultationDate: string;
  followUpDate: string | null;
  daysInStage: number;
  isHot: boolean;
  consultationType: string;
  result: string | null;
  notes: string | null;
}

interface StageGroup {
  stage: Stage;
  count: number;
  cards: Card[];
}

interface Payload {
  generatedAt: string;
  total: number;
  stages: StageGroup[];
  conversionRate: number;
  hotLeadsCount: number;
}

const STAGE_COLORS: Record<Stage, string> = {
  신규리드: "border-blue-500/30 bg-blue-500/5",
  상담예약: "border-primary/30 bg-primary/5",
  체험중: "border-amber-400/30 bg-amber-400/5",
  가입임박: "border-purple-500/30 bg-purple-500/5",
  등록완료: "border-emerald-500/30 bg-emerald-500/5",
  이탈: "border-red-500/30 bg-red-500/5",
};

const STAGE_HEADER: Record<Stage, string> = {
  신규리드: "text-blue-400",
  상담예약: "text-primary",
  체험중: "text-amber-400",
  가입임박: "text-purple-400",
  등록완료: "text-emerald-400",
  이탈: "text-red-400",
};

export default function SalesPipelinePage() {
  const { data, isLoading } = useQuery<Payload>({
    queryKey: ["/api/sales-pipeline"],
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <div className="p-3 md:p-6 bg-background min-h-full">

      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">예비회원 파이프라인</h1>
          <p className="text-sm text-muted-foreground truncate">상담→체험→가입 전환 라이브 추적</p>
        </div>
      </div>

      {/* KPI */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiCard label="전체 리드" value={`${data.total}`} suffix="명" icon={<Users className="w-4 h-4" />} />
          <KpiCard label="Hot 리드" value={`${data.hotLeadsCount}`} suffix="명" icon={<Flame className="w-4 h-4" />} highlight />
          <KpiCard label="전환율" value={`${data.conversionRate}`} suffix="%" icon={<TrendingUp className="w-4 h-4" />} />
          <KpiCard
            label="갱신"
            value={new Date(data.generatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            suffix=""
            icon={<Calendar className="w-4 h-4" />}
          />
        </div>
      )}

      {/* 칸반 보드 */}
      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {data.stages.map((group) => (
            <StageColumn key={group.stage} group={group} />
          ))}
        </div>
      )}

    </div>
  );
}

function StageColumn({ group }: { group: StageGroup }) {
  return (
    <Card className="overflow-visible">
      <CardAccentLine />
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold ${STAGE_HEADER[group.stage]}`}>{group.stage}</h3>
          <Badge variant="outline" className="text-xs tabular-nums">{group.count}</Badge>
        </div>
        {group.cards.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">비어있음</div>
        ) : (
          <div className="space-y-2">
            {group.cards.map((c) => (
              <CardItem key={c.id} card={c} stage={group.stage} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CardItem({ card, stage }: { card: Card; stage: Stage }) {
  return (
    <div className={`p-2.5 rounded-md border ${STAGE_COLORS[stage]} ${card.isHot ? "ring-1 ring-primary/40" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="text-sm font-semibold truncate flex-1 min-w-0">{card.customerName}</span>
        {card.isHot && (
          <Flame className="w-3 h-3 text-primary shrink-0" aria-label="Hot lead" />
        )}
      </div>
      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
        <Phone className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate">{card.phone}</span>
      </div>
      {card.consultationType && (
        <Badge variant="outline" className="text-[10px] mr-1 mb-1">{card.consultationType}</Badge>
      )}
      {card.result && (
        <div className="text-[10px] text-muted-foreground italic truncate mt-1">→ {card.result}</div>
      )}
      <div className="flex items-center justify-between mt-2 text-[10px]">
        <span className="text-muted-foreground tabular-nums">{card.daysInStage}일 경과</span>
        {card.followUpDate && (
          <span className="text-primary tabular-nums">
            <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
            {new Date(card.followUpDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, suffix, icon, highlight }: {
  label: string; value: string; suffix: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <Card className="hover-elevate overflow-visible">
      <CardAccentLine />
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide mb-2">
          <span className={`shrink-0 ${highlight ? "text-primary" : ""}`}>{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className={`text-2xl font-bold tabular-nums ${highlight ? "text-primary" : ""}`}>
          {value}
          {suffix && <span className="text-sm font-medium text-muted-foreground ml-1">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
