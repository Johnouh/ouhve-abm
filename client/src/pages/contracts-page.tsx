import { useState } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Eye, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Contract {
  id: number;
  title: string;
  content?: string;
  createdAt: string;
  isActive: boolean;
}

interface ContractsPageProps {
  onCreateContract?: () => void;
}

export default function ContractsPage({ onCreateContract }: ContractsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const itemsPerPage = 5;
  const { toast } = useToast();
  
  const { data: contracts = [], isLoading, error } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contracts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "삭제 완료",
        description: "계약서가 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      setShowDeleteDialog(false);
      setSelectedContract(null);
    },
    onError: () => {
      toast({
        title: "삭제 실패",
        description: "계약서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/contracts/${id}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "상태 변경 완료",
        description: "계약서 상태가 변경되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
    },
    onError: () => {
      toast({
        title: "상태 변경 실패",
        description: "상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleViewDetail = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailDialog(true);
  };

  const handleDelete = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDeleteDialog(true);
  };

  const handleToggleActive = (contract: Contract) => {
    toggleActiveMutation.mutate({ id: contract.id, isActive: !contract.isActive });
  };

  const totalPages = Math.ceil(contracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = contracts.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="p-3 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">계약서 데이터를 불러오는 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 bg-white min-h-full relative">
      <div className="bg-white">
        {paginatedContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">등록된 계약서가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center hidden md:table-cell">번호</TableHead>
                <TableHead className="text-center">제목</TableHead>
                <TableHead className="text-center hidden md:table-cell">등록일</TableHead>
                <TableHead className="text-center">사용 여부</TableHead>
                <TableHead className="text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContracts.map((contract) => (
                <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                  <TableCell className="text-center hidden md:table-cell">{contract.id}</TableCell>
                  <TableCell className="text-center">{contract.title}</TableCell>
                  <TableCell className="text-center text-gray-600 hidden md:table-cell">
                    {new Date(contract.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleActive(contract)}
                      disabled={toggleActiveMutation.isPending}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                        contract.isActive
                          ? "bg-green-100 text-green-700 hover-elevate"
                          : "bg-gray-100 text-gray-600 hover-elevate"
                      }`}
                      data-testid={`button-toggle-active-${contract.id}`}
                    >
                      {contract.isActive ? "사용 중" : "미사용"}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(contract)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-view-${contract.id}`}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contract)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-delete-${contract.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}

        {contracts.length > itemsPerPage && (
          <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 mt-4 gap-3 md:gap-0">
            <div className="text-xs md:text-sm text-gray-600">
              전체 {contracts.length}개 중 {startIndex + 1}-{Math.min(endIndex, contracts.length)}개 표시
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                이전
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-orange-500 hover-elevate" : ""}
                  data-testid={`button-page-${page}`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8">
        <Button
          className="bg-orange-500 hover-elevate text-white px-4 md:px-6 py-3 rounded-lg shadow-lg text-sm md:text-base"
          size="lg"
          onClick={onCreateContract}
          data-testid="button-create-contract"
        >
          계약서 작성
        </Button>
      </div>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedContract?.title}</DialogTitle>
            <DialogDescription>
              등록일: {selectedContract?.createdAt && new Date(selectedContract.createdAt).toLocaleDateString('ko-KR')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg min-h-[200px] max-h-[60vh] overflow-y-auto">
            {selectedContract?.content ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedContract.content) }}
              />
            ) : (
              "계약서 내용이 없습니다."
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} data-testid="button-close-detail">
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계약서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedContract?.title}" 계약서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContract && deleteMutation.mutate(selectedContract.id)}
              className="bg-red-600 hover-elevate"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
