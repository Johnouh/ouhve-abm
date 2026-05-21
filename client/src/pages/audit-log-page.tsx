import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardAccentLine, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, User, Calendar, Filter, FileText } from "lucide-react";

/**
 * OUHVE ABM — Cycle 16 (AssistFit GAP-29)
 * 감사로그 페이지 — 분쟁/내부 통제/직원 책임 추적.
 */

interface AuditLogItem {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  changesJson: { before: any; after: any; fields: string[] } | null;
  performedBy: string | null;
  performedByRole: string | null;
  reason: string | null;
  createdAt: string;
}

interface AuditSummary {
  total: number;
  byEntity: Record<string, number>;
  byAction: Record<string, number>;
  byUser: { user: string; count: number }[];
  recent: AuditLogItem[];
}

const ACTION_TONE: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  update: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  delete: "bg-red-500/10 text-red-400 border-red-500/20",
  restore: "bg-amber-400/10 text-amber-400 border-amber-400/20",
};

const ENTITY_LABEL: Record<string, string> = {
  member: "회원",
  membership: "회원권",
  payment: "결제",
  locker: "락커",
  consultation: "상담",
  franchise: "센터",
  staff: "직원",
  product: "상품",
};

export default function AuditLogPage() {
  const [days, setDays] = useState(7);
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");

  const { data: summary } = useQuery<AuditSummary>({
    queryKey: ["/api/audit-logs/summary", days],
    queryFn: async () => {
      const res = await fetch(`/api/audit-logs/summary?days=${days}`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: logs } = useQuery<{ items: AuditLogItem[]; count: number }>({
    queryKey: ["/api/audit-logs", days, filterEntity, filterAction],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days), limit: "100" });
      if (filterEntity) params.set("entityType", filterEntity);
      if (filterAction) params.set("action", filterAction);
      const res = await fetch(`/api/audit-logs?${params}`, { credentials: "include" });
      return res.json();
    },
  });

  return (
    <div className="p-3 md:p-6 bg-background min-h-full">

      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">감사로그</h1>
          <p className="text-sm text-muted-foreground truncate">회원·결제·이용권 변경 이력 추적</p>
        </div>
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Kpi label="기간" value={`${days}`} suffix="일" icon={<Calendar className="w-4 h-4" />} />
          <Kpi label="전체 변경" value={`${summary.total}`} suffix="건" highlight icon={<FileText className="w-4 h-4" />} />
          <Kpi label="삭제" value={`${summary.byAction.delete ?? 0}`} suffix="건" danger icon={<Shield className="w-4 h-4" />} />
          <Kpi label="활동 직원" value={`${summary.byUser.length}`} suffix="명" icon={<User className="w-4 h-4" />} />
        </div>
      )}

      {/* 필터 */}
      <Card className="mb-4 hover-elevate overflow-visible">
        <CardAccentLine />
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">전체 엔티티</option>
              {Object.entries(ENTITY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">전체 액션</option>
              <option value="create">생성</option>
              <option value="update">수정</option>
              <option value="delete">삭제</option>
              <option value="restore">복원</option>
            </select>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="90"
                value={days}
                onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 7)))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">일</span>
            </div>
            {logs && (
              <Badge variant="outline" className="ml-auto">{logs.count}건</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 로그 리스트 */}
      <Card className="hover-elevate overflow-visible">
        <CardAccentLine />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            변경 이력
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!logs || logs.items.length === 0 ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-3" aria-hidden="true">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <p className="text-sm font-medium">기록된 변경이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">
                회원/결제 변경 시 자동으로 여기 쌓입니다.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {logs.items.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function LogRow({ log }: { log: AuditLogItem }) {
  const tone = ACTION_TONE[log.action] ?? "bg-muted text-muted-foreground border-border";
  return (
    <div className="flex items-start gap-3 p-3 rounded-md hover-elevate border border-transparent">
      <Badge variant="outline" className={`text-xs shrink-0 ${tone}`}>
        {log.action === "create" ? "생성" : log.action === "update" ? "수정" : log.action === "delete" ? "삭제" : "복원"}
      </Badge>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            {ENTITY_LABEL[log.entityType] ?? log.entityType} #{log.entityId}
          </span>
          {log.changesJson?.fields && log.changesJson.fields.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              ({log.changesJson.fields.length} 필드 변경)
            </span>
          )}
        </div>
        {log.changesJson?.fields && log.changesJson.fields.length > 0 && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {log.changesJson.fields.join(", ")}
          </div>
        )}
        {log.reason && (
          <div className="text-xs text-foreground mt-1 italic">
            사유: {log.reason}
          </div>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-2.5 h-2.5" />
            {log.performedBy ?? "system"}
            {log.performedByRole && <span className="opacity-60">({log.performedByRole})</span>}
          </span>
          <span>·</span>
          <span className="tabular-nums">
            {new Date(log.createdAt).toLocaleString("ko-KR", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, suffix, highlight, danger, icon }: {
  label: string; value: string; suffix: string; highlight?: boolean; danger?: boolean; icon: React.ReactNode;
}) {
  const color = danger ? "text-red-400" : highlight ? "text-primary" : "";
  return (
    <Card className="hover-elevate overflow-visible">
      <CardAccentLine />
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide mb-2">
          <span className={`shrink-0 ${highlight ? "text-primary" : ""}`}>{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className={`text-2xl font-bold tabular-nums ${color}`}>
          {value}
          <span className="text-sm font-medium text-muted-foreground ml-1">{suffix}</span>
        </div>
      </CardContent>
    </Card>
  );
}
