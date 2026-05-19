import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Search, X, Plus, Edit, Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/custom-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Consultation, Staff } from "@shared/schema";
import { formatPhoneNumber } from "@/utils/input-sanitizer";

const consultationFormSchema = z.object({
  customerName: z.string().min(1, "고객명을 입력해주세요"),
  phone: z.string().min(1, "연락처를 입력해주세요"),
  consultationDate: z.string().min(1, "상담일을 선택해주세요"),
  consultationTime: z.string().min(1, "상담시간을 선택해주세요"),
  counselorId: z.string().optional(),
  consultationType: z.string().min(1, "상담 유형을 선택해주세요"),
  method: z.string().optional(),
  status: z.string().min(1, "상태를 선택해주세요"),
  notes: z.string().optional(),
});

type ConsultationFormData = z.infer<typeof consultationFormSchema>;

export default function ConsultationsPage() {
  const { toast } = useToast();
  const queryClientHook = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedConsultationForDelete, setSelectedConsultationForDelete] = useState<Consultation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [isCustomConsultationType, setIsCustomConsultationType] = useState(false); // 직접 입력 모드 상태
  const [customConsultationType, setCustomConsultationType] = useState(""); // 직접 입력 값
  const itemsPerPage = 5;

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      consultationDate: new Date().toISOString().split('T')[0],
      consultationTime: "10:00",
      counselorId: "",
      consultationType: "",
      method: "",
      status: "pending",
      notes: "",
    },
  });

  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ['consultations'],
    queryFn: async () => {
      const response = await fetch('/api/consultations-direct', {
        credentials: 'include'
      });
      if (!response.ok) {
        return [];
      }
      return response.json() as Promise<Consultation[]>;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });

  const createConsultationMutation = useMutation({
    mutationFn: async (data: ConsultationFormData) => {
      const combinedDateTime = `${data.consultationDate}T${data.consultationTime}:00`;
      // 상담 유형 결정: 직접 입력일 경우 customConsultationType 사용
      const finalConsultationType = isCustomConsultationType && customConsultationType.trim() 
        ? "직접 입력" 
        : data.consultationType;
      const finalCustomType = isCustomConsultationType && customConsultationType.trim() 
        ? customConsultationType.trim() 
        : undefined;
      
      const response = await apiRequest("POST", "/api/consultations-direct", {
        customerName: data.customerName,
        phone: data.phone,
        consultationDate: new Date(combinedDateTime),
        consultationType: finalConsultationType,
        customConsultationType: finalCustomType,
        counselorId: data.counselorId ? parseInt(data.counselorId) : undefined,
        method: data.method || undefined,
        status: data.status,
        notes: data.notes || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['consultations'] });
      toast({
        title: "상담 등록 완료",
        description: "새로운 상담이 성공적으로 등록되었습니다.",
      });
      setShowAddDialog(false);
      setIsCustomConsultationType(false);
      setCustomConsultationType("");
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "등록 실패",
        description: error.message || "상담 등록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateConsultationMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & ConsultationFormData) => {
      const combinedDateTime = `${data.consultationDate}T${data.consultationTime}:00`;
      // 상담 유형 결정: 직접 입력일 경우 customConsultationType 사용
      const finalConsultationType = isCustomConsultationType && customConsultationType.trim() 
        ? "직접 입력" 
        : data.consultationType;
      const finalCustomType = isCustomConsultationType && customConsultationType.trim() 
        ? customConsultationType.trim() 
        : undefined;
      
      const response = await apiRequest("PUT", `/api/consultations-direct/${id}`, {
        customerName: data.customerName,
        phone: data.phone,
        consultationDate: new Date(combinedDateTime),
        consultationType: finalConsultationType,
        customConsultationType: finalCustomType,
        counselorId: data.counselorId ? parseInt(data.counselorId) : undefined,
        method: data.method || undefined,
        status: data.status,
        notes: data.notes || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['consultations'] });
      toast({
        title: "수정 완료",
        description: "상담이 성공적으로 수정되었습니다.",
      });
      setShowAddDialog(false);
      setEditingConsultation(null);
      setIsCustomConsultationType(false);
      setCustomConsultationType("");
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "수정 실패",
        description: error.message || "상담 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteConsultationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/consultations-direct/${id}`);
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['consultations'] });
      toast({
        title: "삭제 완료",
        description: "상담이 성공적으로 삭제되었습니다.",
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, consultation }: { id: number; status: string; consultation: Consultation }) => {
      const response = await apiRequest("PUT", `/api/consultations-direct/${id}`, {
        customerName: consultation.customerName,
        phone: consultation.phone,
        consultationDate: new Date(consultation.consultationDate),
        consultationType: consultation.consultationType,
        counselorId: consultation.counselorId,
        method: consultation.method,
        notes: consultation.notes,
        status: status,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClientHook.invalidateQueries({ queryKey: ['consultations'] });
      const statusText = variables.status === 'completed' ? '완료' : variables.status === 'cancelled' ? '취소' : variables.status;
      toast({
        title: "상태 변경 완료",
        description: `상담 상태가 '${statusText}'로 변경되었습니다.`,
      });
      setShowDetailPanel(false);
      setSelectedConsultation(null);
    },
    onError: (error: Error) => {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredConsultations = useMemo(() => {
    if (!Array.isArray(consultations)) return [];
    
    return consultations
      .filter(c => {
        if (!c || typeof c !== 'object') return false;
        const searchLower = searchTerm.toLowerCase().trim();
        return !searchLower || 
          (c.customerName && c.customerName.toLowerCase().includes(searchLower)) ||
          (c.phone && c.phone.includes(searchTerm.trim()));
      })
      .sort((a, b) => b.id - a.id);
  }, [consultations, searchTerm]);

  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedConsultations = filteredConsultations.slice(startIndex, endIndex);

  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월`;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setCurrentPage(1);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getCounselorName = (counselorId: number | null | undefined) => {
    if (!counselorId) return '-';
    const staffMember = staffList.find(s => s.id === counselorId);
    return staffMember?.name || '-';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">완료</span>;
      case "pending":
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">대기</span>;
      case "cancelled":
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">취소</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">{status}</span>;
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
  };

  const handleAddConsultation = () => {
    form.reset({
      customerName: "",
      phone: "",
      consultationDate: new Date().toISOString().split('T')[0],
      consultationTime: "10:00",
      counselorId: "",
      consultationType: "",
      method: "",
      status: "pending",
      notes: "",
    });
    setEditingConsultation(null);
    setShowAddDialog(true);
  };

  const handleEditConsultation = useCallback((consultation: Consultation) => {
    setEditingConsultation(consultation);
    
    const consultationDateTime = new Date(consultation.consultationDate);
    const dateStr = consultationDateTime.toISOString().split('T')[0];
    const timeStr = consultationDateTime.toTimeString().slice(0, 5);
    
    form.reset({
      customerName: consultation.customerName,
      phone: consultation.phone,
      consultationDate: dateStr,
      consultationTime: timeStr,
      counselorId: consultation.counselorId?.toString() || "",
      consultationType: consultation.consultationType,
      method: consultation.method || "",
      status: consultation.status,
      notes: consultation.notes || "",
    });
    
    setShowAddDialog(true);
  }, [form]);

  const handleDeleteConsultation = useCallback((consultation: Consultation) => {
    setSelectedConsultationForDelete(consultation);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedConsultationForDelete) {
      deleteConsultationMutation.mutate(selectedConsultationForDelete.id);
      setShowDeleteDialog(false);
      setSelectedConsultationForDelete(null);
    }
  }, [selectedConsultationForDelete, deleteConsultationMutation]);

  const onSubmitConsultation = (data: ConsultationFormData) => {
    if (editingConsultation) {
      updateConsultationMutation.mutate({ id: editingConsultation.id, ...data });
    } else {
      createConsultationMutation.mutate(data);
    }
  };

  const handleRowClick = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setShowDetailPanel(true);
  };

  const handleStatusUpdate = (status: string) => {
    if (selectedConsultation) {
      updateStatusMutation.mutate({ id: selectedConsultation.id, status, consultation: selectedConsultation });
    }
  };

  const formatDetailDateTime = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">상담 관리</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">상담 내역 관리 시스템</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{formatMonth(currentDate)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 md:space-y-6 px-3 md:px-6">
        {/* Search */}
        <div className="flex items-center justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="이름 및 연락처로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400"
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
        </div>

        {/* Table */}
        <Card className="border-0 shadow-lg">
          <CardAccentLine />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="w-16 text-center font-semibold hidden md:table-cell">순번</TableHead>
                  <TableHead className="font-semibold">고객명</TableHead>
                  <TableHead className="font-semibold">연락처</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">상담일</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">상담자</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">상담 유형</TableHead>
                  <TableHead className="font-semibold">상태</TableHead>
                  <TableHead className="font-semibold text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center hidden md:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse mx-auto"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredConsultations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center space-y-4">
                        <MessageSquare className="w-12 h-12 text-gray-400" />
                        <p className="text-lg font-medium">등록된 상담이 없습니다</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedConsultations.map((consultation, index) => (
                    <TableRow
                      key={consultation.id}
                      className="hover-elevate cursor-pointer transition-all duration-200"
                      data-testid={`row-consultation-${consultation.id}`}
                      onClick={() => handleRowClick(consultation)}
                    >
                      <TableCell className="text-center text-sm text-gray-600 hidden md:table-cell">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{consultation.customerName}</div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{formatPhoneNumber(consultation.phone)}</TableCell>
                      <TableCell className="text-gray-700 hidden md:table-cell">
                        {formatDate(consultation.consultationDate)}
                      </TableCell>
                      <TableCell className="text-blue-600 hidden lg:table-cell">
                        {getCounselorName(consultation.counselorId)}
                      </TableCell>
                      <TableCell className="text-gray-700 hidden lg:table-cell">{consultation.consultationType}</TableCell>
                      <TableCell>
                        {getStatusBadge(consultation.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover-elevate"
                            onClick={(e) => { e.stopPropagation(); handleEditConsultation(consultation); }}
                            data-testid={`btn-edit-consultation-${consultation.id}`}
                          >
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover-elevate"
                            onClick={(e) => { e.stopPropagation(); handleDeleteConsultation(consultation); }}
                            data-testid={`btn-delete-consultation-${consultation.id}`}
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
            {filteredConsultations.length > itemsPerPage && (
              <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  전체 {filteredConsultations.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredConsultations.length)}개 표시
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
        <div className="flex justify-end space-x-3">
          <Button
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover-elevate text-white shadow-lg"
            onClick={handleAddConsultation}
            data-testid="btn-add-consultation"
          >
            <Plus className="w-4 h-4 mr-2" />
            상담 등록
          </Button>
        </div>
      </div>

      {/* Add/Edit Consultation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setIsCustomConsultationType(false);
          setCustomConsultationType("");
        }
      }}>
        <DialogContent className="max-w-[95vw] md:max-w-[500px] max-h-[90vh] overflow-y-auto" aria-describedby="consultation-dialog-description">
          <DialogHeader>
            <DialogTitle>{editingConsultation ? "상담 수정" : "상담 등록"}</DialogTitle>
            <DialogDescription id="consultation-dialog-description" className="sr-only">
              {editingConsultation ? "기존 상담 정보를 수정합니다." : "새로운 상담을 등록합니다."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitConsultation)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>고객명 *</FormLabel>
                      <FormControl>
                        <Input placeholder="고객명 입력" {...field} />
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
                      <FormLabel>연락처 *</FormLabel>
                      <FormControl>
                        <Input placeholder="010-0000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="consultationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상담일 *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consultationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상담시간 *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="counselorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상담자</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상담자 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffList.filter((staff) => staff.id != null).map((staff) => (
                          <SelectItem key={staff.id} value={String(staff.id)}>
                            {staff.name} ({staff.position || '직원'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="consultationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상담 유형 *</FormLabel>
                      {isCustomConsultationType ? (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="상담 유형 직접 입력"
                              value={customConsultationType}
                              onChange={(e) => {
                                setCustomConsultationType(e.target.value);
                                field.onChange(e.target.value);
                              }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setIsCustomConsultationType(false);
                              setCustomConsultationType("");
                              field.onChange("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Select 
                          onValueChange={(value) => {
                            if (value === "__custom__") {
                              setIsCustomConsultationType(true);
                              setCustomConsultationType("");
                            } else {
                              field.onChange(value);
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="상담 유형 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="회원가입">회원가입</SelectItem>
                            <SelectItem value="PT상담">PT상담</SelectItem>
                            <SelectItem value="시설문의">시설문의</SelectItem>
                            <SelectItem value="프로그램문의">프로그램문의</SelectItem>
                            <SelectItem value="기타">기타</SelectItem>
                            <SelectItem value="__custom__">직접 입력</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상담 방법</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="상담 방법 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="전화">전화</SelectItem>
                          <SelectItem value="방문">방문</SelectItem>
                          <SelectItem value="온라인">온라인</SelectItem>
                          <SelectItem value="카카오톡">카카오톡</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상태 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">대기</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="cancelled">취소</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea 
                        placeholder="상담 내용 및 메모를 입력하세요"
                        className="resize-none"
                        rows={3}
                        {...field}
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
                  onClick={() => setShowAddDialog(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover-elevate text-white"
                  disabled={createConsultationMutation.isPending || updateConsultationMutation.isPending}
                >
                  {createConsultationMutation.isPending || updateConsultationMutation.isPending 
                    ? "처리 중..." 
                    : editingConsultation ? "수정" : "상담 등록"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedConsultationForDelete(null);
        }}
        onConfirm={confirmDelete}
        title="상담 삭제"
        description="이 상담 내역을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        itemName={selectedConsultationForDelete?.customerName}
      />

      {/* Consultation Detail Slide Panel with Animation */}
      <AnimatePresence>
        {showDetailPanel && selectedConsultation && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => {
                setShowDetailPanel(false);
                setSelectedConsultation(null);
              }}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">상담 상세 정보</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setShowDetailPanel(false);
                    setSelectedConsultation(null);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">고객명</span>
                    <span className="font-medium text-gray-900">{selectedConsultation.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">연락처</span>
                    <span className="font-medium text-gray-900">{formatPhoneNumber(selectedConsultation.phone)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">상담일시</span>
                    <span className="font-medium text-gray-900">{formatDetailDateTime(selectedConsultation.consultationDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">상담자</span>
                    <span className="font-medium text-blue-600">{getCounselorName(selectedConsultation.counselorId)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">상담 유형</span>
                    <span className="font-medium text-gray-900">{selectedConsultation.consultationType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">상담 방법</span>
                    <span className="font-medium text-gray-900">{selectedConsultation.method || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">현재 상태</span>
                    {getStatusBadge(selectedConsultation.status)}
                  </div>
                </div>

                {selectedConsultation.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-500 block mb-2">메모</span>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedConsultation.notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">상태 변경</p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={updateStatusMutation.isPending || selectedConsultation.status === 'completed'}
                  >
                    완료
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updateStatusMutation.isPending || selectedConsultation.status === 'cancelled'}
                  >
                    취소
                  </Button>
                </div>
                {updateStatusMutation.isPending && (
                  <p className="text-sm text-center text-gray-500">처리 중...</p>
                )}
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
