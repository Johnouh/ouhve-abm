// 🗑️ 회원 삭제 페이지 (Member Delete Page)
// 🎯 Purpose: 회원 삭제 기능을 제공하는 페이지 (Page providing member deletion functionality)
// 🔒 Security: 삭제 전 확인 절차 및 안전한 삭제 처리 (Confirmation process and safe deletion handling)

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Search, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { type Member } from "@shared/schema";
import { apiRequest, parseApiResponse, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MemberDeletePage() {
  // 🔍 검색 상태 (Search state)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const { toast } = useToast();

  // 👥 회원 데이터 조회 (Fetch members data)
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // 🗑️ 회원 삭제 뮤테이션 (Delete member mutation)
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const res = await apiRequest('DELETE', `/api/members/${memberId}`);
      return await parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "삭제 완료",
        description: "회원이 성공적으로 삭제되었습니다.",
      });
      setShowDeleteDialog(false);
      setSelectedMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🔍 검색 필터링 (Search filtering)
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

  // 🔄 체크박스 선택 로직 (Checkbox selection logic)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(filteredMembers.map(member => member.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleMemberSelect = (memberId: number, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const isAllSelected = filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length;
  const isIndeterminate = selectedMembers.length > 0 && selectedMembers.length < filteredMembers.length;

  // 🎨 상태 배지 스타일 (Status badge styling)
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "활성 회원":
        return "default";
      case "휴회":
        return "secondary";
      case "만료":
        return "destructive";
      default:
        return "outline";
    }
  };

  // 📅 날짜 포맷팅 (Date formatting)
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 🗑️ 삭제 처리 함수 (Delete handler)
  const handleDelete = () => {
    if (selectedMember) {
      deleteMemberMutation.mutate(selectedMember.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🔤 제목 및 설명 (Title and description) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">회원 삭제</h1>
          <p className="text-gray-600">삭제할 회원을 선택하세요 ({filteredMembers.length}명)</p>
        </div>
      </div>

      {/* ⚠️ 주의사항 알림 (Warning notice) */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>주의:</strong> 회원 삭제 시 관련된 모든 데이터(출석 기록, 결제 내역, 상담 기록 등)가 함께 삭제됩니다. 
          삭제된 데이터는 복구할 수 없으니 신중하게 진행해 주세요.
        </AlertDescription>
      </Alert>

      {/* 🔍 검색 필터 (Search filter) */}
      <Card>
        <CardAccentLine />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="회원 이름이나 전화번호를 검색하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-200 hover-elevate"
                disabled={selectedMembers.length === 0}
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                선택 삭제 ({selectedMembers.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 👥 회원 목록 테이블 (Members list table) */}
      <Card>
        <CardAccentLine />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">이름</th>
                  <th className="text-left p-3 font-medium text-gray-700">연락처 (전화)</th>
                  <th className="text-left p-3 font-medium text-gray-700">최초 가입일</th>
                  <th className="text-left p-3 font-medium text-gray-700">회원권 만료일</th>
                  <th className="text-left p-3 font-medium text-gray-700">상태</th>
                  <th className="text-left p-3 font-medium text-gray-700">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-gray-500" colSpan={7}>
                      {searchTerm ? "검색 결과가 없습니다." : "등록된 회원이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b hover-elevate">
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          className="rounded" 
                          checked={selectedMembers.includes(member.id)}
                          onChange={(e) => handleMemberSelect(member.id, e.target.checked)}
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          {member.email && (
                            <div className="text-xs text-gray-500">{member.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{member.phone}</td>
                      <td className="p-3 text-gray-600">{formatDate(member.createdAt)}</td>
                      <td className="p-3 text-gray-600">-</td>
                      <td className="p-3">
                        <Badge variant={getStatusBadgeVariant(member.status)}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>



      {/* 🗑️ 삭제 확인 다이얼로그 (Delete confirmation dialog) */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md" aria-describedby="delete-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              회원 삭제 확인
            </DialogTitle>
            <DialogDescription id="delete-dialog-description" className="sr-only">
              선택한 회원을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <h3 className="font-semibold text-red-900">{selectedMember.name}</h3>
                  <p className="text-sm text-red-700">{selectedMember.phone}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>위 회원을 정말로 삭제하시겠습니까?</strong></p>
                <ul className="list-disc list-inside space-y-1 text-red-600">
                  <li>모든 출석 기록이 삭제됩니다</li>
                  <li>결제 내역이 삭제됩니다</li>
                  <li>상담 기록이 삭제됩니다</li>
                  <li>삭제된 데이터는 복구할 수 없습니다</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleteMemberMutation.isPending}
                >
                  취소
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteMemberMutation.isPending}
                >
                  {deleteMemberMutation.isPending ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🗑️ 일괄 삭제 확인 다이얼로그 (Bulk delete confirmation dialog) */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              일괄 삭제 확인
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              선택한 {selectedMembers.length}명의 회원을 모두 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-700">
                <strong>삭제 예정 회원: {selectedMembers.length}명</strong>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>다음 데이터가 모두 삭제됩니다:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-red-600">
                <li>회원 정보 및 출석 기록</li>
                <li>결제 내역 및 상담 기록</li>
                <li>관련된 모든 데이터</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkDeleteDialog(false)}
              >
                취소
              </Button>
              <Button 
                variant="destructive" 
                onClick={async () => {
                  try {
                    await Promise.all(
                      selectedMembers.map(memberId => 
                        apiRequest('DELETE', `/api/members/${memberId}`)
                      )
                    );
                    queryClient.invalidateQueries({ queryKey: ["/api/members"] });
                    toast({
                      title: "삭제 완료",
                      description: `${selectedMembers.length}명의 회원이 성공적으로 삭제되었습니다.`,
                    });
                    setSelectedMembers([]);
                    setShowBulkDeleteDialog(false);
                  } catch (error) {
                    toast({
                      title: "삭제 실패",
                      description: "일부 회원 삭제에 실패했습니다.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}