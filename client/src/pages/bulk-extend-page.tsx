import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, Users, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import type { Member } from "@shared/schema";

/**
 * OUHVE ABM — GAP-21 (AssistFit page-009 흡수)
 * 회원 단체 연장 — 휴장·사고·이벤트 보상 시 다수 회원 회원권 일괄 N일 연장.
 */

interface ExtendResult {
  extended: { memberId: number; memberName: string; originalEndDate: string; newEndDate: string }[];
  skipped: { memberId: number; reason: string }[];
  totalExtended: number;
  totalSkipped: number;
}

export default function BulkExtendPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [days, setDays] = useState<number>(7);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<ExtendResult | null>(null);

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return members;
    return members.filter((m) =>
      m.name.includes(q) || (m.phone ?? "").includes(q),
    );
  }, [members, search]);

  const allSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filtered.forEach((m) => next.delete(m.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((m) => next.add(m.id));
      setSelected(next);
    }
  };

  const extendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/memberships/bulk-extend", {
        memberIds: Array.from(selected),
        days,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      return (await res.json()) as ExtendResult;
    },
    onSuccess: (r) => {
      setResult(r);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner-report"] });
      toast({
        title: "단체 연장 완료",
        description: `${r.totalExtended}명 연장, ${r.totalSkipped}명 건너뜀`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "연장 실패", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = selected.size > 0 && days > 0 && reason.trim().length >= 2;

  return (
    <div className="p-3 md:p-6 bg-background min-h-full">

      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
          <CalendarPlus className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">단체 연장</h1>
          <p className="text-sm text-muted-foreground truncate">휴장·사고·이벤트 보상 일괄 처리</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 좌: 회원 선택 */}
        <Card className="lg:col-span-2 hover-elevate overflow-visible">
          <CardAccentLine />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                회원 선택 ({selected.size}명)
              </CardTitle>
              <Badge variant="outline" className="shrink-0">
                {filtered.length} / {members.length}
              </Badge>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                className="pl-9"
                placeholder="이름 또는 연락처 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">검색 결과 없음</div>
            ) : (
              <>
                <button
                  onClick={toggleAll}
                  className="w-full mb-2 px-3 py-2 text-xs font-medium rounded-md hover-elevate border border-border text-left flex items-center gap-2"
                >
                  <input type="checkbox" checked={allSelected} readOnly className="w-4 h-4 accent-primary" />
                  검색 결과 전체 {allSelected ? "해제" : "선택"} ({filtered.length})
                </button>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {filtered.map((m) => {
                    const checked = selected.has(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md hover-elevate cursor-pointer ${
                          checked ? "bg-primary/5" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(selected);
                            if (checked) next.delete(m.id); else next.add(m.id);
                            setSelected(next);
                          }}
                          className="w-4 h-4 accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{m.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{m.phone}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">{m.status}</Badge>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 우: 연장 설정 */}
        <Card className="hover-elevate overflow-visible h-fit">
          <CardAccentLine />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              연장 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <Label className="text-xs">연장 일수</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={days}
                  onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 0)))}
                />
                <span className="flex items-center text-sm text-muted-foreground">일</span>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {[3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className="text-xs px-2 py-1 rounded hover-elevate border border-border"
                  >
                    {d}일
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">사유 (필수)</Label>
              <Input
                className="mt-1"
                placeholder="예: 시설 점검 휴장, 단수 보상"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs">메모 (선택)</Label>
              <Textarea
                className="mt-1"
                rows={2}
                placeholder="추가 설명"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* 미리보기 */}
            <div className="px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                <span className="font-medium">처리 미리보기</span>
              </div>
              <div className="text-muted-foreground">
                선택된 <strong className="text-primary tabular-nums">{selected.size}</strong>명 회원권 종료일을
                <strong className="text-primary tabular-nums"> {days}</strong>일 뒤로 연장
              </div>
            </div>

            <Button
              onClick={() => extendMutation.mutate()}
              disabled={!canSubmit || extendMutation.isPending}
              className="w-full"
              size="lg"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              {extendMutation.isPending ? "처리 중..." : `${selected.size}명 일괄 연장`}
            </Button>

            {!canSubmit && (
              <p className="text-[10px] text-muted-foreground text-center">
                회원 선택 + 사유 2글자 이상 필요
              </p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 결과 */}
      {result && (
        <Card className="mt-6 hover-elevate overflow-visible">
          <CardAccentLine />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              처리 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs text-muted-foreground">연장 완료</div>
                <div className="text-2xl font-bold text-emerald-400 tabular-nums">{result.totalExtended}</div>
              </div>
              <div className="px-3 py-2 rounded-md bg-amber-400/10 border border-amber-400/20">
                <div className="text-xs text-muted-foreground">건너뜀</div>
                <div className="text-2xl font-bold text-amber-400 tabular-nums">{result.totalSkipped}</div>
              </div>
            </div>
            {result.skipped.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" aria-hidden="true" />
                  건너뛴 회원
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {result.skipped.map((s) => (
                    <div key={s.memberId} className="text-xs flex justify-between px-2 py-1">
                      <span>회원 #{s.memberId}</span>
                      <span className="text-muted-foreground">{s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
