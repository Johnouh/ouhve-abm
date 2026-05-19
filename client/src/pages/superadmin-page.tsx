import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Building2,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
  Clock,
  Check,
  X,
  Copy,
} from "lucide-react";

interface FranchiseItem {
  id: number;
  name: string;
  type: string;
  description: string | null;
  status: string;
  code: string | null;
  parentId: number | null;
  ownerName: string | null;
  ownerPhone: string | null;
  businessName: string | null;
  pgProvider: string | null;
  pgServiceId: string | null;
  pgMode: string | null;
  hasPgConfig: boolean;
  hasApiKey: boolean;
  hasApiIv: boolean;
  createdAt: string;
}

interface PendingFranchise {
  id: number;
  name: string;
  type: string;
  businessName: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  status: string;
  createdAt: string;
}

export default function SuperadminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedFranchise, setSelectedFranchise] = useState<FranchiseItem | null>(null);
  const [editServiceId, setEditServiceId] = useState("");
  const [editMode, setEditMode] = useState("test");
  const [editApiKey, setEditApiKey] = useState("");
  const [editApiIv, setEditApiIv] = useState("");

  // Queries
  const { data: franchises = [], isLoading } = useQuery<FranchiseItem[]>({
    queryKey: ["/api/superadmin/franchises"],
  });

  const { data: pendingList = [], isLoading: pendingLoading } = useQuery<PendingFranchise[]>({
    queryKey: ["/api/superadmin/franchises/pending"],
  });

  // PG config mutation
  const updatePgMutation = useMutation({
    mutationFn: async ({ franchiseId, config }: { franchiseId: number; config: Record<string, string | undefined> }) => {
      const res = await apiRequest("PUT", `/api/superadmin/franchises/${franchiseId}/pg-config`, config);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/franchises"] });
      toast({ title: "PG 설정 저장 완료" });
      setSelectedFranchise(null);
    },
    onError: (error: Error) => {
      toast({ title: "PG 설정 저장 실패", description: error.message, variant: "destructive" });
    },
  });

  // Approval mutations
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/superadmin/franchises/${id}/approve`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/franchises/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/franchises"] });
      toast({ title: "승인 완료", description: `코드: ${data.code}` });
    },
    onError: (error: Error) => {
      toast({ title: "승인 실패", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/superadmin/franchises/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/franchises/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/franchises"] });
      toast({ title: "거절 완료" });
    },
    onError: (error: Error) => {
      toast({ title: "거절 실패", description: error.message, variant: "destructive" });
    },
  });

  const openEditDialog = (franchise: FranchiseItem) => {
    setSelectedFranchise(franchise);
    setEditServiceId(franchise.pgServiceId || "");
    setEditMode(franchise.pgMode || "test");
    setEditApiKey("");
    setEditApiIv("");
  };

  const handleSave = () => {
    if (!selectedFranchise) return;
    updatePgMutation.mutate({
      franchiseId: selectedFranchise.id,
      config: {
        pgProvider: "billgate",
        pgServiceId: editServiceId || undefined,
        pgMode: editMode,
        pgApiKey: editApiKey || undefined,
        pgApiIv: editApiIv || undefined,
      },
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "코드 복사됨" });
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-200">승인</Badge>;
    if (status === "pending") return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-200">대기</Badge>;
    if (status === "rejected") return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 border-red-200">거절</Badge>;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-red-500 shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">프랜차이즈 관리</h1>
        </div>
        <Badge variant="outline" className="text-xs">
          <Shield className="w-3 h-3 mr-1 shrink-0" />
          Superadmin
        </Badge>
      </div>

      <Tabs defaultValue="approval" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="approval" className="flex-1">
            프랜차이즈 승인
            {pendingList.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0 tabular-nums">
                {pendingList.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pg" className="flex-1">PG 설정 관리</TabsTrigger>
        </TabsList>

        {/* Approval Tab */}
        <TabsContent value="approval" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold">승인 대기 ({pendingList.length})</span>
              </div>

              {pendingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : pendingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">대기 중인 가입 신청이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingList.map((f) => (
                    <div key={f.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">{f.businessName || f.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">#{f.id}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-6 text-xs text-muted-foreground">
                            <span>{f.ownerName}</span>
                            <span>{f.ownerPhone}</span>
                            <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => rejectMutation.mutate(f.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="w-3 h-3 mr-1" />
                            거절
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(f.id)}
                            disabled={approveMutation.isPending}
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3 mr-1" />
                            )}
                            승인
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approved franchise list with codes */}
          <Card className="mt-4">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold">전체 프랜차이즈 ({franchises.length})</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {franchises.map((f) => (
                    <div key={f.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{f.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">#{f.id}</span>
                            {statusBadge(f.status)}
                            {f.type === "branch" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">지점</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {f.code ? (
                              <button
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                                onClick={() => copyCode(f.code!)}
                              >
                                <Copy className="w-3 h-3 shrink-0" />
                                <span className="tabular-nums">{f.code}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">코드 없음</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PG Settings Tab */}
        <TabsContent value="pg" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">PG 설정 ({franchises.length})</span>
                  <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {franchises.map((franchise) => (
                    <div
                      key={franchise.id}
                      className="flex items-center justify-between px-4 py-3 hover-elevate cursor-pointer"
                      onClick={() => openEditDialog(franchise)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{franchise.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">#{franchise.id}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {franchise.hasPgConfig ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="text-xs text-emerald-400 tabular-nums">{franchise.pgServiceId}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {franchise.pgMode === "production" ? "운영" : "테스트"}
                                </Badge>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                <span className="text-xs text-muted-foreground">PG 미설정</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PG Edit Dialog */}
      <Dialog open={!!selectedFranchise} onOpenChange={(open) => !open && setSelectedFranchise(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              {selectedFranchise?.name} - PG 설정
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>PG사</Label>
              <Input value="빌게이트 (Billgate)" disabled />
            </div>

            <div>
              <Label>SERVICE_ID (가맹점 ID)</Label>
              <Input
                placeholder="M2103140"
                value={editServiceId}
                onChange={(e) => setEditServiceId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">테스트: M2103140</p>
            </div>

            <div>
              <Label>모드</Label>
              <Select value={editMode} onValueChange={setEditMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">테스트</SelectItem>
                  <SelectItem value="production">실거래</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>API Key (암호화 키)</Label>
              <Input
                placeholder={selectedFranchise?.hasApiKey ? "설정됨 (변경 시 입력)" : "Base64 인코딩 키"}
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
                type="password"
              />
            </div>

            <div>
              <Label>API IV</Label>
              <Input
                placeholder={selectedFranchise?.hasApiIv ? "설정됨 (변경 시 입력)" : "IV 값"}
                value={editApiIv}
                onChange={(e) => setEditApiIv(e.target.value)}
                type="password"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={updatePgMutation.isPending}
            >
              {updatePgMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : "설정 저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
