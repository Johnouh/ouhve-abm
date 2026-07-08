// 🏋️ 개인 레슨 (PT) 상품 관리 페이지 (Personal Training Product Management Page)
// 🎯 Purpose: PT 상품 목록 조회, 등록, 수정, 삭제 기능 (PT product listing, registration, editing, deletion)
// 🔒 Security: 프랜차이즈별 상품 데이터 격리 (Franchise-based product data isolation)

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, Download, X, Plus, Edit, Trash2, Dumbbell, FileText, User, Banknote, Calendar, Hash, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { Product, Staff } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/custom-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const ptProductFormSchema = z.object({
  name: z.string().min(1, "상품명을 입력해주세요"),
  price: z.coerce.number().min(0, "가격을 입력해주세요"),
  duration: z.coerce.number().min(1, "기간을 입력해주세요"),
  sessions: z.coerce.number().min(1, "횟수를 입력해주세요"),
  description: z.string().optional(),
  status: z.string().default("활성"),
  appExposed: z.boolean().default(false),
  instructorId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  selectedDays: z.array(z.string()).optional(),
});

type PTProductFormData = z.infer<typeof ptProductFormSchema>;

export default function PersonalTrainingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const itemsPerPage = 5;
  const { toast } = useToast();

  // 🗓️ 요일 선택 상태 (Day selection state for class schedule)
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  
  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };
  
  const form = useForm<PTProductFormData>({
    resolver: zodResolver(ptProductFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      duration: 30,
      sessions: 10,
      description: "",
      status: "활성",
      appExposed: false,
      instructorId: "",
      startTime: "",
      endTime: "",
      selectedDays: [],
    },
  });

  // 📊 상품 데이터 조회 (Fetch product data)
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // 📊 강사 데이터 조회 (Fetch staff data)
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // 🔍 PT 카테고리 상품만 필터링 (Filter only PT category products)
  // 상품 페이지에서 등록된 "수업 상품" 중 lessonType이 "개인 레슨"인 것도 포함
  const ptProducts = useMemo(() => {
    return products.filter(p => 
      p.category === "PT" || 
      p.category === "개인레슨" ||
      (p.category === "수업 상품" && p.lessonType === "개인 레슨")
    );
  }, [products]);

  // 🔍 검색 및 상태 필터링 (Search and status filtering)
  const filteredProducts = useMemo(() => {
    return ptProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "전체" || 
        (filterStatus === "활성" && product.status === "활성") ||
        (filterStatus === "비활성" && product.status === "비활성") ||
        (filterStatus === "APP 노출" && product.appExposed === true);
      
      return matchesSearch && matchesStatus;
    });
  }, [ptProducts, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 📝 PT 상품 생성 뮤테이션 (Create PT product mutation)
  const createProductMutation = useMutation({
    mutationFn: async (data: PTProductFormData) => {
      const response = await apiRequest("POST", "/api/products", {
        ...data,
        category: "PT",
        lessonType: "개인 레슨",
        instructorId: data.instructorId ? parseInt(data.instructorId) : null,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        operatingDays: selectedDays.length > 0 ? selectedDays : undefined,
        status: "활성",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "PT 상품 등록 완료",
        description: "새로운 PT 상품이 성공적으로 등록되었습니다.",
      });
      setShowAddDialog(false);
      setSelectedDays([]);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 📝 PT 상품 수정 뮤테이션 (Update PT product mutation)
  const updateProductMutation = useMutation({
    mutationFn: async (data: PTProductFormData & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/products/${id}`, {
        ...updateData,
        category: "PT",
        lessonType: "개인 레슨",
        instructorId: updateData.instructorId ? parseInt(updateData.instructorId) : null,
        startTime: updateData.startTime || undefined,
        endTime: updateData.endTime || undefined,
        operatingDays: selectedDays.length > 0 ? selectedDays : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "PT 상품 수정 완료",
        description: "PT 상품이 성공적으로 수정되었습니다.",
      });
      setShowEditDialog(false);
      setSelectedProduct(null);
      setSelectedDays([]);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🗑️ PT 상품 삭제 뮤테이션 (Delete PT product mutation)
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "삭제 완료",
        description: "PT 상품이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitCreate = (data: PTProductFormData) => {
    createProductMutation.mutate(data);
  };

  const onSubmitEdit = (data: PTProductFormData) => {
    if (selectedProduct) {
      updateProductMutation.mutate({ ...data, id: selectedProduct.id });
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    form.reset({
      name: product.name,
      price: product.price || 0,
      duration: product.duration || 30,
      sessions: product.sessions || 10,
      description: product.description || "",
      status: product.status || "활성",
      appExposed: product.appExposed || false,
      instructorId: product.instructorId ? String(product.instructorId) : "",
      startTime: product.startTime || "",
      endTime: product.endTime || "",
      selectedDays: product.operatingDays || [],
    });
    setSelectedDays(product.operatingDays || []);
    setShowEditDialog(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "0원";
    return price.toLocaleString() + "원";
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "활성":
        return <Badge className="bg-green-100 text-green-700 hover-elevate">활성</Badge>;
      case "비활성":
        return <Badge className="bg-gray-100 text-gray-700 hover-elevate">비활성</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover-elevate">{status || "미정"}</Badge>;
    }
  };

  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  if (isLoading) {
    return (
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">개인 레슨</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">PT 상품 관리</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              총 {ptProducts.length}개 상품
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 md:space-y-6 px-3 md:px-6">
        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="상품명으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                data-testid="input-search-pt"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-32" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체</SelectItem>
                <SelectItem value="활성">활성</SelectItem>
                <SelectItem value="비활성">비활성</SelectItem>
                <SelectItem value="APP 노출">APP 노출</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover-elevate"
            onClick={() => {
              form.reset({
                name: "",
                price: 0,
                duration: 30,
                sessions: 10,
                description: "",
                status: "활성",
                appExposed: false,
                instructorId: "",
                startTime: "",
                endTime: "",
                selectedDays: [],
              });
              setSelectedDays([]);
              setShowAddDialog(true);
            }}
            data-testid="btn-add-pt-product"
          >
            <Plus className="w-4 h-4 mr-2" />
            PT 상품 등록
          </Button>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-lg">
          <CardAccentLine />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center font-semibold hidden md:table-cell">순번</TableHead>
                  <TableHead className="font-semibold">상품명</TableHead>
                  <TableHead className="font-semibold">가격</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">기간(일)</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">횟수</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">APP 노출</TableHead>
                  <TableHead className="font-semibold">상태</TableHead>
                  <TableHead className="font-semibold text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center space-y-4">
                        <Dumbbell className="w-12 h-12 text-gray-400" />
                        <p className="text-lg font-medium">등록된 PT 상품이 없습니다</p>
                        <p className="text-sm text-gray-400">PT 상품 등록 버튼을 클릭하여 새 상품을 추가하세요</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product, index) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer transition-all duration-200 hover-elevate"
                      data-testid={`row-pt-product-${product.id}`}
                    >
                      <TableCell className="text-center text-sm text-gray-600 hidden md:table-cell">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                            {product.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-orange-600">{formatPrice(product.price)}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-gray-700">{product.duration || "-"}일</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-gray-700">{product.sessions || "-"}회</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.appExposed ? (
                          <Badge className="bg-orange-100 text-orange-700 hover-elevate">노출</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 hover-elevate">비노출</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover-elevate"
                            onClick={() => handleEditProduct(product)}
                            data-testid={`btn-edit-pt-${product.id}`}
                          >
                            <Edit className="h-4 w-4 text-orange-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover-elevate"
                            onClick={() => handleDeleteProduct(product)}
                            data-testid={`btn-delete-pt-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>

            {/* Pagination */}
            {filteredProducts.length > itemsPerPage && (
              <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 gap-2">
                <div className="text-xs md:text-sm text-gray-600">
                  전체 {filteredProducts.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}개 표시
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-orange-500 hover-elevate" : ""}
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
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Excel Download Button */}
        <div className="flex justify-end">
          <Button variant="outline" className="w-full md:w-auto border-gray-300 hover-elevate">
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* Add PT Product Dialog - 상품 페이지와 동일한 디자인 */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setShowAddDialog(false);
            form.reset();
          }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-50 m-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">개인 레슨 등록</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  form.reset();
                }}
                className="p-2 rounded-lg hover-elevate"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 폼 내용 */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="p-6 space-y-5">
                {/* 상품명 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">상품명 *</Label>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="예: 1:1 PT 10회권" {...field} data-testid="input-pt-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 담당 강사 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">담당 강사</Label>
                  <FormField
                    control={form.control}
                    name="instructorId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pt-instructor">
                              <SelectValue placeholder="강사를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">선택 안함</SelectItem>
                            {staff.filter((s) => s.id != null && s.status !== '퇴사').map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 가격 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">가격 (원) *</Label>
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-pt-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 유효기간 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">유효기간</Label>
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="90"
                              className="w-24"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-pt-duration"
                            />
                            <span className="text-sm text-gray-500">일</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 이용 횟수 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <Hash className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">이용 횟수</Label>
                  <FormField
                    control={form.control}
                    name="sessions"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="10"
                              className="w-24"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-pt-sessions"
                            />
                            <span className="text-sm text-gray-500">회</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 수업 시간 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">수업 시간</Label>
                  <div className="flex-1 flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="input-pt-start-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="input-pt-end-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 수업 요일 */}
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0 mt-1">수업 요일</Label>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {days.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all hover-elevate ${
 selectedDays.includes(day)
 ? "bg-orange-500 border-orange-500 text-white"
 : "border-gray-300 text-gray-600 hover:border-orange-300"
 }`}
                          data-testid={`btn-day-${day}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">선택적: 고정 수업 요일을 설정할 수 있습니다</p>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setSelectedDays([]);
                      form.reset();
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-500 hover-elevate"
                    disabled={createProductMutation.isPending}
                    data-testid="btn-submit-pt-product"
                  >
                    {createProductMutation.isPending ? "등록 중..." : "개인 레슨 등록"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Edit PT Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>PT 상품 수정</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상품명</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 1:1 PT 10회권" {...field} data-testid="input-edit-pt-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>가격 (원)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-edit-pt-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>유효기간 (일)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="90"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-edit-pt-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이용 횟수</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-edit-pt-sessions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 수업 시간 */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시작 시간</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          data-testid="input-edit-pt-start-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>종료 시간</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          data-testid="input-edit-pt-end-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 수업 요일 */}
              <div>
                <Label className="text-sm font-medium">수업 요일 (선택)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all hover-elevate ${
 selectedDays.includes(day)
 ? "bg-orange-500 border-orange-500 text-white"
 : "border-gray-300 text-gray-600 hover:border-orange-300"
 }`}
                      data-testid={`btn-edit-day-${day}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="instructorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>담당 강사</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-pt-instructor">
                          <SelectValue placeholder="강사를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">선택 안함</SelectItem>
                        {staff.filter((s) => s.id != null && s.status !== '퇴사').map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상품 설명</FormLabel>
                    <FormControl>
                      <Input placeholder="상품에 대한 간단한 설명" {...field} data-testid="input-edit-pt-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상태</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-pt-status">
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="활성">활성</SelectItem>
                          <SelectItem value="비활성">비활성</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appExposed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>APP 노출</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "true")} 
                        value={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-pt-app-exposed">
                            <SelectValue placeholder="APP 노출 여부" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">노출</SelectItem>
                          <SelectItem value="false">비노출</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover-elevate"
                  disabled={updateProductMutation.isPending}
                  data-testid="btn-update-pt-product"
                >
                  {updateProductMutation.isPending ? "수정 중..." : "상품 수정"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedProduct(null);
        }}
        onConfirm={confirmDelete}
        title="PT 상품 삭제"
        description={`'${selectedProduct?.name || ''}'을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
      />
    </div>
  );
}
