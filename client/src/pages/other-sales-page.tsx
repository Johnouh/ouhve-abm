import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/ui/custom-dialog";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type OtherSale, type InsertOtherSale } from "@shared/schema";

const otherSaleFormSchema = z.object({
  productName: z.string().min(1, "상품명을 입력해주세요"),
  customerName: z.string().optional(),
  amount: z.string().min(1, "금액을 입력해주세요"),
  paymentMethod: z.string().min(1, "결제수단을 선택해주세요"),
  period: z.string().optional(),
  saleDate: z.string().min(1, "날짜를 선택해주세요"),
});

type OtherSaleFormValues = z.infer<typeof otherSaleFormSchema>;

export default function OtherSalesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<OtherSale | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSaleForDelete, setSelectedSaleForDelete] = useState<OtherSale | null>(null);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addForm = useForm<OtherSaleFormValues>({
    resolver: zodResolver(otherSaleFormSchema),
    defaultValues: {
      productName: "",
      customerName: "",
      amount: "",
      paymentMethod: "카드",
      period: "",
      saleDate: new Date().toISOString().split('T')[0],
    },
  });

  const editForm = useForm<OtherSaleFormValues>({
    resolver: zodResolver(otherSaleFormSchema),
    defaultValues: {
      productName: "",
      customerName: "",
      amount: "",
      paymentMethod: "카드",
      period: "",
      saleDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: salesList = [] } = useQuery<OtherSale[]>({
    queryKey: ["/api/other-sales"],
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: Partial<InsertOtherSale>) => {
      const res = await apiRequest("POST", "/api/other-sales", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "매출 추가에 실패했습니다" }));
        throw new Error(errorData.error || "매출 추가에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/other-sales"] });
      toast({ title: "성공", description: "매출이 추가되었습니다." });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: () => {
      toast({ title: "오류", description: "매출 추가에 실패했습니다.", variant: "destructive" });
    },
  });

  const updateSaleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertOtherSale> }) => {
      const res = await apiRequest("PUT", `/api/other-sales/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "매출 수정에 실패했습니다" }));
        throw new Error(errorData.error || "매출 수정에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/other-sales"] });
      toast({ title: "성공", description: "매출이 수정되었습니다." });
      setIsEditDialogOpen(false);
      setEditingSale(null);
      editForm.reset();
    },
    onError: () => {
      toast({ title: "오류", description: "매출 수정에 실패했습니다.", variant: "destructive" });
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/other-sales/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "매출 삭제에 실패했습니다" }));
        throw new Error(errorData.error || "매출 삭제에 실패했습니다");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/other-sales"] });
      toast({ title: "성공", description: "매출이 삭제되었습니다." });
      setShowDeleteDialog(false);
      setSelectedSaleForDelete(null);
    },
    onError: () => {
      toast({ title: "오류", description: "매출 삭제에 실패했습니다.", variant: "destructive" });
    },
  });

  const handleAddSale = (values: OtherSaleFormValues) => {
    const parsedAmount = parseInt(values.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "오류", description: "유효한 금액을 입력해 주세요.", variant: "destructive" });
      return;
    }
    createSaleMutation.mutate({
      productName: values.productName,
      customerName: values.customerName || undefined,
      amount: parsedAmount,
      paymentMethod: values.paymentMethod,
      period: values.period || undefined,
      saleDate: new Date(values.saleDate),
    });
  };

  const handleEditSale = (values: OtherSaleFormValues) => {
    if (!editingSale) return;
    const parsedAmount = parseInt(values.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "오류", description: "유효한 금액을 입력해 주세요.", variant: "destructive" });
      return;
    }
    updateSaleMutation.mutate({
      id: editingSale.id,
      data: {
        productName: values.productName,
        customerName: values.customerName || undefined,
        amount: parsedAmount,
        paymentMethod: values.paymentMethod,
        period: values.period || undefined,
        saleDate: new Date(values.saleDate),
      },
    });
  };

  const handleDeleteSale = (sale: OtherSale) => {
    setSelectedSaleForDelete(sale);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedSaleForDelete) {
      deleteSaleMutation.mutate(selectedSaleForDelete.id);
    }
  };

  const openEditDialog = (sale: OtherSale) => {
    setEditingSale(sale);
    editForm.reset({
      productName: sale.productName,
      customerName: sale.customerName || "",
      amount: sale.amount.toString(),
      paymentMethod: sale.paymentMethod,
      period: sale.period || "",
      saleDate: new Date(sale.saleDate).toISOString().split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    addForm.reset({
      productName: "",
      customerName: "",
      amount: "",
      paymentMethod: "카드",
      period: "",
      saleDate: new Date().toISOString().split('T')[0],
    });
    setIsAddDialogOpen(true);
  };

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월`;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const getPaymentMethodBadge = (paymentMethod: string) => {
    switch (paymentMethod) {
      case '카드':
        return <Badge className="bg-blue-100 text-blue-700 hover-elevate">{paymentMethod}</Badge>;
      case '현금':
        return <Badge className="bg-green-100 text-green-700 hover-elevate">{paymentMethod}</Badge>;
      case '계좌이체':
        return <Badge className="bg-gray-100 text-gray-700 hover-elevate">{paymentMethod}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover-elevate">{paymentMethod}</Badge>;
    }
  };

  const currentMonthSales = salesList.filter(sale => {
    const saleDate = new Date(sale.saleDate);
    return saleDate.getMonth() === currentDate.getMonth() && 
           saleDate.getFullYear() === currentDate.getFullYear();
  });

  const totalAmount = currentMonthSales.reduce((sum, sale) => sum + sale.amount, 0);

  const totalPages = Math.ceil(currentMonthSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = currentMonthSales.slice(startIndex, endIndex);

  useMemo(() => {
    setCurrentPage(1);
  }, [currentDate]);

  return (
    <div className="p-3 md:p-6 bg-white min-h-full relative">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-8 w-8 p-0"
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-medium" data-testid="text-current-month">{formatMonth(currentDate)}</h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 p-0"
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select defaultValue="별칭">
            <SelectTrigger className="w-20 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="별칭">별칭</SelectItem>
              <SelectItem value="이름">이름</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="전체">
            <SelectTrigger className="w-16 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              <SelectItem value="활성">활성</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium" data-testid="text-sales-count">매출 목록 ({currentMonthSales.length}건)</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <div className="text-sm text-blue-600 mb-1">이번 달 매출 건수</div>
          <div className="text-xl md:text-2xl font-bold text-blue-700 tabular-nums" data-testid="text-sales-count-summary">
            {currentMonthSales.length}건
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
          <div className="text-sm text-green-600 mb-1">이번 달 총 매출</div>
          <div className="text-xl md:text-2xl font-bold text-green-700 tabular-nums" data-testid="text-total-amount">
            {totalAmount.toLocaleString()}원
          </div>
        </div>
      </div>

      {currentMonthSales.length > 0 ? (
        <div className="space-y-2 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-center hidden md:table-cell">번호</TableHead>
                <TableHead className="text-center">날짜</TableHead>
                <TableHead className="text-center">상품</TableHead>
                <TableHead className="text-center hidden md:table-cell">고객</TableHead>
                <TableHead className="text-center hidden md:table-cell">결제 수단</TableHead>
                <TableHead className="text-center hidden md:table-cell">회차/기간</TableHead>
                <TableHead className="text-center">상품 매출</TableHead>
                <TableHead className="text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.map((sale, index) => (
                <TableRow 
                  key={sale.id} 
                  className="hover-elevate"
                  data-testid={`row-sale-${sale.id}`}
                >
                  <TableCell className="text-center text-sm text-gray-600 hidden md:table-cell">{startIndex + index + 1}</TableCell>
                  <TableCell className="text-center text-sm">{formatDate(sale.saleDate)}</TableCell>
                  <TableCell className="text-center text-sm font-medium">{sale.productName}</TableCell>
                  <TableCell className="text-center text-sm hidden md:table-cell">{sale.customerName || '-'}</TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    {getPaymentMethodBadge(sale.paymentMethod)}
                  </TableCell>
                  <TableCell className="text-center text-sm hidden md:table-cell">{sale.period || '-'}</TableCell>
                  <TableCell className="text-center text-sm font-medium text-blue-600 tabular-nums">
                    {sale.amount.toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(sale)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-edit-sale-${sale.id}`}
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSale(sale)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-delete-sale-${sale.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {currentMonthSales.length > itemsPerPage && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-2 md:px-4 py-4 mt-4">
              <div className="text-sm text-gray-600 text-center md:text-left">
                전체 {currentMonthSales.length}개 중 {startIndex + 1}-{Math.min(endIndex, currentMonthSales.length)}개 표시
              </div>
              <div className="flex items-center justify-center md:justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-500 hover-elevate" : ""}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1L5 5l4 4" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-4">이번 달 매출 정보가 없습니다.</p>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-gray-600 border-gray-300"
            onClick={openAddDialog}
            data-testid="button-add-sale-empty"
          >
            매출 추가
          </Button>
        </div>
      )}

      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8">
        <Button
          className="bg-blue-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg hover-elevate"
          size="lg"
          onClick={openAddDialog}
          data-testid="button-add-sale"
        >
          <Plus className="h-5 w-5 mr-2" />
          매출 추가
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>매출 추가</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddSale)} className="space-y-4 py-4">
              <FormField
                control={addForm.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상품명 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="상품명을 입력하세요"
                        data-testid="input-product-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고객명</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="고객명을 입력하세요"
                        data-testid="input-customer-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>금액 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="금액을 입력하세요"
                        data-testid="input-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>결제 수단</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="카드">카드</SelectItem>
                        <SelectItem value="현금">현금</SelectItem>
                        <SelectItem value="계좌이체">계좌이체</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>회차/기간</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="예: 1개월, 3회차"
                        data-testid="input-period"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="saleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>날짜</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        data-testid="input-sale-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>취소</Button>
                <Button 
                  type="submit"
                  className="bg-blue-500 hover-elevate"
                  disabled={createSaleMutation.isPending}
                  data-testid="button-confirm-add"
                >
                  {createSaleMutation.isPending ? "추가 중..." : "추가"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>매출 수정</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSale)} className="space-y-4 py-4">
              <FormField
                control={editForm.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상품명 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="상품명을 입력하세요"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고객명</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="고객명을 입력하세요"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>금액 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="금액을 입력하세요"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>결제 수단</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="카드">카드</SelectItem>
                        <SelectItem value="현금">현금</SelectItem>
                        <SelectItem value="계좌이체">계좌이체</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>회차/기간</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="예: 1개월, 3회차"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="saleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>날짜</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>취소</Button>
                <Button 
                  type="submit"
                  className="bg-blue-500 hover-elevate"
                  disabled={updateSaleMutation.isPending}
                >
                  {updateSaleMutation.isPending ? "수정 중..." : "수정"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedSaleForDelete(null);
        }}
        onConfirm={confirmDelete}
        title="매출 삭제"
        itemName={selectedSaleForDelete?.productName}
        description={`"${selectedSaleForDelete?.productName || ''}" 매출을 삭제하시겠습니까?`}
      />
    </div>
  );
}
