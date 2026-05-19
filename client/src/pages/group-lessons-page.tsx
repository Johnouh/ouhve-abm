import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus, Users, RefreshCw, X, FileText, User, Clock, Calendar, Banknote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { DeleteConfirmDialog } from "@/components/ui/custom-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface GroupLesson {
  id: number;
  name: string;
  instructor: string;
  instructorId: number;
  time: string;
  startTime: string | null;
  endTime: string | null;
  participants: number;
  maxParticipants: number;
  minParticipants: number | null;
  duration: string;
  dayOfWeek: number;
  operatingDays: string[] | null;
  status: string;
  capacity: string;
  waitList: string;
  price: number | null;
  productId: number | null;
  franchiseId: number;
  createdAt: string;
}

const groupLessonFormSchema = z.object({
  name: z.string().min(1, "수업명을 입력해주세요"),
  instructorId: z.string().optional(),
  startTime: z.string().min(1, "시작 시간을 선택해주세요"),
  endTime: z.string().min(1, "종료 시간을 선택해주세요"),
  selectedDays: z.array(z.string()).min(1, "운영 요일을 선택해주세요"),
  maxParticipants: z.coerce.number().min(1, "최대 인원을 입력해주세요"),
  minParticipants: z.coerce.number().min(1, "최소 인원을 입력해주세요"),
  price: z.coerce.number().min(0, "가격을 입력해주세요"),
});

type GroupLessonFormData = z.infer<typeof groupLessonFormSchema>;

export default function GroupLessonsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [activeSubTab, setActiveSubTab] = useState("전체 수업");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedLessonForDelete, setSelectedLessonForDelete] = useState<GroupLesson | null>(null);
  const [selectedLessonForEdit, setSelectedLessonForEdit] = useState<GroupLesson | null>(null);
  
  const { toast } = useToast();
  const queryClientHook = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<GroupLessonFormData>({
    resolver: zodResolver(groupLessonFormSchema),
    defaultValues: {
      name: "",
      instructorId: "",
      startTime: "",
      endTime: "",
      selectedDays: [],
      maxParticipants: 10,
      minParticipants: 1,
      price: 0,
    },
  });
  
  const { data: staffData = [], isLoading: staffLoading } = useQuery<any[]>({
    queryKey: ['/api/staff'],
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: groupLessons = [], isLoading: lessonsLoading } = useQuery<GroupLesson[]>({
    queryKey: ['/api/group-lessons'],
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // products 데이터 쿼리 (연결된 상품에서 operatingDays, minParticipants, endTime 가져오기용)
  const { data: productsData = [] } = useQuery<any[]>({
    queryKey: ['/api/products'],
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const createGroupLessonMutation = useMutation({
    mutationFn: async (data: GroupLessonFormData) => {
      // /api/products로 POST하여 상품과 그룹 수업 동시 생성
      const response = await apiRequest("POST", "/api/products", {
        name: data.name,
        price: data.price,
        category: "수업 상품",
        lessonType: "그룹 수업",
        instructorId: data.instructorId ? parseInt(data.instructorId) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        operatingDays: data.selectedDays,
        maxParticipants: data.maxParticipants,
        minParticipants: data.minParticipants,
        status: "활성",
        appExposed: true,
        duration: 1,
        durationType: "회",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['/api/group-lessons'] });
      queryClientHook.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "그룹 수업 등록 완료",
        description: "새로운 그룹 수업이 성공적으로 등록되었습니다.",
      });
      setShowAddDialog(false);
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

  const deleteGroupLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/group-lessons/${id}`);
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['/api/group-lessons'] });
      toast({
        title: "그룹 수업 삭제 완료",
        description: "그룹 수업이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "그룹 수업 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateGroupLessonMutation = useMutation({
    mutationFn: async (data: GroupLessonFormData & { id: number }) => {
      const { id, ...updateData } = data;
      // 첫 번째 선택된 요일을 dayOfWeek로 변환 (레거시 호환용)
      const dayNameToNumber: { [key: string]: number } = { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 };
      const dayOfWeek = updateData.selectedDays.length > 0 ? dayNameToNumber[updateData.selectedDays[0]] : 1;
      
      const response = await apiRequest("PUT", `/api/group-lessons/${id}`, {
        name: updateData.name,
        instructorId: updateData.instructorId && updateData.instructorId !== "none" ? parseInt(updateData.instructorId) : null,
        // 새 필드 사용 (startTime, endTime)
        startTime: updateData.startTime,
        endTime: updateData.endTime,
        time: updateData.startTime, // 레거시 호환
        dayOfWeek: dayOfWeek, // 레거시 호환
        operatingDays: updateData.selectedDays,
        maxParticipants: updateData.maxParticipants,
        minParticipants: updateData.minParticipants,
        price: updateData.price,
      });
      return response.status === 204 ? null : await response.json();
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['/api/group-lessons'] });
      queryClientHook.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "그룹 수업 수정 완료",
        description: "그룹 수업이 성공적으로 수정되었습니다.",
      });
      setShowEditDialog(false);
      setSelectedLessonForEdit(null);
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

  const syncToProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/group-lessons/sync-to-products", {});
      return await response.json();
    },
    onSuccess: (data: { message: string; syncedCount: number; skippedCount: number }) => {
      queryClientHook.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "동기화 완료",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "동기화 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClass = (lesson: GroupLesson) => {
    setSelectedLessonForDelete(lesson);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    if (selectedLessonForDelete) {
      deleteGroupLessonMutation.mutate(selectedLessonForDelete.id);
      setShowDeleteDialog(false);
      setSelectedLessonForDelete(null);
    }
  };

  const onSubmitLesson = (data: GroupLessonFormData) => {
    createGroupLessonMutation.mutate(data);
  };

  const handleEditClass = (lesson: GroupLesson) => {
    setSelectedLessonForEdit(lesson);
    const dayName = getDayName(lesson.dayOfWeek);
    
    // API 응답의 새 필드로 직접 초기화 (상품 조회 없이)
    // operatingDays가 있으면 사용, 없으면 dayOfWeek에서 폴백
    const operatingDays = lesson.operatingDays && lesson.operatingDays.length > 0
      ? lesson.operatingDays
      : (dayName !== '-' ? [dayName] : []);
    
    // startTime이 있으면 사용, 없으면 레거시 time 필드에서 폴백
    const startTime = lesson.startTime || lesson.time || '';
    const endTime = lesson.endTime || '';
    const minParticipants = lesson.minParticipants || 1;
    const price = lesson.price || 0;
    
    form.reset({
      name: lesson.name,
      instructorId: String(lesson.instructorId || ''),
      startTime: startTime,
      endTime: endTime,
      selectedDays: operatingDays,
      maxParticipants: lesson.maxParticipants || 10,
      minParticipants: minParticipants,
      price: price,
    });
    setShowEditDialog(true);
  };

  const onSubmitEdit = (data: GroupLessonFormData) => {
    if (selectedLessonForEdit) {
      updateGroupLessonMutation.mutate({ ...data, id: selectedLessonForEdit.id });
    }
  };

  const getInstructorName = (instructorId: number) => {
    const staff = staffData.find((s: any) => s.id === instructorId);
    return staff ? (staff.status === '퇴사' ? '-' : staff.name) : '-';
  };

  const filteredLessons = useMemo(() => {
    return groupLessons.filter(lesson => {
      if (activeSubTab === "전체 수업") return true;
      if (activeSubTab === "앱 노출 수업") return lesson.id % 2 === 0;
      if (activeSubTab === "앱 미노출 수업") return lesson.id % 2 === 1;
      return true;
    });
  }, [groupLessons, activeSubTab]);

  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLessons = filteredLessons.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubTab]);

  const getDayName = (dayOfWeek: number) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[dayOfWeek] || '-';
  };

  if (staffLoading || lessonsLoading) {
    return (
      <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">데이터를 불러오는 중...</div>
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
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">그룹 수업</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">그룹 수업 관리 시스템</p>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 overflow-x-auto">
        <div className="flex space-x-4 md:space-x-8 whitespace-nowrap">
          {["전체 수업", "앱 노출 수업", "앱 미노출 수업"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-4 px-2 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                activeSubTab === tab
                  ? "text-gray-900 border-blue-500"
                  : "text-gray-500 hover:text-gray-700 border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 md:space-y-6 px-3 md:px-6">
        {/* Lessons Table */}
        <Card className="border-0 shadow-lg">
          <CardAccentLine />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="w-16 text-center font-semibold hidden md:table-cell">순번</TableHead>
                  <TableHead className="font-semibold">수업명</TableHead>
                  <TableHead className="font-semibold">강사</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">시간</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">정원</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">가격</TableHead>
                  <TableHead className="font-semibold">상태</TableHead>
                  <TableHead className="font-semibold text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessonsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse mx-auto"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLessons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center space-y-4">
                        <Users className="w-12 h-12 text-gray-400" />
                        <p className="text-lg font-medium">등록된 그룹 수업이 없습니다</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLessons.map((lesson, index) => (
                    <TableRow
                      key={lesson.id}
                      className="hover-elevate transition-all duration-200"
                    >
                      <TableCell className="text-center text-sm text-gray-600 hidden md:table-cell">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{lesson.name}</div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {lesson.instructor || getInstructorName(lesson.instructorId)}
                      </TableCell>
                      <TableCell className="text-gray-700 hidden md:table-cell">
                        {lesson.time || '-'} ({getDayName(lesson.dayOfWeek)})
                      </TableCell>
                      <TableCell className="text-gray-700 hidden md:table-cell">
                        {lesson.participants || 0}/{lesson.maxParticipants || 0}명
                      </TableCell>
                      <TableCell className="text-gray-700 tabular-nums hidden md:table-cell">
                        {lesson.price !== null && lesson.price !== undefined ? lesson.price.toLocaleString() + '원' : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lesson.status === "활성" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {lesson.status || "활성"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClass(lesson)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                            data-testid={`button-edit-lesson-${lesson.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClass(lesson)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                            data-testid={`button-delete-lesson-${lesson.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
            {filteredLessons.length > itemsPerPage && (
              <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 gap-2">
                <div className="text-xs md:text-sm text-gray-600">
                  전체 {filteredLessons.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredLessons.length)}개 표시
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

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => syncToProductsMutation.mutate()}
            disabled={syncToProductsMutation.isPending}
            data-testid="button-sync-to-products"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncToProductsMutation.isPending ? 'animate-spin' : ''}`} />
            {syncToProductsMutation.isPending ? "동기화 중..." : "상품 동기화"}
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover-elevate text-white shadow-lg"
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-group-lesson"
          >
            <Plus className="w-4 h-4 mr-2" />
            그룹 수업 등록
          </Button>
        </div>
      </div>

      {/* Add Group Lesson Dialog - 상품 페이지와 동일한 디자인 */}
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
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">그룹 수업 등록</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  form.reset();
                }}
                className="p-2 hover-elevate rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 폼 내용 */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitLesson)} className="p-6 space-y-5">
                {/* 수업명 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">수업명 *</Label>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="수업명을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 담당 강사 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">담당 강사</Label>
                  <FormField
                    control={form.control}
                    name="instructorId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="강사를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">선택 안함</SelectItem>
                            {staffData
                              .filter((staff: any) => staff && staff.id && staff.status !== '퇴사')
                              .map((staff: any) => (
                                <SelectItem key={staff.id} value={String(staff.id)}>
                                  {staff.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 수업 시간 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">수업 시간 *</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
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
                      )}
                    />
                    <span className="text-gray-500">~</span>
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
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
                      )}
                    />
                  </div>
                </div>

                {/* 운영 요일 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">운영 요일 *</Label>
                  <FormField
                    control={form.control}
                    name="selectedDays"
                    render={({ field }) => (
                      <div className="flex gap-2 flex-1">
                        {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const newDays = field.value.includes(day)
                                ? field.value.filter((d: string) => d !== day)
                                : [...field.value, day];
                              field.onChange(newDays);
                            }}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                              field.value.includes(day)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover-elevate'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* 수업료 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-4 w-4 text-blue-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">수업료 (원)</Label>
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 인원 설정 */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">인원 설정 *</Label>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">정원</span>
                      <FormField
                        control={form.control}
                        name="maxParticipants"
                        rules={{ required: "정원을 입력해주세요" }}
                        render={({ field }) => (
                          <Input
                            type="number"
                            className="w-16"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                      <span className="text-sm text-gray-500">명</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">최소</span>
                      <FormField
                        control={form.control}
                        name="minParticipants"
                        render={({ field }) => (
                          <Input
                            type="number"
                            className="w-16"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                      <span className="text-sm text-gray-500">명</span>
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      form.reset();
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-500 hover-elevate"
                    disabled={createGroupLessonMutation.isPending}
                  >
                    {createGroupLessonMutation.isPending ? "등록 중..." : "그룹 수업 등록"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="그룹 수업 삭제"
        description={`"${selectedLessonForDelete?.name}" 수업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
      />

      {/* Edit Group Lesson Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setSelectedLessonForEdit(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-md" aria-describedby="edit-group-lesson-dialog-description">
          <DialogHeader>
            <DialogTitle>그룹 수업 수정</DialogTitle>
            <DialogDescription id="edit-group-lesson-dialog-description" className="sr-only">
              그룹 수업 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>수업명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="수업명을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>담당 강사</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="강사를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffData
                          .filter((staff: any) => staff && staff.id && staff.status !== '퇴사')
                          .map((staff: any) => (
                            <SelectItem key={staff.id} value={String(staff.id)}>
                              {staff.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시작 시간 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="시작" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {i.toString().padStart(2, '0')}:00
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
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>종료 시간 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="종료" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {i.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="selectedDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>요일 *</FormLabel>
                    <div className="flex gap-2">
                      {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const newDays = field.value.includes(day)
                              ? field.value.filter((d: string) => d !== day)
                              : [...field.value, day];
                            field.onChange(newDays);
                          }}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                            field.value.includes(day)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover-elevate'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>최소 인원</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>최대 인원 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>수업료 (원)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedLessonForEdit(null);
                    form.reset();
                  }}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-500 hover-elevate"
                  disabled={updateGroupLessonMutation.isPending}
                >
                  {updateGroupLessonMutation.isPending ? "수정 중..." : "수정 완료"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
