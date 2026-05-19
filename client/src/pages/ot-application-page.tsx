import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OtApplication, Member, Staff } from "@shared/schema";

export default function OtApplicationPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; applicationId: number | null }>({ open: false, applicationId: null });
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: otApplications = [], isLoading } = useQuery<OtApplication[]>({
    queryKey: ["/api/ot-applications"],
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // OT 신청 상태 변경 mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, preferredInstructorId }: { id: number; status: string; preferredInstructorId?: number }) => {
      return apiRequest("PATCH", `/api/ot-applications/${id}`, { status, preferredInstructorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-applications"] });
    },
    onError: () => {
      toast({ title: "오류", description: "상태 변경에 실패했습니다.", variant: "destructive" });
    },
  });

  const formatMonth = (date: Date) => `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, "0")}월`;

  const getMemberName = (memberId: number) => members.find(m => m.id === memberId)?.name || `회원 ${memberId}`;
  const getMemberPhone = (memberId: number) => members.find(m => m.id === memberId)?.phone || "-";
  const getStaffName = (staffId?: number | null) => {
    if (!staffId) return "-";
    return staffList.find(s => s.id === staffId)?.name || `강사 ${staffId}`;
  };

  // 이번 달 데이터만 필터
  const filteredApplications = otApplications.filter(app => {
    const d = new Date(app.applicationDate);
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      "대기": { label: "대기", className: "bg-amber-50 text-amber-600 border-amber-200" },
      "승인": { label: "승인", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      "거절": { label: "거절", className: "bg-red-50 text-red-600 border-red-200" },
      "완료": { label: "완료", className: "bg-blue-50 text-blue-600 border-blue-200" },
    };
    const s = map[status] || { label: status, className: "bg-gray-50 text-gray-600 border-gray-200" };
    return <Badge variant="outline" className={`text-xs shrink-0 ${s.className}`}>{s.label}</Badge>;
  };

  const handleApprove = (id: number) => {
    setApproveDialog({ open: true, applicationId: id });
    setSelectedInstructorId("");
  };

  const handleApproveConfirm = () => {
    if (!approveDialog.applicationId) return;
    updateStatusMutation.mutate(
      {
        id: approveDialog.applicationId,
        status: "승인",
        preferredInstructorId: selectedInstructorId ? parseInt(selectedInstructorId) : undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "승인 완료", description: "OT 신청이 승인되었습니다." });
          setApproveDialog({ open: false, applicationId: null });
        },
      }
    );
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate(
      { id, status: "거절" },
      {
        onSuccess: () => toast({ title: "거절 처리", description: "OT 신청이 거절되었습니다." }),
      }
    );
  };

  const handleComplete = (id: number) => {
    updateStatusMutation.mutate(
      { id, status: "완료" },
      {
        onSuccess: () => toast({ title: "완료 처리", description: "OT가 완료 처리되었습니다." }),
      }
    );
  };

  const activeInstructors = staffList.filter(s => s.status !== "퇴사");

  if (isLoading) {
    return (
      <div className="p-3 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 bg-white min-h-full">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base md:text-lg font-medium">{formatMonth(currentDate)}</h2>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-xs text-gray-500">
            <span>대기 <strong className="text-amber-600">{filteredApplications.filter(a => a.status === "대기").length}</strong></span>
            <span>승인 <strong className="text-emerald-600">{filteredApplications.filter(a => a.status === "승인").length}</strong></span>
            <span>완료 <strong className="text-blue-600">{filteredApplications.filter(a => a.status === "완료").length}</strong></span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm">
            이번 달
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3 px-3 md:px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 min-w-0">
          <div>이름</div>
          <div className="hidden md:block">연락처</div>
          <div className="hidden md:block">희망 강사</div>
          <div className="hidden md:block">구매 상품</div>
          <div className="hidden md:block">결제일</div>
          <div className="hidden md:block">유효기간</div>
          <div>OT 건수</div>
          <div className="hidden md:block">희망 일정</div>
          <div>상태</div>
          <div>관리</div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserCheck className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">이번 달 OT 신청 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredApplications.map((app) => (
              <div key={app.id} className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3 px-3 md:px-4 py-3 text-sm hover-elevate items-center">
                <div className="font-medium truncate">{getMemberName(app.memberId)}</div>
                <div className="text-gray-500 truncate hidden md:block">{getMemberPhone(app.memberId)}</div>
                <div className="truncate hidden md:block">{getStaffName(app.preferredInstructorId)}</div>
                <div className="text-gray-500 truncate hidden md:block">{app.productId ? `상품 ${app.productId}` : "-"}</div>
                <div className="text-gray-500 text-xs hidden md:block">{app.purchaseDate ? new Date(app.purchaseDate).toLocaleDateString("ko-KR") : "-"}</div>
                <div className="text-gray-500 text-xs hidden md:block">{app.expiryDate ? new Date(app.expiryDate).toLocaleDateString("ko-KR") : "-"}</div>
                <div className="text-center">{app.totalOtSessions || 0}건</div>
                <div className="text-gray-500 truncate text-xs hidden md:block">{app.preferredSchedule || "-"}</div>
                <div>{statusBadge(app.status || "대기")}</div>
                <div className="flex flex-col md:flex-row gap-1">
                  {(app.status === "대기") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-emerald-600 border-emerald-200 hover-elevate"
                        onClick={() => handleApprove(app.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-red-500 border-red-200 hover-elevate"
                        onClick={() => handleReject(app.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        거절
                      </Button>
                    </>
                  )}
                  {app.status === "승인" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover-elevate"
                      onClick={() => handleComplete(app.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      완료
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 승인 다이얼로그 - 트레이너 배정 */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, applicationId: approveDialog.applicationId })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>OT 신청 승인</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">트레이너를 배정하세요. (선택 사항)</p>
            <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
              <SelectTrigger>
                <SelectValue placeholder="트레이너 선택 (선택 사항)" />
              </SelectTrigger>
              <SelectContent>
                {activeInstructors.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.position || "트레이너"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, applicationId: null })}>취소</Button>
            <Button
              className="bg-emerald-600 hover-elevate text-white"
              onClick={handleApproveConfirm}
              disabled={updateStatusMutation.isPending}
            >
              승인 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
