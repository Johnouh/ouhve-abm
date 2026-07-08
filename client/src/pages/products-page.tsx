// 🛍️ 상품 관리 페이지 (Product Management Page)
// 🎯 Purpose: 체육관 상품(회원권, 개인PT 등) 등록, 조회, 관리를 위한 통합 페이지 (Integrated page for gym product registration, viewing, and management)
// 🔒 Security: 프랜차이즈별 상품 데이터 격리 (Franchise-based product data isolation)
// 📊 Features: 상품 카테고리별 관리, 상태별 필터링, 상세정보 관리 (Product category management, status filtering, detailed information management)

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Product, type Staff, type InsertProduct } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Edit, Trash2, X, Users, Dumbbell, Package, Clock, Calendar, FileText, Banknote, User, Hash, Settings, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CustomDialog, DeleteConfirmDialog, AppExposeConfirmDialog } from "@/components/ui/custom-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductsPageProps {
  selectedProductId?: number;
  onProductSelect?: (productId: number | undefined) => void;
  onNavigate?: (location: string[]) => void;
}

export default function ProductsPage({ selectedProductId, onProductSelect, onNavigate }: ProductsPageProps = {}) {
  // 🔒 인증된 사용자 정보 (Authenticated user info)
  const { user } = useAuth();
  
  // 📋 UI 상태 관리 (UI state management)
  const [showAddDialog, setShowAddDialog] = useState(false); // 상품 등록 다이얼로그 표시
  const [showEditDialog, setShowEditDialog] = useState(false); // 상품 편집 다이얼로그 표시
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // 편집 중인 상품 (Product being edited)
  const [activeCategory, setActiveCategory] = useState("회원권"); // 활성 카테고리 (Active category)
  const [activeTab, setActiveTab] = useState("전체 상품"); // 활성 탭 (Active tab)
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 (Current page for pagination)
  const itemsPerPage = 5; // 페이지당 항목 수 (Items per page)
  
  // 🎨 커스텀 팝업 상태 관리 (Custom popup state management)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAppExposeDialog, setShowAppExposeDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // 📝 상품 폼 상태 (Product form state)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "1",
    durationType: "월",
    sessions: "0",
    description: "",
    lessonType: "", // 개인 레슨 또는 그룹 수업
    instructorId: "",
    maxParticipants: "10",
    minParticipants: "1",
    status: "활성",
    appExposed: false,
    // 그룹 수업 전용 필드
    startTime: "",
    endTime: "",
    selectedDays: [] as string[],
    // 락커 상품 전용 필드
    lockerSection: "",
  });
  
  // 📂 다이얼로그가 열릴 때 고정된 카테고리 (Fixed category when dialog opens)
  const [dialogCategory, setDialogCategory] = useState("");
  
  const { toast } = useToast();

  // 📊 상품 데이터 조회 (Fetch product data)
  // 🔒 보안: 프랜차이즈별 상품 데이터만 조회 (Security: Only fetch franchise-specific product data)
  const { data: productsList = [], isLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: 2,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // 👨‍🏫 직원 데이터 조회 (Fetch staff data for instructor selection)
  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // 🔒 락커 설정 조회 (Fetch locker settings for section selection)
  const { data: lockerSettings } = useQuery<{
    sections: string[];
    sectionDetails: Array<{name: string; createdBy: string; createdAt: string; lockerCount?: number; monthlyFee?: number}>;
  }>({
    queryKey: ["/api/locker-settings"],
  });

  // 🏷️ 활성화된 락커 구역 목록 (Active locker sections)
  const activeSections = lockerSettings?.sectionDetails?.map(s => s.name) || lockerSettings?.sections || [];

  // 🔍 상품 필터링 (Filter products by active category and tab)
  // 📊 카테고리 및 상태별 상품 필터링 (Filter products by category and status)
  const filteredProducts = productsList.filter(product => {
    // 카테고리 필터링
    if (product.category !== activeCategory) return false;
    
    // 탭별 필터링
    if (activeTab === "전체 상품") return true;
    if (activeTab === "APP 노출 상품") return product.appExposed === true;
    if (activeTab === "APP 비노출 상품") return product.appExposed === false;
    if (activeTab === "비활성화") return product.status === "비활성";
    
    return true;
  });

  // 페이지네이션 계산 (Pagination calculations)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 탭이나 카테고리 변경 시 첫 페이지로 리셋
  useMemo(() => {
    setCurrentPage(1);
  }, [activeTab, activeCategory]);



  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      // 🔄 강력한 캐시 무효화 (Aggressive cache invalidation)
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.removeQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
      
      // 🔄 모든 products 관련 캐시 제거 (Remove all products related cache)
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('products'))
      });
      
      toast({
        title: "상품 삭제 완료",
        description: "상품이 성공적으로 삭제되었습니다.",
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

  // 상품 상태 변경 mutation (활성/비활성)
  const updateProductStatusMutation = useMutation({
    mutationFn: async ({ productId, status }: { productId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, { status });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      const statusText = variables.status === "활성" ? "활성화" : "비활성화";
      toast({
        title: `상품 ${statusText} 완료`,
        description: `상품이 성공적으로 ${statusText}되었습니다.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // APP 노출 상태 변경 mutation
  const updateAppExposeMutation = useMutation({
    mutationFn: async ({ productId, appExposed }: { productId: number, appExposed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, { appExposed });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      const statusText = variables.appExposed ? "APP 노출" : "APP 노출 해제";
      toast({
        title: `${statusText} 완료`,
        description: `상품이 성공적으로 ${statusText}되었습니다.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 상품 생성 mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "상품 등록 완료",
        description: "상품이 성공적으로 등록되었습니다.",
      });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 상품 수정 mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: number } & Partial<InsertProduct>) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/products/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "상품 수정 완료",
        description: "상품이 성공적으로 수정되었습니다.",
      });
      setShowEditDialog(false);
      setEditingProduct(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 폼 초기화
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      price: "",
      duration: "1",
      durationType: "월",
      sessions: "0",
      description: "",
      lessonType: "",
      instructorId: "",
      maxParticipants: "10",
      minParticipants: "1",
      status: "활성",
      appExposed: false,
      startTime: "",
      endTime: "",
      selectedDays: [],
      lockerSection: "",
    });
    setDialogCategory("");
  }, []);

  // 상품 추가 다이얼로그 열기
  const handleOpenAddDialog = useCallback(() => {
    if (!user?.franchiseId) {
      toast({ title: "잠시만요", description: "사용자 정보를 불러오는 중입니다.", variant: "default" });
      return;
    }
    resetForm();
    setDialogCategory(activeCategory); // 다이얼로그 열 때 현재 카테고리 고정
    setShowAddDialog(true);
  }, [resetForm, activeCategory, user?.franchiseId, toast]);

  // 상품 수정 다이얼로그 열기
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogCategory(product.category); // 수정 시 상품의 카테고리 고정
    setFormData({
      name: product.name,
      price: String(product.price),
      duration: String(product.duration || 1),
      durationType: product.durationType || "월",
      sessions: String(product.sessions || 0),
      description: product.description || "",
      lessonType: product.lessonType || "",
      instructorId: product.instructorId ? String(product.instructorId) : "",
      maxParticipants: String(product.maxParticipants || 10),
      minParticipants: String(product.minParticipants || 1),
      status: product.status || "활성",
      appExposed: product.appExposed || false,
      startTime: product.startTime || "",
      endTime: product.endTime || "",
      selectedDays: product.operatingDays || [],
      lockerSection: product.lockerSection || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const handleAppExpose = (product: Product) => {
    setSelectedProduct(product);
    setShowAppExposeDialog(true);
  };

  const handleDeactivate = (product: Product) => {
    const newStatus = product.status === "비활성" ? "활성" : "비활성";
    updateProductStatusMutation.mutate({
      productId: product.id,
      status: newStatus
    });
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
    setShowDeleteDialog(false);
    setSelectedProduct(null);
  };

  const confirmAppExpose = () => {
    if (selectedProduct) {
      const newAppExposed = !selectedProduct.appExposed;
      updateAppExposeMutation.mutate({
        productId: selectedProduct.id,
        appExposed: newAppExposed
      });
    }
    setShowAppExposeDialog(false);
    setSelectedProduct(null);
  };

  // 상품 저장 핸들러
  const handleSaveProduct = useCallback(() => {
    // dialogCategory 유효성 검사
    if (!dialogCategory) {
      toast({ title: "오류", description: "카테고리가 설정되지 않았습니다. 다시 시도해주세요.", variant: "destructive" });
      return;
    }

    const parsedPrice = parseInt(formData.price) || 0;
    const parsedDuration = parseInt(formData.duration) || 1;
    const parsedSessions = parseInt(formData.sessions) || 0;

    if (!formData.name.trim()) {
      toast({ title: "오류", description: "상품명을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (parsedPrice < 0) {
      toast({ title: "오류", description: "올바른 가격을 입력해주세요.", variant: "destructive" });
      return;
    }

    // 수업 상품인 경우 레슨 타입 필수
    if (dialogCategory === "수업 상품" && !formData.lessonType) {
      toast({ title: "오류", description: "레슨 타입을 선택해주세요.", variant: "destructive" });
      return;
    }

    // 수업 상품인 경우 수업 시간 필수 (개인 레슨 & 그룹 수업 모두)
    if (dialogCategory === "수업 상품" && formData.lessonType) {
      if (!formData.startTime || !formData.endTime) {
        toast({ title: "오류", description: "수업 시간을 선택해주세요.", variant: "destructive" });
        return;
      }
    }

    // franchiseId 유효성 검사
    const resolvedFranchiseId = editingProduct?.franchiseId ?? user?.franchiseId;
    if (!resolvedFranchiseId) {
      toast({ title: "오류", description: "사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", variant: "destructive" });
      return;
    }

    const productData: InsertProduct = {
      name: formData.name.trim(),
      price: parsedPrice,
      duration: parsedDuration,
      durationType: formData.durationType,
      sessions: parsedSessions,
      category: dialogCategory,
      description: formData.description.trim(),
      status: formData.status,
      appExposed: formData.appExposed,
      franchiseId: resolvedFranchiseId,
      lessonType: dialogCategory === "수업 상품" ? formData.lessonType : undefined,
      instructorId: formData.instructorId && formData.instructorId !== "none" ? parseInt(formData.instructorId) : undefined,
      // 수업 상품(개인 레슨 & 그룹 수업)에 모두 인원 설정, 시간, 요일 저장
      maxParticipants: dialogCategory === "수업 상품" ? parseInt(formData.maxParticipants) : undefined,
      minParticipants: dialogCategory === "수업 상품" ? parseInt(formData.minParticipants) : undefined,
      startTime: dialogCategory === "수업 상품" ? formData.startTime : undefined,
      endTime: dialogCategory === "수업 상품" ? formData.endTime : undefined,
      operatingDays: dialogCategory === "수업 상품" && formData.selectedDays.length > 0 ? formData.selectedDays : undefined,
      lockerSection: dialogCategory === "락커 상품" && formData.lockerSection ? formData.lockerSection : undefined,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  }, [formData, dialogCategory, editingProduct, user?.franchiseId, createProductMutation, updateProductMutation, toast]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatDuration = (duration: number | null, durationType: string | null) => {
    if (!duration || !durationType) return "-";
    return `${duration}${durationType}`;
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Top Navigation - Horizontal menu like the image */}
      <div className="px-3 md:px-6 pt-4 md:pt-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">상품</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
          {["전체 상품", "APP 노출 상품", "APP 비노출 상품", "비활성화"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "font-medium text-gray-900 border-b-2 border-orange-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-start md:justify-end px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-1">
          {["회원권", "수업 상품", "락커 상품", "운동 용품"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeCategory === category
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-500 hover:text-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center">
            {/* Empty State Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                <svg 
                  className="w-8 h-8 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5v12.5" 
                  />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 상품이 없어요</h3>
            <p className="text-gray-500 mb-8">
              {activeTab === "전체 상품" && `첫 번째 ${activeCategory}을 등록해보세요.`}
              {activeTab === "APP 노출 상품" && "APP에 노출할 상품을 등록해보세요."}
              {activeTab === "비활성화 상품" && "비활성화된 상품이 없습니다."}
            </p>
            
            {/* Add Product Button */}
            {(activeTab === "전체 상품" || activeTab === "APP 노출 상품") && (
              <Button 
                onClick={handleOpenAddDialog}
                className="bg-orange-500 hover-elevate px-6 py-2"
              >
                상품 추가
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {paginatedProducts.map((product) => (
                <Card key={product.id} className="relative group hover:shadow-lg transition-shadow">
                  <CardAccentLine />
                  <CardContent className="p-4 md:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                        <div className="space-y-1 text-sm text-gray-500">
                          <p>가격: {formatPrice(product.price)}원</p>
                          <p>기간: {formatDuration(product.duration, product.durationType)}</p>
                          <p>이용 횟수: {product.sessions !== null && product.sessions !== undefined && product.sessions > 0 ? `${product.sessions}회` : '무제한'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product)}
                          className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 flex-wrap">
                        <Badge 
                          variant={product.status === "활성" || product.status === "active" ? "default" : "secondary"}
                          className={
                            product.status === "활성" || product.status === "active"
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {product.status === "활성" || product.status === "active" ? "활성" : "비활성"}
                        </Badge>
                        <Badge 
                          variant={product.appExposed ? "default" : "secondary"}
                          className={
                            product.appExposed 
                              ? "bg-orange-100 text-orange-700" 
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {product.appExposed ? "APP 노출" : "APP 비노출"}
                        </Badge>
                        {/* 수업 상품일 경우 레슨 타입 표시 (Show lesson type for class products) */}
                        {product.category === "수업 상품" && product.lessonType && (
                          <Badge 
                            variant="outline"
                            className={
                              product.lessonType === "개인 레슨" 
                                ? "border-orange-300 bg-orange-50 text-orange-700" 
                                : "border-orange-300 bg-orange-50 text-orange-700"
                            }
                          >
                            {product.lessonType === "개인 레슨" ? "개인 레슨" : "그룹 수업"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {product.category}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAppExpose(product)}
                        className={`flex-1 text-xs py-2 ${
                          product.appExposed 
                            ? "border-orange-300 bg-orange-50 text-orange-700" 
                            : "border-gray-200 text-gray-600 hover-elevate"
                        }`}
                      >
                        {product.appExposed ? "APP 노출 해제" : "APP 노출"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(product)}
                        className={`flex-1 text-xs py-2 ${
                          product.status === "비활성" || product.status === "inactive"
                            ? "border-gray-300 bg-gray-50 text-gray-700" 
                            : "border-gray-200 text-gray-600 hover-elevate"
                        }`}
                      >
                        {product.status === "비활성" || product.status === "inactive" ? "활성화" : "비활성화"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 페이지네이션 (Pagination) */}
            {filteredProducts.length > itemsPerPage && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-6 md:mt-8 px-2 md:px-4 gap-3">
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
                    이전
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
                    다음
                  </Button>
                </div>
              </div>
            )}

            {/* Add Product Button for product grid view */}
            <div className="mt-8 text-center">
              {(activeTab === "전체 상품" || activeTab === "APP 노출 상품" || activeTab === "APP 비노출 상품") && (
                <Button
                  onClick={handleOpenAddDialog}
                  className="bg-orange-500 hover-elevate px-6 py-2"
                >
                  상품 추가
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🗑️ 삭제 확인 팝업 (Delete Confirmation Popup) */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedProduct(null);
        }}
        onConfirm={confirmDelete}
        title="상품 삭제 확인"
        description="선택한 상품을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />

      {/* 📱 앱 노출 확인 팝업 (App Exposure Confirmation Popup) */}
      {selectedProduct && (
        <AppExposeConfirmDialog
          isOpen={showAppExposeDialog}
          onClose={() => {
            setShowAppExposeDialog(false);
            setSelectedProduct(null);
          }}
          onConfirm={confirmAppExpose}
          isCurrentlyExposed={selectedProduct.appExposed === true}
          productName={selectedProduct.name}
        />
      )}

      {/* 📝 상품 추가/수정 다이얼로그 */}
      {(showAddDialog || showEditDialog) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setEditingProduct(null);
            resetForm();
          }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-50 mx-3 md:m-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                  {editingProduct ? "상품 수정" : `${dialogCategory} 등록`}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="p-2 hover-elevate rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 폼 내용 */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-5">
              {/* 수업 상품일 경우 레슨 타입 선택 */}
              {dialogCategory === "수업 상품" && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <Label className="text-sm font-semibold text-orange-700 mb-3 block">수업 유형 선택 *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, lessonType: "개인 레슨" }))}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.lessonType === "개인 레슨"
                          ? "border-orange-500 bg-orange-100 text-orange-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      <Dumbbell className="w-6 h-6" />
                      <span className="font-medium">개인 레슨</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, lessonType: "그룹 수업" }))}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.lessonType === "그룹 수업"
                          ? "border-green-500 bg-green-100 text-green-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-green-300"
                      }`}
                    >
                      <Users className="w-6 h-6" />
                      <span className="font-medium">그룹 수업</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 상품명 */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">{dialogCategory === "수업 상품" ? "수업명" : "상품명"} *</Label>
                </div>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={dialogCategory === "수업 상품" ? "수업명을 입력하세요" : "예: 1:1 PT 10회권"}
                  className="flex-1"
                />
              </div>

              {/* 담당 강사 - 수업 상품일 경우에만 표시 */}
              {dialogCategory === "수업 상품" && formData.lessonType && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">담당 강사</Label>
                  </div>
                  <Select 
                    value={formData.instructorId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, instructorId: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="강사를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안함</SelectItem>
                      {staffList.filter((s) => s.id != null && s.status !== '퇴사').map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 수업 시간 (개인 레슨 & 그룹 수업 모두 표시) */}
              {dialogCategory === "수업 상품" && formData.lessonType && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">수업 시간 *</Label>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Select value={formData.startTime} onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="시작" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-gray-500">~</span>
                    <Select value={formData.endTime} onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="종료" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 운영 요일 (개인 레슨 & 그룹 수업 모두 표시) */}
              {dialogCategory === "수업 상품" && formData.lessonType && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">운영 요일</Label>
                  </div>
                  <div className="flex gap-2 flex-1 flex-wrap">
                    {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            selectedDays: prev.selectedDays.includes(day)
                              ? prev.selectedDays.filter(d => d !== day)
                              : [...prev.selectedDays, day]
                          }));
                        }}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                          formData.selectedDays.includes(day)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover-elevate'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 가격 (수업 상품은 수업료로 표시) */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">
                    {dialogCategory === "수업 상품" ? "수업료" : "가격"} (원) *
                  </Label>
                </div>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                  className="flex-1"
                />
              </div>

              {/* 기간 (회원권, 락커 상품만) */}
              {dialogCategory !== "수업 상품" && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">유효기간</Label>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="1"
                      className="w-20"
                    />
                    <Select 
                      value={formData.durationType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, durationType: value }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="일">일</SelectItem>
                        <SelectItem value="주">주</SelectItem>
                        <SelectItem value="월">월</SelectItem>
                        <SelectItem value="년">년</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 인원 설정 (개인 레슨 & 그룹 수업 모두 표시) */}
              {dialogCategory === "수업 상품" && formData.lessonType && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">인원 설정 *</Label>
                  </div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">정원</span>
                      <Input
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                        className="w-16"
                      />
                      <span className="text-sm text-gray-500">명</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">최소</span>
                      <Input
                        type="number"
                        value={formData.minParticipants}
                        onChange={(e) => setFormData(prev => ({ ...prev, minParticipants: e.target.value }))}
                        className="w-16"
                      />
                      <span className="text-sm text-gray-500">명</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 락커 구역 선택 (락커 상품 전용) */}
              {dialogCategory === "락커 상품" && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">구역 선택 *</Label>
                  </div>
                  <Select 
                    value={formData.lockerSection} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, lockerSection: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="구역을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSections.length > 0 ? (
                        activeSections.map((section) => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__none__" disabled>
                          등록된 구역이 없습니다
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 상품 설명 */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">상품 설명</Label>
                </div>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="상품에 대한 간단한 설명"
                  className="flex-1"
                />
              </div>

              {/* 상태 및 APP 노출 설정 */}
              <div className="border-t border-gray-200 pt-4 md:pt-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <Settings className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium text-gray-700 md:w-24 flex-shrink-0">상태</Label>
                  </div>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="활성">활성</SelectItem>
                      <SelectItem value="비활성">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium text-gray-700">APP 노출</Label>
                  </div>
                  <Switch
                    checked={formData.appExposed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, appExposed: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 p-4 md:p-6 border-t border-gray-200">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  setEditingProduct(null);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover-elevate"
                onClick={handleSaveProduct}
                disabled={createProductMutation.isPending || updateProductMutation.isPending || (!editingProduct && !user?.franchiseId)}
              >
                {createProductMutation.isPending || updateProductMutation.isPending 
                  ? "저장 중..." 
                  : (!editingProduct && !user?.franchiseId) 
                    ? "로딩 중..." 
                    : (editingProduct ? "수정" : "등록")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}