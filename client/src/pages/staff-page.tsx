// 👥 직원 관리 페이지 (Staff Management Page)
// 🎯 Purpose: 체육관 직원 등록, 조회, 관리를 위한 통합 페이지 (Integrated page for gym staff registration, viewing, and management)
// 🔒 Security: 프랜차이즈별 직원 데이터 격리 (Franchise-based staff data isolation)
// 📊 Features: 직원 검색, 삭제, 상세정보 관리 (Staff search, deletion, detailed information management)

import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Search, Plus, Download, X, UserX, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CustomDialog, DeleteConfirmDialog } from "@/components/ui/custom-dialog";
import { Staff } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatPhoneNumber } from "@/utils/input-sanitizer";

interface StaffFormData {
  name: string;
  phone: string;
  email?: string;
  position?: string;
  department?: string;
  hireDate: string;
  resignationDate?: string; // 퇴사일 (Resignation date)
  address?: string;
  workType?: string;
  status?: string;
  notes?: string;
}

// 🏷️ 직원 페이지 프롭스 타입 정의 (Staff page props type definition)
interface StaffPageProps {
  selectedStaffId?: number; // 선택된 직원 ID (Selected staff ID)
  onStaffSelect?: (staffId: number | undefined) => void; // 직원 선택 콜백 (Staff selection callback)
  onRegister?: () => void; // 등록 콜백 (Registration callback)
}

export default function StaffPage({ selectedStaffId, onStaffSelect, onRegister }: StaffPageProps = {}) {
  // 🔍 검색 및 UI 상태 관리 (Search and UI state management)
  const [searchTerm, setSearchTerm] = useState(""); // 직원 검색어 (Staff search term)
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 디바운스된 검색어
  const [activeSubTab, setActiveSubTab] = useState("직원 정보"); // 활성 서브 탭 (Active sub tab)
  const [showResignDialog, setShowResignDialog] = useState(false); // 퇴사 처리 팝업 표시 (Show resignation dialog)
  const [selectedStaffForResign, setSelectedStaffForResign] = useState<Staff | null>(null); // 퇴사 처리 대상 직원 (Selected staff for resignation)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // 직원 삭제 팝업 표시 (Show staff deletion dialog)
  const [selectedStaffForDelete, setSelectedStaffForDelete] = useState<Staff | null>(null); // 삭제 대상 직원 (Selected staff for deletion)
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false); // 직원 등록 다이얼로그 (Staff registration dialog)
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 (Current page for pagination)
  const itemsPerPage = 5; // 페이지당 항목 수 (Items per page)
  const { toast } = useToast();

  // 직원 등록 폼 (Staff registration form) - approvalStatus는 백엔드에서 기본값 "대기" 설정
  const form = useForm<StaffFormData>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      position: "",
      department: "",
      hireDate: new Date().toISOString().split('T')[0],
      resignationDate: "",
      address: "",
      workType: "정규직",
      notes: "",
    },
  });

  // 직원 등록 mutation (Staff registration mutation)
  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      const response = await apiRequest("POST", "/api/staff", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "직원 등록 완료",
        description: "새로운 직원이 성공적으로 등록되었습니다.",
      });
      setShowAddStaffDialog(false);
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

  const queryClient = useQueryClient();

  const onSubmitStaff = (data: StaffFormData) => {
    createStaffMutation.mutate(data);
  };

  // 📊 직원 데이터 조회 (Fetch staff data)
  // 🔒 보안: 프랜차이즈별 직원 데이터만 조회 (Security: Only fetch franchise-specific staff data)
  const { data: staff = [], isLoading, error, refetch } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  // 🔍 직원 필터링 (Filter staff by search term) - 승인된 직원만 표시
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staff)) return [];
    
    return staff
      .filter(s => {
        if (!s || typeof s !== 'object') return false;
        
        // 승인된 직원만 표시 (Only show approved staff)
        if (s.approvalStatus !== "승인") return false;
        
        const searchLower = debouncedSearchTerm.toLowerCase().trim();
        return !searchLower || 
          (s.name && s.name.toLowerCase().includes(searchLower)) ||
          (s.phone && s.phone.includes(debouncedSearchTerm.trim()));
      })
      .sort((a, b) => b.id - a.id); // 최신 데이터 먼저 표시 (Show newest first)
  }, [staff, debouncedSearchTerm]);

  // 페이지네이션 계산 (Pagination calculations)
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  // 검색 변경 시 첫 페이지로 리셋
  useMemo(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);
  
  // 🗑️ 직원 삭제 변경 함수 (Staff deletion mutation function)
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      await apiRequest("DELETE", `/api/staff/${staffId}`);
    },
    onSuccess: () => {
      // ✅ 성공 시 캐시 무효화 및 성공 메시지 (Invalidate cache and show success message on success)
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "직원 삭제 완료",
        description: "직원이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      // ❌ 실패 시 오류 메시지 표시 (Show error message on failure)
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🚪 직원 퇴사 처리 변경 함수 (Staff resignation mutation function)
  const resignStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiRequest("PUT", `/api/staff/${staffId}`, {
        status: "퇴사",
        resignationDate: today
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "퇴사 처리에 실패했습니다" }));
        throw new Error(errorData.error || "퇴사 처리에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      // ✅ 성공 시 캐시 무효화 및 성공 메시지 (Invalidate cache and show success message on success)
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "퇴사 처리 완료",
        description: "직원이 성공적으로 퇴사 처리되었습니다.",
      });
    },
    onError: (error: Error) => {
      // ❌ 실패 시 오류 메시지 표시 (Show error message on failure)
      toast({
        title: "퇴사 처리 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExcelDownload = () => {
    toast({
      title: "엑셀 다운로드",
      description: "직원 목록을 엑셀로 다운로드합니다.",
    });
  };

  const handleDeleteStaff = useCallback((staffMember: Staff) => {
    setSelectedStaffForDelete(staffMember);
    setShowDeleteDialog(true);
  }, []);
  
  const confirmDelete = useCallback(() => {
    if (selectedStaffForDelete) {
      deleteStaffMutation.mutate(selectedStaffForDelete.id);
      setShowDeleteDialog(false);
      setSelectedStaffForDelete(null);
    }
  }, [selectedStaffForDelete, deleteStaffMutation]);

  const handleResignStaff = useCallback((staffMember: Staff) => {
    setSelectedStaffForResign(staffMember);
    setShowResignDialog(true);
  }, []);

  const confirmResignation = useCallback(() => {
    if (selectedStaffForResign) {
      resignStaffMutation.mutate(selectedStaffForResign.id);
      setShowResignDialog(false);
      setSelectedStaffForResign(null);
    }
  }, [selectedStaffForResign, resignStaffMutation]);

  const cancelResignation = useCallback(() => {
    setShowResignDialog(false);
    setSelectedStaffForResign(null);
  }, []);

  // 대기 중인 직원 필터링 (Filter pending staff) - approvalStatus 사용
  const pendingStaff = useMemo(() => {
    if (!Array.isArray(staff)) return [];
    return staff.filter(s => s && s.approvalStatus === "대기");
  }, [staff]);

  // 직원 승인 mutation (Staff approval mutation) - approvalStatus 사용
  const approveStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      const res = await apiRequest("PATCH", `/api/staff/${staffId}/approve`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "승인에 실패했습니다" }));
        throw new Error(errorData.error || "승인에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "승인 완료",
        description: "직원이 성공적으로 승인되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "승인 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 직원 거부 mutation (Staff rejection mutation) - approvalStatus 사용
  const rejectStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      const res = await apiRequest("PATCH", `/api/staff/${staffId}/reject`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "거부에 실패했습니다" }));
        throw new Error(errorData.error || "거부에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "거부 완료",
        description: "직원 가입 요청이 거부되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "거부 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">직원</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">직원 관리 시스템</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStaffSelect?.(undefined)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 overflow-x-auto">
        <div className="flex space-x-4 md:space-x-8">
          <button 
            onClick={() => setActiveSubTab("직원 정보")}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === "직원 정보" 
                ? "text-gray-900 border-orange-500" 
                : "text-gray-500 hover:text-gray-700 border-transparent"
            }`}
          >
            직원 정보
          </button>
          <button 
            onClick={() => setActiveSubTab("퇴사 관리")}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === "퇴사 관리" 
                ? "text-gray-900 border-orange-500" 
                : "text-gray-500 hover:text-gray-700 border-transparent"
            }`}
          >
            퇴사 관리
          </button>
          <button 
            onClick={() => setActiveSubTab("가입 관리")}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === "가입 관리" 
                ? "text-gray-900 border-orange-500" 
                : "text-gray-500 hover:text-gray-700 border-transparent"
            }`}
          >
            가입 관리
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeSubTab === "직원 정보" && (
        <div className="space-y-4 md:space-y-6 px-3 md:px-6">
          {/* Search */}
          <div className="flex items-center justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                placeholder="이름 및 연락처로 검색" 
                className="pl-10 bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Staff Table */}
          <Card className="border-0 shadow-lg">
            <CardAccentLine />
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="w-16 text-center font-semibold">순번</TableHead>
                    <TableHead className="font-semibold">이름</TableHead>
                    <TableHead className="font-semibold">연락처(휴대폰)</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">입사일</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">퇴사일</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold">주소</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                        </TableCell>

                      </TableRow>
                    ))
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center space-y-4">
                          <Users className="w-12 h-12 text-gray-400" />
                          <p className="text-lg font-medium">등록된 직원이 없습니다</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStaff.map((staffMember, index) => (
                      <TableRow 
                        key={staffMember.id} 
                        className={`cursor-pointer transition-all duration-200 hover-elevate ${
 selectedStaffId === staffMember.id ? 'bg-orange-50' : ''
 }`}
                        onClick={() => onStaffSelect?.(staffMember.id)}
                      >
                        <TableCell className="text-center text-sm text-gray-600">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{staffMember.name}</div>
                          <div className="text-sm text-gray-500">{staffMember.position}</div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-700">{formatPhoneNumber(staffMember.phone)}</TableCell>
                        <TableCell className="hidden md:table-cell text-gray-700">
                          {staffMember.hireDate ? new Date(staffMember.hireDate).toLocaleDateString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-gray-700">
                          {staffMember.resignationDate ? new Date(staffMember.resignationDate).toLocaleDateString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-gray-700">
                          {staffMember.address || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* 페이지네이션 (Pagination) */}
              {filteredStaff.length > itemsPerPage && (
                <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 gap-3 border-t border-gray-200">
                  <div className="text-xs md:text-sm text-gray-600">
                    전체 {filteredStaff.length}명 중 {startIndex + 1}-{Math.min(endIndex, filteredStaff.length)}명 표시
                  </div>
                  <div className="flex items-center space-x-2">
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
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-3">
            <Button variant="outline" onClick={handleExcelDownload} className="border-gray-300 hover-elevate">
              <Download className="w-4 h-4 mr-2" />
              엑셀 다운로드
            </Button>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover-elevate"
              onClick={() => setShowAddStaffDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              직원 등록
            </Button>
          </div>
        </div>
      )}

      {/* 퇴사 관리 Tab */}
      {activeSubTab === "퇴사 관리" && (
        <div className="space-y-4 md:space-y-6 px-3 md:px-6">
          {/* Search */}
          <div className="flex items-center justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                placeholder="이름 및 연락처로 검색" 
                className="pl-10 bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Staff Resignation Table */}
          <Card className="border-0 shadow-lg">
            <CardAccentLine />
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="w-16 text-center font-semibold">순번</TableHead>
                    <TableHead className="font-semibold">이름</TableHead>
                    <TableHead className="font-semibold">연락처(휴대폰)</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">입사일</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">퇴사일</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold">주소</TableHead>
                    <TableHead className="font-semibold">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center space-y-4">
                          <Users className="w-12 h-12 text-gray-400" />
                          <p className="text-lg font-medium">등록된 직원이 없습니다</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStaff.map((staffMember, index) => (
                      <TableRow
                        key={staffMember.id}
                        className="cursor-pointer hover-elevate"
                      >
                        <TableCell className="text-center text-sm text-gray-600">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900">{staffMember.name}</span>
                        </TableCell>
                        <TableCell className="text-gray-700">{formatPhoneNumber(staffMember.phone)}</TableCell>
                        <TableCell className="hidden md:table-cell text-gray-700">
                          {staffMember.hireDate ? new Date(staffMember.hireDate).toLocaleDateString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-gray-700">
                          {staffMember.resignationDate ? new Date(staffMember.resignationDate).toLocaleDateString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-gray-700">
                          {staffMember.address || '-'}
                        </TableCell>
                        <TableCell>
                          {staffMember.status === "퇴사" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <UserX className="w-3 h-3 mr-1" />
                              퇴사
                            </span>
                          ) : (
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:border-red-300 hover-elevate"
                              onClick={() => handleResignStaff(staffMember)}
                            >
                              퇴사 처리
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* 페이지네이션 (Pagination) */}
              {filteredStaff.length > itemsPerPage && (
                <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 gap-3 border-t border-gray-200">
                  <div className="text-xs md:text-sm text-gray-600">
                    전체 {filteredStaff.length}명 중 {startIndex + 1}-{Math.min(endIndex, filteredStaff.length)}명 표시
                  </div>
                  <div className="flex items-center space-x-2">
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
            </CardContent>
          </Card>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col md:flex-row justify-end gap-3">
            <Button variant="outline" className="px-8">
              엑셀 다운로드
            </Button>
            <Button className="bg-orange-500 px-8 hover-elevate">
              퇴사 등록
            </Button>
          </div>
        </div>
      )}

      {/* 가입 관리 Tab */}
      {activeSubTab === "가입 관리" && (
        <div className="space-y-4 md:space-y-6 px-3 md:px-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">가입 대기 목록</h3>
              <p className="text-sm text-gray-500">승인 대기 중인 직원: {pendingStaff.length}명</p>
            </div>
          </div>

          {/* Registration Management Table */}
          <Card className="border-0 shadow-lg">
            <CardAccentLine />
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="w-16 text-center font-semibold">순번</TableHead>
                    <TableHead className="font-semibold">이름</TableHead>
                    <TableHead className="font-semibold">연락처(휴대폰)</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">직책</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">신청일</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">상태</TableHead>
                    <TableHead className="font-semibold text-center">처리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center space-y-4">
                          <Users className="w-12 h-12 text-gray-400" />
                          <p className="text-lg font-medium">승인 대기 중인 직원이 없습니다</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingStaff.map((staffMember, index) => (
                      <TableRow key={staffMember.id} className="hover-elevate">
                        <TableCell className="text-center text-sm text-gray-600">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{staffMember.name}</div>
                        </TableCell>
                        <TableCell className="text-gray-700">{formatPhoneNumber(staffMember.phone)}</TableCell>
                        <TableCell className="hidden md:table-cell text-gray-700">{staffMember.position || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell text-gray-700">
                          {staffMember.createdAt ? new Date(staffMember.createdAt).toLocaleDateString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            대기
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              disabled={approveStaffMutation.isPending}
                              onClick={() => approveStaffMutation.mutate(staffMember.id)}
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={rejectStaffMutation.isPending}
                              onClick={() => rejectStaffMutation.mutate(staffMember.id)}
                            >
                              거절
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 🚪 직원 퇴사 처리 팝업 (Staff Resignation Confirmation Popup) */}
      {showResignDialog && selectedStaffForResign && (
        <CustomDialog
          isOpen={showResignDialog}
          onClose={cancelResignation}
          onConfirm={confirmResignation}
          title="퇴사 처리 확인"
          description={`${selectedStaffForResign.name} 직원을 퇴사 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmText="퇴사 처리"
          cancelText="취소"
          type="delete"
        />
      )}

      {/* 🗑️ 직원 삭제 팝업 (Staff Delete Confirmation Popup) */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedStaffForDelete(null);
        }}
        onConfirm={confirmDelete}
        title="직원 삭제 확인"
        description="선택한 직원을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />

      {/* ➕ 직원 등록 다이얼로그 (Staff Registration Dialog) */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">직원 등록</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitStaff)} className="space-y-6">
              {/* 프로필 사진 영역 */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              </div>

              {/* 기본 정보 섹션 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: "이름은 필수입니다" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="이름 입력" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    rules={{ required: "연락처는 필수입니다" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>연락처 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="010-0000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주소</FormLabel>
                      <FormControl>
                        <Input placeholder="주소 입력" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 직무 정보 섹션 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">직무 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>직책</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="직책 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="트레이너">트레이너</SelectItem>
                            <SelectItem value="매니저">매니저</SelectItem>
                            <SelectItem value="프론트">프론트</SelectItem>
                            <SelectItem value="관장">관장</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>부서</FormLabel>
                        <FormControl>
                          <Input placeholder="부서 입력" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>입사일 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="resignationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>퇴사일</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>근무형태</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="근무형태 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="정규직">정규직</SelectItem>
                            <SelectItem value="계약직">계약직</SelectItem>
                            <SelectItem value="파트타임">파트타임</SelectItem>
                            <SelectItem value="인턴">인턴</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>재직상태</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="재직상태 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="재직">재직</SelectItem>
                            <SelectItem value="휴직">휴직</SelectItem>
                            <SelectItem value="퇴사">퇴사</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 추가 정보 섹션 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">추가 정보</h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비고</FormLabel>
                      <FormControl>
                        <Textarea placeholder="비고 내용 입력" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddStaffDialog(false)}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  className="bg-orange-500 hover-elevate"
                  disabled={createStaffMutation.isPending}
                >
                  {createStaffMutation.isPending ? "등록 중..." : "등록하기"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}