// 👥 회원 관리 페이지 (Member Management Page)
// 🎯 Purpose: 체육관 회원 등록, 조회, 관리를 위한 통합 페이지 (Integrated page for gym member registration, viewing, and management)
// 🔒 Security: 프랜차이즈별 회원 데이터 격리 (Franchise-based member data isolation)
// 📊 Features: 회원 검색, 필터링, 상세정보 관리 (Member search, filtering, detailed information management)

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Download, Upload, X, FileText, Users, UserCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMemberSchema, type Member, type InsertMember, type Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CustomDialog } from "@/components/ui/custom-dialog";
import MemberDetailPage from "./member-detail-page";
import MemberDeletePage from "./member-delete-page";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatPhoneNumber } from "@/utils/input-sanitizer";

interface MembersPageProps {
  selectedMemberId?: number;
  onMemberSelect?: (memberId: number | undefined) => void;
  onContractCreate?: () => void;
}

export default function MembersPage({ selectedMemberId, onMemberSelect, onContractCreate }: MembersPageProps = {}) {
  const { user } = useAuth();
  // 🔍 검색 및 필터링 상태 (Search and filtering state)
  const [searchTerm, setSearchTerm] = useState(""); // 회원 검색어 (Member search term)
  const [statusFilter, setStatusFilter] = useState<string>("all"); // 회원 상태 필터 (Member status filter)
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 디바운스된 검색어
  
  // 📋 UI 상태 관리 (UI state management)
  const [activeTab, setActiveTab] = useState("회원 정보"); // 활성 탭 (Active tab)
  const [showAddMember, setShowAddMember] = useState(false); // 회원 등록 모달 표시 (Show member registration modal)
  const [registrationTypeModalOpen, setRegistrationTypeModalOpen] = useState(false); // 등록 유형 선택 모달 (Registration type selection modal)
  const [registrationType, setRegistrationType] = useState<"simple" | "detailed" | null>(null); // 간단/상세 등록 모드 (Simple/Detailed registration mode)
  const [showUploadDialog, setShowUploadDialog] = useState(false); // 엑셀 업로드 대화상자 (Excel upload dialog)
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 (Current page for pagination)
  const itemsPerPage = 5; // 페이지당 항목 수 (Items per page)
  const { toast } = useToast();

  // 📊 회원 데이터 조회 (Fetch member data)
  // 🔒 보안: 프랜차이즈별 회원 데이터만 조회 (Security: Only fetch franchise-specific member data)
  const { data: members = [], isLoading, error, refetch } = useQuery<Member[]>({
    queryKey: ["/api/members"],
    retry: 2,
    staleTime: 0, // 🔥 캐시 비활성화 - 항상 최신 데이터 (Cache disabled - Always fresh data)
  });

  // 🛑 정지 데이터 조회 (Fetch suspension data for status display)
  const { data: suspensions = [] } = useQuery<any[]>({
    queryKey: ["/api/suspensions"],
  });

  // 🔍 회원별 현재 정지 상태 확인 (Check if member is currently suspended)
  const isMemberSuspended = (memberId: number) => {
    const now = new Date();
    return suspensions.some(suspension => {
      if (suspension.memberId !== memberId) return false;
      if (suspension.status === "해제") return false;
      const startDate = new Date(suspension.startDate);
      const endDate = suspension.endDate ? new Date(suspension.endDate) : null;
      if (now < startDate) return false;
      if (endDate && now > endDate) return false;
      return true;
    });
  };

  // ➕ 회원 등록 변경 (Add member mutation)
  // 🔒 보안: 현재 사용자의 프랜차이즈에만 회원 등록 (Security: Only register members to current user's franchise)
  const addMemberMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      const res = await apiRequest("POST", "/api/members", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] }); // 캐시 무효화 (Invalidate cache)
      setShowAddMember(false);
      toast({
        title: "회원 등록 완료",
        description: "새로운 회원이 성공적으로 등록되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 📥 엑셀 다운로드 함수 (Excel download function)
  const handleExcelDownload = () => {
    // 엑셀 다운로드용 데이터 준비 (Prepare data for Excel download)
    const excelData = filteredMembers.map(member => ({
      '이름': member.name,
      '전화번호': member.phone,
      '상태': member.status,
      '성별': member.gender || '-',
      '생년월일': member.birthDate || '-',
      '주소': member.address || '-',
      '이메일': member.email || '-',
      '비상연락처': member.emergencyContact || '-',
      '직업': member.occupation || '-',
      '가입일': formatDate(member.joinDate),
      '최근방문일': member.lastVisit ? formatDate(member.lastVisit) : '-',
      '메모': member.notes || '-'
    }));

    // 워크북 생성 및 다운로드 (Create workbook and download)
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "회원 목록");
    
    // 파일 다운로드 (Download file)
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `회원목록_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '-')}.xlsx`;
    saveAs(data, fileName);
    
    toast({
      title: "다운로드 완료",
      description: `${filteredMembers.length}명의 회원 정보가 다운로드되었습니다.`,
    });
  };

  // 📤 엑셀 업로드 함수 (Excel upload function)
  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "파일 형식 오류",
        description: "엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 오류",
        description: "파일 크기는 5MB를 초과할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames.length) {
          throw new Error("워크시트가 없습니다.");
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!jsonData.length) {
          toast({
            title: "데이터 없음",
            description: "엑셀 파일에 데이터가 없습니다.",
            variant: "destructive",
          });
          return;
        }

        // 데이터 검증 및 변환 (Data validation and transformation)
        const validMembers = jsonData
          .map((row: any, index: number) => {
            const member = {
              name: String(row['이름'] || '').trim(),
              phone: String(row['전화번호'] || '').trim(),
              status: String(row['상태'] || '활성 회원').trim(),
              gender: String(row['성별'] || '').trim(),
              birthDate: String(row['생년월일'] || '').trim(),
              address: String(row['주소'] || '').trim(),
              email: String(row['이메일'] || '').trim(),
              emergencyContact: String(row['비상연락처'] || '').trim(),
              occupation: String(row['직업'] || '').trim(),
              joinSource: String(row['가입경로'] || '').trim(),
              notes: String(row['메모'] || '').trim(),
              franchiseId: 1
            };
            
            // 필수 필드 검증
            if (!member.name || !member.phone) {
              console.warn(`행 ${index + 1}: 이름 또는 전화번호가 누락되었습니다.`);
              return null;
            }
            
            // 전화번호 형식 검증
            const phoneRegex = /^[0-9-+\s()]+$/;
            if (!phoneRegex.test(member.phone)) {
              console.warn(`행 ${index + 1}: 전화번호 형식이 올바르지 않습니다.`);
              return null;
            }
            
            return member;
          })
          .filter((member): member is NonNullable<typeof member> => member !== null);

        if (!validMembers.length) {
          toast({
            title: "유효한 데이터 없음",
            description: "유효한 회원 정보가 없습니다. 이름과 전화번호를 확인해주세요.",
            variant: "destructive",
          });
          return;
        }

        // 배치 등록 (Batch registration)
        const batchSize = 50; // 배치 크기 제한
        const batches: typeof validMembers[] = [];
        
        for (let i = 0; i < validMembers.length; i += batchSize) {
          batches.push(validMembers.slice(i, i + batchSize));
        }

        // 순차적 배치 처리
        const processBatches = async () => {
          let successCount = 0;
          let errorCount = 0;

          for (const batch of batches) {
            try {
              await Promise.all(batch.map((member: any) => 
                apiRequest("POST", "/api/members", member)
              ));
              successCount += batch.length;
            } catch (error) {
              errorCount += batch.length;
              console.error('배치 처리 실패:', error);
            }
          }

          queryClient.invalidateQueries({ queryKey: ["/api/members"] });
          
          if (successCount > 0) {
            toast({
              title: "업로드 완료",
              description: `${successCount}명의 회원이 등록되었습니다.${errorCount > 0 ? ` (실패: ${errorCount}명)` : ''}`,
            });
          } else {
            toast({
              title: "업로드 실패",
              description: "회원 등록에 실패했습니다.",
              variant: "destructive",
            });
          }
        };

        processBatches();

      } catch (error) {
        console.error('엑셀 업로드 에러:', error);
        toast({
          title: "파일 오류",
          description: error instanceof Error ? error.message : "엑셀 파일을 읽는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "파일 읽기 실패",
        description: "파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    };
    
    reader.readAsArrayBuffer(file);
    setShowUploadDialog(false);
    
    // 파일 입력 초기화
    event.target.value = '';
  };

  // Filter members based on search and status (with debounced search)
  const filteredMembers = useMemo(() => {
    if (!Array.isArray(members)) return [];
    
    return members
      .filter(member => {
        if (!member || typeof member !== 'object') return false;
        
        const searchLower = debouncedSearchTerm.toLowerCase().trim();
        const matchesSearch = !searchLower || 
          (member.name && member.name.toLowerCase().includes(searchLower)) ||
          (member.phone && member.phone.includes(debouncedSearchTerm.trim()));
        
        const matchesStatus = statusFilter === "all" || member.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.id - a.id); // 최신 데이터 먼저 표시 (Show newest first)
  }, [members, debouncedSearchTerm, statusFilter]);

  // 페이지네이션 계산 (Pagination calculations)
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // 검색이나 필터 변경 시 첫 페이지로 리셋
  useMemo(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  // Add member form
  const form = useForm<InsertMember>({
    resolver: zodResolver(insertMemberSchema),
    defaultValues: {
      name: "",
      phone: "",
      status: "활성 회원",
      gender: "",
      birthDate: "",
      address: "",
      email: "",
      emergencyContact: "",
      occupation: "",
      joinSource: "",
      notes: "",
      franchiseId: user?.franchiseId || 1, // 🔒 현재 사용자의 프랜차이즈 ID 사용 (Use current user's franchise ID)
    },
  });

  const onSubmit = (data: InsertMember) => {
    // 🔒 보안: 프랜차이즈 ID 자동 설정 (Security: Auto-set franchise ID)
    const memberData = {
      ...data,
      franchiseId: user?.franchiseId || 1,
    };
    addMemberMutation.mutate(memberData);
  };

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case "활성 회원":
        return "bg-green-100 text-green-700";
      case "휴회":
        return "bg-gray-100 text-gray-600";
      case "만료":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Show member detail page if a member is selected
  if (selectedMemberId) {
    return (
      <MemberDetailPage
        memberId={selectedMemberId}
        onBack={() => onMemberSelect?.(undefined)}
        onContractCreate={onContractCreate}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="p-3 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">회원</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">회원 목록 ({filteredMembers.length})</p>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button variant="outline" size="sm" onClick={handleExcelDownload} className="border-gray-300 hover-elevate">
              <Download className="w-4 h-4 shrink-0 md:mr-2" />
              <span className="hidden md:inline">엑셀 다운로드</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)} className="border-gray-300 hover-elevate">
              <Upload className="w-4 h-4 shrink-0 md:mr-2" />
              <span className="hidden md:inline">엑셀 업로드</span>
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover-elevate"
              onClick={() => setRegistrationTypeModalOpen(true)}
            >
              <Plus className="w-4 h-4 shrink-0 mr-1 md:mr-2" />
              <span className="text-sm">회원 등록</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 md:px-6 overflow-x-auto">
          <div className="flex space-x-4 md:space-x-8">
            {["회원 정보", "회원 삭제", "환불 처리", "수업 연장", "정지 기록", "수정 기록"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 md:py-4 px-1 md:px-2 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "회원 정보" && (
        <>
          {/* Search and Filter */}
          <div className="px-3 md:px-6">
        <Card className="border-0 shadow-lg">
          <CardAccentLine />
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:space-x-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="회원 이름이나 전화번호를 검색하세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 border-gray-200 focus:border-blue-400 focus:ring-blue-400">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="활성 회원">활성 회원</SelectItem>
                  <SelectItem value="휴회">휴회</SelectItem>
                  <SelectItem value="만료">만료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <div className="px-3 md:px-6">
        <Card className="border-0 shadow-lg">
          <CardAccentLine />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 md:p-4 font-semibold text-gray-700 text-sm">이름</th>
                    <th className="text-left p-2 md:p-4 font-semibold text-gray-700 text-sm">전화 번호</th>
                    <th className="text-left p-2 md:p-4 font-semibold text-gray-700 text-sm">상태</th>
                    <th className="text-left p-2 md:p-4 font-semibold text-gray-700 text-sm hidden md:table-cell">가입경로</th>
                    <th className="text-left p-2 md:p-4 font-semibold text-gray-700 text-sm hidden md:table-cell">등록일</th>
                    <th className="text-left p-2 md:p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">최근 방문일</th>
                    <th className="text-left p-2 md:p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">최근 결제일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center space-y-4">
                          <Users className="w-12 h-12 text-gray-400" />
                          <p className="text-lg font-medium">
                            {searchTerm || statusFilter !== "all" 
                              ? "검색 조건에 맞는 회원이 없습니다."
                              : "등록된 회원이 없습니다."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((member) => (
                      <tr 
                        key={member.id} 
                        className="border-b cursor-pointer transition-all duration-200 hover-elevate"
                        onClick={() => onMemberSelect?.(member.id)}
                      >
                        <td className="p-2 md:p-4">
                          <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                        </td>
                        <td className="p-2 md:p-4 text-gray-600 font-medium text-sm">{formatPhoneNumber(member.phone)}</td>
                        <td className="p-2 md:p-4">
                          <div className="flex items-center gap-1">
                            <Badge className={`font-medium text-xs ${getStatusBadgeClassName(member.status)}`}>
                              {member.status}
                            </Badge>
                            {isMemberSuspended(member.id) && (
                              <Badge className="font-medium text-xs bg-yellow-100 text-yellow-700">
                                정지중
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2 md:p-4 text-gray-600 text-sm hidden md:table-cell">{member.joinSource || '-'}</td>
                        <td className="p-2 md:p-4 text-gray-600 text-sm hidden md:table-cell">{formatDate(member.joinDate)}</td>
                        <td className="p-2 md:p-4 text-gray-600 text-sm hidden lg:table-cell">
                          {member.lastVisit ? formatDate(member.lastVisit) : '-'}
                        </td>
                        <td className="p-2 md:p-4 text-gray-600 text-sm hidden lg:table-cell">-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 페이지네이션 (Pagination) */}
            {filteredMembers.length > itemsPerPage && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-3 md:px-6 py-3 md:py-4 border-t border-gray-200">
                <div className="text-xs md:text-sm text-gray-600">
                  전체 {filteredMembers.length}명 중 {startIndex + 1}-{Math.min(endIndex, filteredMembers.length)}명 표시
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
          </CardContent>
        </Card>
      </div>

      {/* Registration Type Selection Modal */}
      <Dialog open={registrationTypeModalOpen} onOpenChange={setRegistrationTypeModalOpen}>
        <DialogContent className="sm:max-w-lg backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">회원 등록 방법 선택</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 md:py-6">
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 transform hover:scale-105"
              onClick={() => {
                setRegistrationType("simple");
                setRegistrationTypeModalOpen(false);
                setShowAddMember(true);
              }}
            >
              <CardAccentLine />
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-red-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">간편 등록</h3>
                <p className="text-sm text-gray-600">
                  필수 정보만 입력하여<br />
                  빠르게 회원을 등록합니다
                </p>
              </CardContent>
            </Card>
            
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 transform hover:scale-105"
              onClick={() => {
                setRegistrationType("detailed");
                setRegistrationTypeModalOpen(false);
                setShowAddMember(true);
              }}
            >
              <CardAccentLine />
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-red-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">상세 등록</h3>
                <p className="text-sm text-gray-600">
                  회원의 모든 정보를<br />
                  자세히 입력하여 등록합니다
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>엑셀 파일 업로드</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>엑셀 파일을 업로드하여 회원을 일괄 등록할 수 있습니다.</p>
              <p className="mt-2">필수 컬럼: 이름, 전화번호</p>
              <p>선택 컬럼: 상태, 성별, 생년월일, 주소, 이메일, 비상연락처, 직업, 메모</p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Registration Form Modal */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {registrationType === "simple" ? "간편 회원 등록" : "상세 회원 등록"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddMember(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {registrationType === "simple" ? (
                // Simple Registration Fields
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름 *</FormLabel>
                        <FormControl>
                          <Input placeholder="회원 이름을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>전화번호 *</FormLabel>
                        <FormControl>
                          <Input placeholder="010-0000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>상태 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="회원 상태를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="활성 회원">활성 회원</SelectItem>
                            <SelectItem value="휴회">휴회</SelectItem>
                            <SelectItem value="만료">만료</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="joinSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>가입경로</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="가입경로를 입력하세요 (예: 인터넷 검색, 지인 추천, 전단지 등)" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>메모</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="특이사항이나 메모를 입력하세요" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                // Detailed Registration Fields
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이름 *</FormLabel>
                            <FormControl>
                              <Input placeholder="회원 이름" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>전화번호 *</FormLabel>
                            <FormControl>
                              <Input placeholder="010-0000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>생년월일</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>성별</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="성별 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="남성">남성</SelectItem>
                                <SelectItem value="여성">여성</SelectItem>
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
                            <FormLabel>상태 *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="회원 상태" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="활성 회원">활성 회원</SelectItem>
                                <SelectItem value="휴회">휴회</SelectItem>
                                <SelectItem value="만료">만료</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <Input placeholder="주소를 입력하세요" {...field} value={field.value || ""} />
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
                            <Input type="email" placeholder="이메일 주소" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">추가 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>비상 연락처</FormLabel>
                            <FormControl>
                              <Input placeholder="비상시 연락할 번호" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>직업</FormLabel>
                            <FormControl>
                              <Input placeholder="직업을 입력하세요" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="joinSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>가입경로</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="가입경로를 입력하세요 (예: 인터넷 검색, 지인 추천, 전단지, 지나가다가, SNS, 광고 등)" 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>특이사항</FormLabel>
                          <FormControl>
                            <Input placeholder="특이사항이나 메모를 입력하세요" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddMember(false)}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-500 hover-elevate"
                  disabled={addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? "등록 중..." : "등록 완료"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

        </>
      )}

      {/* Other tabs content */}
      {activeTab === "회원 삭제" && (
        <div className="px-3 md:px-6 py-3 md:py-4">
          <MemberDeletePage />
        </div>
      )}

      {activeTab === "환불 처리" && (
        <div className="px-3 md:px-6 py-3 md:py-4">
          <RefundProcessingTab />
        </div>
      )}

      {activeTab === "수업 연장" && (
        <div className="px-3 md:px-6 py-3 md:py-4">
          <GroupExtensionTab />
        </div>
      )}

      {activeTab === "정지 기록" && (
        <div className="px-3 md:px-6 py-3 md:py-4">
          <SuspensionRecordsTab />
        </div>
      )}

      {activeTab === "수정 기록" && (
        <div className="px-3 md:px-6 py-3 md:py-4">
          <ModificationRecordsTab />
        </div>
      )}

      {/* Excel Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>엑셀 파일 업로드</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>엑셀 파일을 업로드하여 회원 정보를 일괄 등록하세요.</p>
              <p className="mt-2">파일 형식: .xlsx, .xls</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
                <span className="text-blue-500 hover:text-blue-600 font-medium">
                  파일 선택
                </span>
              </label>
            </div>
            <div className="text-xs text-gray-500">
              <p>업로드 가능한 열:</p>
              <p>이름, 전화번호, 상태, 성별, 생년월일, 주소, 이메일, 비상연락처, 직업, 가입경로, 메모</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 💰 환불 처리 탭 컴포넌트 (Refund Processing Tab Component)
function RefundProcessingTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ type: string; id: number; name: string; price: number } | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const { toast } = useToast();

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // 📋 회원이 보유한 상품 조회 (Fetch member's purchased products)
  const { data: memberships = [] } = useQuery<any[]>({
    queryKey: ["/api/memberships"],
  });

  const { data: personalTrainings = [] } = useQuery<any[]>({
    queryKey: ["/api/personal-training"],
  });

  const { data: memberLockers = [] } = useQuery<any[]>({
    queryKey: ["/api/member-lockers"],
  });

  const { data: memberEquipment = [] } = useQuery<any[]>({
    queryKey: ["/api/member-equipment"],
  });

  const { data: refunds = [] } = useQuery<any[]>({
    queryKey: ["/api/refunds"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // 🔍 선택된 회원의 보유 상품 목록 생성 (Generate member's product list)
  const getMemberProducts = (memberId: number) => {
    const productList: { type: string; id: number; name: string; price: number }[] = [];

    // 회원권 (Memberships) - 스키마 필드명: type
    memberships
      .filter(m => m.memberId === memberId && m.status !== '환불')
      .forEach(m => {
        productList.push({
          type: 'membership',
          id: m.id,
          name: `[회원권] ${m.type || '회원권'}`,
          price: m.price || 0,
        });
      });

    // PT (Personal Training) - productId로 상품명 조회
    personalTrainings
      .filter(pt => pt.memberId === memberId && pt.status !== '환불')
      .forEach(pt => {
        const ptProduct = products.find((p: any) => p.id === pt.productId);
        productList.push({
          type: 'pt',
          id: pt.id,
          name: `[PT] ${ptProduct?.name || 'PT 수업'} (${pt.totalSessions !== null && pt.totalSessions !== undefined && pt.totalSessions > 0 ? `${pt.remainingSessions || 0}/${pt.totalSessions}회` : '무제한'})`,
          price: ptProduct?.price || 0,
        });
      });

    // 락커 (Member Lockers)
    memberLockers
      .filter(l => l.memberId === memberId && l.status !== '환불' && l.status !== '만료')
      .forEach(l => {
        productList.push({
          type: 'locker',
          id: l.id,
          name: `[락커] ${l.lockerSection || '락커'}`,
          price: l.monthlyFee || 0,
        });
      });

    // 운동 용품 (Member Equipment) - products 테이블에서 가격 조회
    memberEquipment
      .filter(e => e.memberId === memberId && e.status !== '환불' && e.status !== '반납완료')
      .forEach(e => {
        let equipmentPrice = 0;
        const equipName = e.equipmentName?.trim();
        if (equipName) {
          const exactMatch = products.find((p: any) => p.name?.trim() === equipName);
          if (exactMatch) {
            equipmentPrice = exactMatch.price || 0;
          } else {
            const partialMatch = products.find((p: any) => 
              p.name && equipName && (
                p.name.trim().includes(equipName) || 
                equipName.includes(p.name.trim())
              )
            );
            equipmentPrice = partialMatch?.price || 0;
          }
        }
        productList.push({
          type: 'equipment',
          id: e.id,
          name: `[용품] ${e.equipmentName || '운동 용품'}`,
          price: equipmentPrice,
        });
      });

    return productList;
  };

  // 선택된 회원의 보유 상품 목록 (Selected member's products)
  const memberProducts = selectedMember ? getMemberProducts(selectedMember.id) : [];

  // 🔄 상품 선택 시 환불 금액 자동 설정 (Auto-set refund amount when product selected)
  const handleProductSelect = (productValue: string) => {
    if (!productValue) {
      setSelectedProduct(null);
      setRefundAmount(0);
      return;
    }
    const [type, idStr] = productValue.split(':');
    const id = parseInt(idStr);
    const product = memberProducts.find(p => p.type === type && p.id === id);
    if (product) {
      setSelectedProduct(product);
      setRefundAmount(product.price);
    }
  };

  const createRefundMutation = useMutation({
    mutationFn: async (data: { memberId: number; memberName?: string; originalAmount: number; refundAmount: number; refundReason: string; productName?: string; productType?: string; productId?: number }) => {
      const res = await apiRequest("POST", "/api/refunds", {
        ...data,
        refundDate: new Date().toISOString(),
        status: "요청",
      });
      return res.ok ? (res.status === 204 ? null : await res.json()) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/refunds"] });
      toast({
        title: "환불 요청 등록 완료",
        description: "환불 요청이 성공적으로 등록되었습니다.",
      });
      setShowRefundDialog(false);
      setSelectedMember(null);
      setSelectedProduct(null);
      setRefundAmount(0);
    },
    onError: (error: Error) => {
      toast({
        title: "환불 요청 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRefundMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/refunds/${id}`, { 
        status, 
        processedDate: new Date().toISOString() 
      });
      return res.ok ? (res.status === 204 ? null : await res.json()) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/refunds"] });
      toast({
        title: "환불 처리 완료",
        description: "환불 상태가 업데이트되었습니다.",
      });
    },
  });

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const refundReason = formData.get("refundReason") as string;

    createRefundMutation.mutate({
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      originalAmount: selectedProduct?.price || refundAmount,
      refundAmount,
      refundReason,
      productName: selectedProduct?.name,
      productType: selectedProduct?.type,
      productId: selectedProduct?.id,
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "요청": return "bg-yellow-100 text-yellow-800";
      case "처리중": return "bg-blue-100 text-blue-800";
      case "완료": return "bg-green-100 text-green-800";
      case "거절": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">환불 처리</h2>
          <p className="text-sm text-gray-600">환불 요청 회원을 관리하세요 ({refunds.length}건)</p>
        </div>
        <Button
          className="bg-blue-500 hover-elevate w-full md:w-auto"
          onClick={() => setShowRefundDialog(true)}
        >
          <Plus className="w-4 h-4 shrink-0 mr-2" />
          환불 요청 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="회원 이름이나 전화번호를 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">상품명</th>
                  <th className="text-left p-3 font-medium">상품 정보</th>
                  <th className="text-left p-3 font-medium">환불 요청일</th>
                  <th className="text-left p-3 font-medium">환불 금액</th>
                  <th className="text-left p-3 font-medium">처리 상태</th>
                  <th className="text-left p-3 font-medium">처리 담당자</th>
                  <th className="text-left p-3 font-medium">처리</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-gray-500" colSpan={7}>
                      환불 요청 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  refunds.map((refund: any) => (
                    <tr key={refund.id} className="border-b">
                      <td className="p-3">{refund.productName || "알 수 없음"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          refund.productType === 'personal_training' || refund.productType === 'pt' 
                            ? 'bg-purple-100 text-purple-700' 
                            : refund.productType === 'membership' 
                              ? 'bg-blue-100 text-blue-700' 
                              : refund.productType === 'locker' 
                                ? 'bg-orange-100 text-orange-700' 
                                : refund.productType === 'equipment'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                        }`}>
                          {refund.productType === 'personal_training' || refund.productType === 'pt' 
                            ? '수업' 
                            : refund.productType === 'membership' 
                              ? '회원권' 
                              : refund.productType === 'locker' 
                                ? '락커' 
                                : refund.productType === 'equipment'
                                  ? '운동용품'
                                  : '기타'}
                        </span>
                      </td>
                      <td className="p-3">{new Date(refund.refundDate || refund.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 tabular-nums">{refund.refundAmount?.toLocaleString()}원</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(refund.status)}`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="p-3">{refund.processedBy || "-"}</td>
                      <td className="p-3">
                        {refund.status === "요청" && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => updateRefundMutation.mutate({ id: refund.id, status: "완료" })}
                              disabled={updateRefundMutation.isPending}
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRefundMutation.mutate({ id: refund.id, status: "거절" })}
                              disabled={updateRefundMutation.isPending}
                            >
                              거절
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 환불 요청 추가 대화상자 */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>환불 요청 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">회원 선택</label>
              <select
                name="memberId"
                required
                onChange={(e) => {
                  const member = members.find(m => m.id === parseInt(e.target.value));
                  setSelectedMember(member || null);
                  setSelectedProduct(null);
                  setRefundAmount(0);
                }}
                className="w-full p-2 border rounded-md"
                data-testid="select-refund-member"
              >
                <option value="">회원을 선택하세요</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({formatPhoneNumber(member.phone)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">환불 상품</label>
              <select
                name="productId"
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full p-2 border rounded-md"
                data-testid="select-refund-product"
                disabled={!selectedMember}
              >
                <option value="">
                  {!selectedMember 
                    ? "먼저 회원을 선택하세요" 
                    : memberProducts.length === 0 
                      ? "보유한 상품이 없습니다" 
                      : "환불할 상품을 선택하세요"}
                </option>
                {memberProducts.map((product) => (
                  <option key={`${product.type}:${product.id}`} value={`${product.type}:${product.id}`}>
                    {product.name} ({product.price?.toLocaleString()}원)
                  </option>
                ))}
              </select>
              {selectedMember && memberProducts.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">해당 회원이 보유한 환불 가능한 상품이 없습니다.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">환불 금액</label>
              <input
                type="number"
                name="refundAmount"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseInt(e.target.value) || 0)}
                placeholder="환불 금액을 입력하세요"
                className="w-full p-2 border rounded-md"
                data-testid="input-refund-amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">환불 사유</label>
              <textarea
                name="refundReason"
                required
                placeholder="환불 사유를 입력하세요"
                className="w-full p-2 border rounded-md h-20"
                data-testid="input-refund-reason"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowRefundDialog(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createRefundMutation.isPending} data-testid="btn-submit-refund">
                {createRefundMutation.isPending ? "처리 중..." : "등록"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 👥 수업 연장 탭 컴포넌트 (Class Extension Tab Component)
function GroupExtensionTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const { toast } = useToast();

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: extensions = [] } = useQuery<any[]>({
    queryKey: ["/api/group-extensions"],
  });

  const createExtensionMutation = useMutation({
    mutationFn: async (data: {
      memberIds: number[];
      extensionDays: number;
      extensionReason: string;
    }) => {
      const res = await apiRequest("POST", "/api/group-extensions", {
        memberIds: data.memberIds,
        extensionDays: data.extensionDays,
        reason: data.extensionReason,
        processedDate: new Date().toISOString(),
        status: "완료",
      });
      return res.ok ? (res.status === 204 ? null : await res.json()) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-extensions"] });
      toast({
        title: "수업 연장 완료",
        description: "선택한 회원들의 이용권이 성공적으로 연장되었습니다.",
      });
      setShowExtensionDialog(false);
      setSelectedMembers([]);
    },
    onError: (error: Error) => {
      toast({
        title: "수업 연장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExtensionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      toast({
        title: "회원 선택 필요",
        description: "연장할 회원을 최소 1명 이상 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const extensionDays = parseInt(formData.get("extensionDays") as string);
    const extensionReason = formData.get("extensionReason") as string;

    createExtensionMutation.mutate({
      memberIds: selectedMembers,
      extensionDays,
      extensionReason,
    });
  };

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">수업 연장</h2>
          <p className="text-sm text-gray-600">여러 회원의 이용권을 일괄 연장하세요 ({extensions.length}회)</p>
        </div>
        <Button
          className="bg-blue-500 hover-elevate w-full md:w-auto"
          onClick={() => setShowExtensionDialog(true)}
        >
          <Plus className="w-4 h-4 shrink-0 mr-2" />
          수업 연장 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="회원 이름이나 전화번호를 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">선택</th>
                  <th className="text-left p-3 font-medium">이름</th>
                  <th className="text-left p-3 font-medium">성별</th>
                  <th className="text-left p-3 font-medium">연락처</th>
                  <th className="text-left p-3 font-medium">등록일</th>
                  <th className="text-left p-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-gray-500" colSpan={6}>
                      회원 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-3">{member.name}</td>
                      <td className="p-3">{member.gender}</td>
                      <td className="p-3">{formatPhoneNumber(member.phone)}</td>
                      <td className="p-3">{new Date(member.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          활성
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedMembers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedMembers.length}명의 회원이 선택되었습니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 수업 연장 대화상자 */}
      <Dialog open={showExtensionDialog} onOpenChange={setShowExtensionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>수업 연장</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExtensionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">연장 일수</label>
              <input
                type="number"
                name="extensionDays"
                required
                placeholder="연장할 일수를 입력하세요"
                className="w-full p-2 border rounded-md"
                min="1"
                max="365"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">연장 사유</label>
              <textarea
                name="extensionReason"
                required
                placeholder="연장 사유를 입력하세요"
                className="w-full p-2 border rounded-md h-20"
              />
            </div>
            <div className="text-sm text-gray-600">
              선택된 회원: {selectedMembers.length}명
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowExtensionDialog(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createExtensionMutation.isPending}>
                {createExtensionMutation.isPending ? "처리 중..." : "연장 실행"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 🛑 정지 기록 탭 컴포넌트 (Suspension Records Tab Component)
function SuspensionRecordsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuspensionDialog, setShowSuspensionDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { toast } = useToast();

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: suspensions = [] } = useQuery<any[]>({
    queryKey: ["/api/suspensions"],
  });

  const createSuspensionMutation = useMutation({
    mutationFn: async (data: {
      memberId: number;
      startDate: string;
      endDate: string;
      reason: string;
    }) => {
      const res = await apiRequest("POST", "/api/suspensions", {
        memberId: data.memberId,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        reason: data.reason,
        status: "활성",
      });
      return res.ok ? (res.status === 204 ? null : await res.json()) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suspensions"] });
      toast({
        title: "정지 처리 완료",
        description: "회원 정지 처리가 성공적으로 등록되었습니다.",
      });
      setShowSuspensionDialog(false);
      setSelectedMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: "정지 처리 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const releaseSuspensionMutation = useMutation({
    mutationFn: async (suspensionId: number) => {
      const res = await apiRequest("PATCH", `/api/suspensions/${suspensionId}/release`, {});
      return res.ok ? (res.status === 204 ? null : await res.json()) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suspensions"] });
      toast({
        title: "정지 해제 완료",
        description: "회원 정지가 해제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "정지 해제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSuspensionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const startDate = formData.get("suspensionStartDate") as string;
    const endDate = formData.get("suspensionEndDate") as string;
    const reason = formData.get("suspensionReason") as string;

    createSuspensionMutation.mutate({
      memberId: selectedMember.id,
      startDate,
      endDate,
      reason,
    });
  };

  const isActiveSuspension = (suspension: any) => {
    const now = new Date();
    const startDate = new Date(suspension.startDate);
    const endDate = suspension.endDate ? new Date(suspension.endDate) : null;
    if (!endDate) return now >= startDate;
    return startDate <= now && now <= endDate;
  };

  const getStatusBadgeColor = (suspension: any) => {
    const now = new Date();
    const startDate = new Date(suspension.startDate);
    const endDate = suspension.endDate ? new Date(suspension.endDate) : null;

    if (now < startDate) return "bg-gray-100 text-gray-800"; // 예정
    if (!endDate || (now >= startDate && now <= endDate)) return "bg-red-100 text-red-800"; // 정지 중
    return "bg-green-100 text-green-800"; // 해제됨
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">정지 기록</h2>
          <p className="text-sm text-gray-600">회원들의 정지 기록을 확인하세요 ({suspensions.length}건)</p>
        </div>
        <Button
          className="bg-blue-500 hover-elevate w-full md:w-auto"
          onClick={() => setShowSuspensionDialog(true)}
        >
          <Plus className="w-4 h-4 shrink-0 mr-2" />
          정지 기록 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="회원 이름이나 전화번호를 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">회원명</th>
                  <th className="text-left p-3 font-medium">연락처</th>
                  <th className="text-left p-3 font-medium">정지 기간</th>
                  <th className="text-left p-3 font-medium">정지 사유</th>
                  <th className="text-left p-3 font-medium">처리 상태</th>
                  <th className="text-left p-3 font-medium">처리</th>
                </tr>
              </thead>
              <tbody>
                {suspensions.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-gray-500" colSpan={6}>
                      정지 기록 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  suspensions.map((suspension: any) => (
                    <tr key={suspension.id} className="border-b">
                      <td className="p-3">{suspension.member?.name || "알 수 없음"}</td>
                      <td className="p-3">{formatPhoneNumber(suspension.member?.phone) || "알 수 없음"}</td>
                      <td className="p-3">
                        {new Date(suspension.startDate).toLocaleDateString()} ~ {suspension.endDate ? new Date(suspension.endDate).toLocaleDateString() : '무기한'}
                      </td>
                      <td className="p-3">{suspension.reason}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(suspension)}`}>
                          {isActiveSuspension(suspension) ? "정지 중" : "해제됨"}
                        </span>
                      </td>
                      <td className="p-3">
                        {isActiveSuspension(suspension) && suspension.status !== "해제" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={releaseSuspensionMutation.isPending}
                            onClick={() => {
                              releaseSuspensionMutation.mutate(suspension.id);
                            }}
                          >
                            {releaseSuspensionMutation.isPending ? "처리 중..." : "해제"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 정지 처리 추가 대화상자 */}
      <Dialog open={showSuspensionDialog} onOpenChange={setShowSuspensionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>정지 처리 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSuspensionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">회원 선택</label>
              <select
                name="memberId"
                required
                onChange={(e) => {
                  const member = members.find(m => m.id === parseInt(e.target.value));
                  setSelectedMember(member || null);
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">회원을 선택하세요</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({formatPhoneNumber(member.phone)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">정지 시작일</label>
              <input
                type="date"
                name="suspensionStartDate"
                required
                className="w-full p-2 border rounded-md"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">정지 종료일</label>
              <input
                type="date"
                name="suspensionEndDate"
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">정지 사유</label>
              <textarea
                name="suspensionReason"
                required
                placeholder="정지 사유를 입력하세요"
                className="w-full p-2 border rounded-md h-20"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowSuspensionDialog(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createSuspensionMutation.isPending}>
                {createSuspensionMutation.isPending ? "처리 중..." : "등록"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 📝 수정 기록 탭 컴포넌트 (Modification Records Tab Component)
function ModificationRecordsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "modification" | "deletion">("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set()); // 선택된 수정 기록 ID (Selected modification IDs)
  const { toast } = useToast();
  
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: modifications = [] } = useQuery<any[]>({
    queryKey: ["/api/member-modifications"],
  });

  const { data: deletions = [] } = useQuery<any[]>({
    queryKey: ["/api/member-deletions"],
  });

  // 🗑️ 일괄 삭제 mutation (Bulk delete mutation)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => apiRequest("DELETE", `/api/member-modifications/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-modifications"] });
      setSelectedIds(new Set());
      toast({ title: `${selectedIds.size}개의 수정 기록이 삭제되었습니다.` });
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "일부 기록 삭제에 실패했습니다.", variant: "destructive" });
    },
  });

  // 체크박스 토글 (Toggle checkbox)
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제 (Select/Deselect all)
  const toggleSelectAll = (modificationRecords: any[]) => {
    const selectableIds = modificationRecords
      .filter(r => r.type === "modification" && r.originalId)
      .map(r => r.originalId);
    
    if (selectableIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const combinedRecords = [
    ...modifications.map((mod: any) => {
      const member = members.find((m: any) => m.id === mod.memberId);
      return {
        id: `mod-${mod.id}`,
        originalId: mod.id, // 삭제용 원본 ID (Original ID for deletion)
        type: "modification" as const,
        memberName: member?.name || mod.memberName || "알 수 없음",
        memberPhone: member?.phone || "-",
        recordType: mod.fieldName || "정보 수정",
        date: mod.modificationDate || mod.modification_date,
        processedBy: mod.modifiedBy || mod.modified_by || "시스템",
        notes: mod.notes || `${mod.oldValue || mod.old_value || ""} → ${mod.newValue || mod.new_value || ""}`,
      };
    }),
    ...deletions.map((del: any) => ({
      id: `del-${del.id}`,
      type: "deletion" as const,
      memberName: del.member_name || del.memberName || "알 수 없음",
      memberPhone: "-",
      recordType: "회원 삭제",
      date: del.deletion_date || del.deletionDate,
      processedBy: del.deleted_by || del.deletedBy || "시스템",
      notes: del.reason || del.notes || "회원 완전 삭제",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredRecords = combinedRecords.filter((record) => {
    const matchesSearch = record.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.memberPhone.includes(searchTerm);
    const matchesType = filterType === "all" || record.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalCount = combinedRecords.length;
  const modificationCount = modifications.length;
  const deletionCount = deletions.length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-semibold">수정/삭제 기록</h2>
        <p className="text-sm text-gray-600">
          회원 정보 변경 내역 (총 {totalCount}건: 수정 {modificationCount}건, 삭제 {deletionCount}건)
        </p>
      </div>

      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="회원 이름으로 검색하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-modification-search"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                data-testid="button-filter-all"
              >
                전체 ({totalCount})
              </Button>
              <Button
                variant={filterType === "modification" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("modification")}
                data-testid="button-filter-modification"
              >
                수정 ({modificationCount})
              </Button>
              <Button
                variant={filterType === "deletion" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("deletion")}
                data-testid="button-filter-deletion"
              >
                삭제 ({deletionCount})
              </Button>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-800">
                {selectedIds.size}개 선택됨
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`선택한 ${selectedIds.size}개의 수정 기록을 삭제하시겠습니까?`)) {
                    bulkDeleteMutation.mutate(Array.from(selectedIds));
                  }
                }}
                disabled={bulkDeleteMutation.isPending}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {bulkDeleteMutation.isPending ? "삭제 중..." : "선택 삭제"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                data-testid="button-clear-selection"
              >
                선택 해제
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-center p-3 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                      checked={filteredRecords.filter(r => r.type === "modification" && "originalId" in r).length > 0 && 
                               filteredRecords.filter(r => r.type === "modification" && "originalId" in r).every(r => selectedIds.has((r as any).originalId))}
                      onChange={() => toggleSelectAll(filteredRecords)}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                  <th className="text-left p-3 font-medium">회원명</th>
                  <th className="text-left p-3 font-medium">유형</th>
                  <th className="text-left p-3 font-medium">변경 내용</th>
                  <th className="text-left p-3 font-medium">일시</th>
                  <th className="text-left p-3 font-medium">처리자</th>
                  <th className="text-left p-3 font-medium">비고</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-gray-500" colSpan={7}>
                      기록 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className={`border-b hover-elevate ${record.type === "modification" && record.originalId && selectedIds.has(record.originalId) ? "bg-blue-50" : ""}`}
                    >
                      <td className="text-center p-3">
                        {record.type === "modification" && record.originalId ? (
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300"
                            checked={selectedIds.has(record.originalId)}
                            onChange={() => toggleSelect(record.originalId)}
                            data-testid={`checkbox-modification-${record.originalId}`}
                          />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-3 font-medium">{record.memberName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.type === "deletion" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {record.type === "deletion" ? "삭제" : "수정"}
                        </span>
                      </td>
                      <td className="p-3">{record.recordType}</td>
                      <td className="p-3">{new Date(record.date).toLocaleString("ko-KR")}</td>
                      <td className="p-3">{record.processedBy}</td>
                      <td className="p-3 max-w-xs truncate" title={record.notes}>{record.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}