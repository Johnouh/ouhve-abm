import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft, Bot, Bell, MessageSquare, UserPlus, FileText } from "lucide-react";

/**
 * Ouhve AI 작업 내역 — Ouhve가 MCP로 이 센터에서 실행한 작업을 따로 조회.
 * 원장/직원이 "AI가 무엇을 했는지"를 ABM 안에서 투명하게 확인.
 */

interface OuhveActivity {
  id: number;
  tool: string;
  action_type: string | null;
  summary: string;
  target_type: string | null;
  target_ref: string | null;
  created_at: string;
}

const TOOL_ICON: Record<string, typeof Bot> = {
  "abm.kioskNotices.create": Bell,
  "abm.posts.create": FileText,
  "abm.consultations.createDirect": MessageSquare,
  "abm.consultations.create": MessageSquare,
  "abm.members.create": UserPlus,
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "방금";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
  return `${Math.floor(diff / 86_400_000)}일 전`;
}

export default function OuhveActivityPage() {
  const { data: activities, isLoading } = useQuery<OuhveActivity[]>({
    queryKey: ["/api/ouhve-activities"],
    queryFn: async () => {
      const res = await fetch("/api/ouhve-activities", { credentials: "include" });
      return res.json();
    },
    refetchInterval: 8000,
  });

  const today = (activities ?? []).filter((a) => Date.now() - new Date(a.created_at).getTime() < 86_400_000).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/">
          <a className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover-elevate active-elevate-2 rounded-md px-2 py-1">
            <ArrowLeft className="h-4 w-4" /> 홈으로
          </a>
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Ouhve AI 작업 내역</h1>
            <p className="text-sm text-muted-foreground">
              Ouhve가 이 센터에서 자동으로 처리한 작업 · 오늘 {today}건
            </p>
          </div>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">불러오는 중…</p>}

        {!isLoading && (activities ?? []).length === 0 && (
          <Card className="overflow-visible">
            <CardAccentLine />
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <Bot className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">아직 Ouhve가 처리한 작업이 없습니다</p>
              <p className="text-xs text-muted-foreground/70">
                Ouhve 앱에서 제안을 승인하면 여기에 실행 내역이 기록됩니다
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2.5">
          {(activities ?? []).map((a) => {
            const Icon = TOOL_ICON[a.tool] ?? Bot;
            return (
              <Card key={a.id} className="overflow-visible hover-elevate">
                <CardAccentLine />
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.summary}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{a.tool}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Ouhve AI</Badge>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{relTime(a.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
