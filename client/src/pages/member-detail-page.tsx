import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Edit, Phone, CreditCard, Plus, Download, Calendar, User, ShoppingCart, Lock, Dumbbell, PackagePlus, Users, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Member, Product, Locker, Staff } from "@shared/schema";
import { CreateProductDialog } from "@/components/CreateProductDialog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { formatPhoneNumber } from "@/utils/input-sanitizer";

interface MemberDetailPageProps {
  memberId: number;
  onBack: () => void;
  onContractCreate?: () => void;
}

export default function MemberDetailPage({ memberId, onBack, onContractCreate }: MemberDetailPageProps) {
  const [activeTab, setActiveTab] = useState("회원권");
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Member>>({});
  const { toast } = useToast();

  // 회원 정보 수정 mutation (Member update mutation)
  const updateMemberMutation = useMutation({
    mutationFn: async (data: Partial<Member>) => {
      const res = await apiRequest("PUT", `/api/members/${memberId}`, data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "회원 정보 수정에 실패했습니다" }));
        throw new Error(errorData.error || "회원 정보 수정에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members", memberId] });
      toast({
        title: "회원 정보 수정 완료",
        description: "회원 정보가 성공적으로 수정되었습니다.",
      });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "회원 정보 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 수정 다이얼로그 열기 (Open edit dialog)
  const handleOpenEditDialog = () => {
    if (member) {
      setEditFormData({
        name: member.name,
        phone: member.phone,
        email: member.email || "",
        gender: member.gender || "",
        birthDate: member.birthDate || "",
        address: member.address || "",
        emergencyContact: member.emergencyContact || "",
        occupation: member.occupation || "",
        notes: member.notes || "",
        status: member.status,
      });
      setShowEditDialog(true);
    }
  };

  // 수정 폼 제출 (Submit edit form)
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMemberMutation.mutate(editFormData);
  };

  const { data: member, isLoading } = useQuery<Member>({
    queryKey: ["/api/members", memberId],
    queryFn: () => fetch(`/api/members/${memberId}`).then(res => res.json())
  });

  // 데이터 쿼리들 (Data Queries)
  const { data: memberships = [], isError: membershipsError } = useQuery({
    queryKey: ["/api/memberships", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/memberships?memberId=${memberId}`);
      if (!res.ok) {
        console.warn('Failed to fetch memberships:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: personalTrainings = [], isError: personalTrainingError } = useQuery({
    queryKey: ["/api/personal-training", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/personal-training?memberId=${memberId}`);
      if (!res.ok) {
        console.warn('Failed to fetch personal training:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: groupLessonEnrollments = [], isError: groupLessonEnrollmentsError } = useQuery({
    queryKey: ["/api/group-lesson-enrollments", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/group-lesson-enrollments?memberId=${memberId}`);
      if (!res.ok) {
        console.warn('Failed to fetch group lesson enrollments:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: memberLockers = [], isError: memberLockersError } = useQuery({
    queryKey: ["/api/member-lockers", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/member-lockers?memberId=${memberId}`);
      if (!res.ok) {
        console.warn('Failed to fetch member lockers:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: memberEquipment = [], isError: memberEquipmentError } = useQuery({
    queryKey: ["/api/member-equipment", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/member-equipment?memberId=${memberId}`);
      if (!res.ok) {
        console.warn('Failed to fetch member equipment:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: payments = [], isError: paymentsError } = useQuery({
    queryKey: ["/api/payments", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/payments?memberId=${memberId}`);
      if (!res.ok) {
        console.warn('Failed to fetch payments:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: lockers = [] } = useQuery<Locker[]>({
    queryKey: ["/api/lockers"],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: groupLessons = [] } = useQuery<any[]>({
    queryKey: ["/api/group-lessons"],
  });

  // 뮤테이션들 (Mutations)
  const createMembershipMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/memberships", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "회원권 등록에 실패했습니다" }));
        throw new Error(errorData.error || "회원권 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      toast({
        title: "회원권 등록 완료",
        description: "회원권이 성공적으로 등록되었습니다.",
        action: onContractCreate ? (
          <ToastAction altText="계약서 생성" onClick={onContractCreate}>
            계약서 생성
          </ToastAction>
        ) : undefined,
      });
      setShowRegistrationDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "회원권 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPersonalTrainingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/personal-training", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "개인 레슨 등록에 실패했습니다" }));
        throw new Error(errorData.error || "개인 레슨 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-training", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      toast({
        title: "개인 레슨 등록 완료",
        description: "개인 레슨이 성공적으로 등록되었습니다.",
        action: onContractCreate ? (
          <ToastAction altText="계약서 생성" onClick={onContractCreate}>
            계약서 생성
          </ToastAction>
        ) : undefined,
      });
      setShowRegistrationDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "개인 레슨 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMemberLockerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/member-lockers", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "락커 등록에 실패했습니다" }));
        throw new Error(errorData.error || "락커 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-lockers", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      toast({
        title: "락커 상품 등록 완료",
        description: "락커 상품이 성공적으로 등록되었습니다.",
      });
      setShowRegistrationDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "락커 상품 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMemberEquipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/member-equipment", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "운동 용품 등록에 실패했습니다" }));
        throw new Error(errorData.error || "운동 용품 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-equipment", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      toast({
        title: "운동 용품 등록 완료",
        description: "운동 용품이 성공적으로 등록되었습니다.",
      });
      setShowRegistrationDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "운동 용품 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 환불/삭제 뮤테이션들 (Refund/Delete Mutations)
  const refundMembershipMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/memberships/${id}/refund`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "환불 처리에 실패했습니다" }));
        throw new Error(errorData.error || "환불 처리에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/refunds"] });
      toast({ title: "환불 요청 완료", description: "회원권 환불이 요청되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "환불 실패", description: error.message, variant: "destructive" });
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/memberships/${id}`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "삭제에 실패했습니다" }));
        throw new Error(errorData.error || "삭제에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships", memberId] });
      toast({ title: "삭제 완료", description: "회원권이 삭제되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
    },
  });

  const refundPersonalTrainingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/personal-training/${id}/refund`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "환불 처리에 실패했습니다" }));
        throw new Error(errorData.error || "환불 처리에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-training", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/refunds"] });
      toast({ title: "환불 요청 완료", description: "수업 상품 환불이 요청되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "환불 실패", description: error.message, variant: "destructive" });
    },
  });

  const deletePersonalTrainingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/personal-training/${id}`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "삭제에 실패했습니다" }));
        throw new Error(errorData.error || "삭제에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-training", memberId] });
      toast({ title: "삭제 완료", description: "수업 상품이 삭제되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: async ({ id, remainingSessions, usedSessions }: { id: number; remainingSessions: number; usedSessions: number }) => {
      const res = await apiRequest("PATCH", `/api/personal-training/${id}`, {
        remainingSessions,
        usedSessions,
        lastSessionDate: new Date().toISOString(),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "세션 완료 처리에 실패했습니다" }));
        throw new Error(errorData.error || "세션 완료 처리에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-training", memberId] });
      toast({ title: "세션 완료", description: "PT 세션 1회가 완료 처리되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "처리 실패", description: error.message, variant: "destructive" });
    },
  });

  const refundMemberLockerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/member-lockers/${id}/refund`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "환불 처리에 실패했습니다" }));
        throw new Error(errorData.error || "환불 처리에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-lockers", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/refunds"] });
      toast({ title: "환불 요청 완료", description: "락커 상품 환불이 요청되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "환불 실패", description: error.message, variant: "destructive" });
    },
  });

  const deleteMemberLockerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/member-lockers/${id}`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "삭제에 실패했습니다" }));
        throw new Error(errorData.error || "삭제에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-lockers", memberId] });
      toast({ title: "삭제 완료", description: "락커 상품이 삭제되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
    },
  });

  const refundMemberEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/member-equipment/${id}/refund`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "환불 처리에 실패했습니다" }));
        throw new Error(errorData.error || "환불 처리에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-equipment", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/refunds"] });
      toast({ title: "환불 요청 완료", description: "운동 용품 환불이 요청되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "환불 실패", description: error.message, variant: "destructive" });
    },
  });

  const deleteMemberEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/member-equipment/${id}`, {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "삭제에 실패했습니다" }));
        throw new Error(errorData.error || "삭제에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-equipment", memberId] });
      toast({ title: "삭제 완료", description: "운동 용품이 삭제되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
    },
  });

  // 내보내기 함수 (Export Functions)
  const exportMemberHistory = () => {
    // 🛡️ 안전한 배열 변환 (Safe array conversion)
    const safeMemberships = Array.isArray(memberships) ? memberships : [];
    const safePersonalTrainings = Array.isArray(personalTrainings) ? personalTrainings : [];
    const safeMemberLockers = Array.isArray(memberLockers) ? memberLockers : [];
    const safeMemberEquipment = Array.isArray(memberEquipment) ? memberEquipment : [];
    const safePayments = Array.isArray(payments) ? payments : [];

    const memberData = {
      기본정보: {
        이름: member?.name || "",
        연락처: member?.phone || "",
        성별: member?.gender || "",
        등록일: member?.createdAt ? new Date(member.createdAt).toLocaleDateString() : "",
        상태: member?.status || "",
        가입경로: member?.joinSource || "",
      },
      회원권: safeMemberships.map((membership: any) => ({
        종류: membership.type,
        시작일: new Date(membership.startDate).toLocaleDateString(),
        종료일: new Date(membership.endDate).toLocaleDateString(),
        가격: membership.price.toLocaleString() + "원",
        상태: membership.status,
      })),
      개인레슨: safePersonalTrainings.map((pt: any) => ({
        총차수: pt.totalSessions,
        잔여차수: pt.remainingSessions,
        구매일: new Date(pt.purchaseDate).toLocaleDateString(),
        만료일: pt.expiryDate ? new Date(pt.expiryDate).toLocaleDateString() : "",
        상태: pt.status,
      })),
      락커: safeMemberLockers.map((locker: any) => ({
        락커ID: locker.lockerId,
        시작일: new Date(locker.startDate).toLocaleDateString(),
        종료일: new Date(locker.endDate).toLocaleDateString(),
        월사용료: locker.monthlyFee ? locker.monthlyFee.toLocaleString() + "원" : "-",
        상태: locker.status,
      })),
      운동용품: safeMemberEquipment.map((equipment: any) => ({
        용품명: equipment.equipmentName || "-",
        용품유형: equipment.equipmentType || "-",
        대여일: equipment.rentalDate ? new Date(equipment.rentalDate).toLocaleDateString() : "-",
        반납일: equipment.returnDate ? new Date(equipment.returnDate).toLocaleDateString() : "-",
        상태: equipment.status,
      })),
      결제내역: safePayments.map((payment: any) => ({
        결제일: new Date(payment.paymentDate).toLocaleDateString(),
        금액: payment.amount.toLocaleString() + "원",
        결제방법: payment.paymentMethod,
        상태: payment.status,
        내용: payment.description,
      })),
    };

    const wb = XLSX.utils.book_new();
    
    // 각 탭별로 시트 생성
    Object.entries(memberData).forEach(([sheetName, data]) => {
      const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${member?.name || '회원'}_내역_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "내보내기 완료",
      description: "회원 내역이 Excel 파일로 다운로드되었습니다.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">회원 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  // 나이대 계산 함수
  const getAgeGroup = (birthDate: string | Date | null) => {
    if (!birthDate) return '미설정';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return `${Math.floor((age - 1) / 10) * 10}대`;
    }
    
    return `${Math.floor(age / 10) * 10}대`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">회원 정보</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Member Profile Card */}
        <Card className="mb-6">
          <CardAccentLine />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              {/* Member Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{member.name || '회원'}</h2>
                  <Badge 
                    variant={member.status === '활성 회원' ? 'default' : 'secondary'}
                    className="font-medium"
                  >
                    {member.status || '상태 미설정'}
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">{formatPhoneNumber(member.phone)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">등록일</p>
                    <p className="font-medium">{formatDate(member.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">성별</p>
                    <p className="font-medium">{member.gender || '미설정'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">상태</p>
                    <p className="font-medium">{member.status || '상태 미설정'}</p>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p>가입일: {formatDate(member.createdAt)}</p>
                  {member.joinSource && (
                    <p>가입 경로: {member.joinSource}</p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={handleOpenEditDialog}
                  data-testid="button-edit-member"
                >
                  <Edit className="w-4 h-4" />
                  수정
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['회원권', '수업 상품', '락커 상품', '운동 용품'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* 회원권 탭 (Membership Tab) */}
          {activeTab === '회원권' && (
            <Card>
              <CardContent className="p-6">
                {!Array.isArray(memberships) || memberships.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4">등록된 회원권이 없습니다.</p>
                    <p className="text-gray-400 text-xs">회원권을 등록해 주세요.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">회원권 종류</th>
                          <th className="text-left p-3 font-medium">시작일</th>
                          <th className="text-left p-3 font-medium">종료일</th>
                          <th className="text-left p-3 font-medium">총 횟수</th>
                          <th className="text-left p-3 font-medium">사용 횟수</th>
                          <th className="text-left p-3 font-medium">잔여 횟수</th>
                          <th className="text-left p-3 font-medium">가격</th>
                          <th className="text-left p-3 font-medium">상태</th>
                          <th className="text-left p-3 font-medium">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberships.map((membership: any) => (
                          <tr key={membership.id} className="border-b">
                            <td className="p-3">{membership.type}</td>
                            <td className="p-3">{new Date(membership.startDate).toLocaleDateString()}</td>
                            <td className="p-3">{new Date(membership.endDate).toLocaleDateString()}</td>
                            <td className="p-3">{membership.totalSessions || '-'}</td>
                            <td className="p-3">{membership.usedSessions || 0}</td>
                            <td className="p-3">{membership.totalSessions ? membership.totalSessions - (membership.usedSessions || 0) : '-'}</td>
                            <td className="p-3 tabular-nums">{membership.price.toLocaleString()}원</td>
                            <td className="p-3">
                              <Badge variant={membership.status === '활성' ? 'default' : membership.status === '환불' ? 'destructive' : 'secondary'}>
                                {membership.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {membership.status !== '환불' && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-600 border-orange-200 hover-elevate h-7 px-2 text-xs"
                                    onClick={() => refundMembershipMutation.mutate(membership.id)}
                                    disabled={refundMembershipMutation.isPending}
                                  >
                                    환불
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 h-7 px-2 text-xs hover-elevate"
                                    onClick={() => deleteMembershipMutation.mutate(membership.id)}
                                    disabled={deleteMembershipMutation.isPending}
                                  >
                                    삭제
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 수업 상품 탭 (Class Products Tab - Personal Training + Group Lessons) */}
          {activeTab === '수업 상품' && (
            <Card>
              <CardContent className="p-6">
                {((!Array.isArray(personalTrainings) || personalTrainings.length === 0) && 
                  (!Array.isArray(groupLessonEnrollments) || groupLessonEnrollments.length === 0)) ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4">등록된 수업 상품이 없습니다.</p>
                    <p className="text-gray-400 text-xs">개인 레슨 또는 그룹 수업을 등록해 주세요.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">수업 유형</th>
                          <th className="text-left p-3 font-medium">수업명</th>
                          <th className="text-left p-3 font-medium">담당 강사</th>
                          <th className="text-left p-3 font-medium">총 차수</th>
                          <th className="text-left p-3 font-medium">잔여 차수</th>
                          <th className="text-left p-3 font-medium">사용 차수</th>
                          <th className="text-left p-3 font-medium">구매일</th>
                          <th className="text-left p-3 font-medium">유효기간</th>
                          <th className="text-left p-3 font-medium">상태</th>
                          <th className="text-left p-3 font-medium">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 개인 레슨 목록 (Personal Training list) */}
                        {personalTrainings.map((pt: any) => {
                          const product = products.find((p: Product) => p.id === pt.productId);
                          return (
                          <tr key={`pt-${pt.id}`} className="border-b">
                            <td className="p-3">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                개인
                              </Badge>
                            </td>
                            <td className="p-3">{product?.name || '-'}</td>
                            <td className="p-3">{pt.instructorName || '미지정'}</td>
                            <td className="p-3">{pt.totalSessions !== null && pt.totalSessions !== undefined && pt.totalSessions > 0 ? pt.totalSessions : '무제한'}</td>
                            <td className="p-3">{pt.totalSessions !== null && pt.totalSessions !== undefined && pt.totalSessions > 0 ? pt.remainingSessions : '무제한'}</td>
                            <td className="p-3">{pt.usedSessions}</td>
                            <td className="p-3">{new Date(pt.purchaseDate).toLocaleDateString()}</td>
                            <td className="p-3">{pt.expiryDate ? new Date(pt.expiryDate).toLocaleDateString() : '무제한'}</td>
                            <td className="p-3">
                              <Badge variant={pt.status === '활성' ? 'default' : pt.status === '환불' ? 'destructive' : 'secondary'}>
                                {pt.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {pt.status !== '환불' && (
                                <div className="flex gap-1 flex-wrap">
                                  {pt.status === '활성' && pt.totalSessions > 0 && pt.remainingSessions > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-emerald-600 border-emerald-200 h-7 px-2 text-xs hover-elevate"
                                      onClick={() => completeSessionMutation.mutate({
                                        id: pt.id,
                                        remainingSessions: pt.remainingSessions - 1,
                                        usedSessions: (pt.usedSessions || 0) + 1,
                                      })}
                                      disabled={completeSessionMutation.isPending}
                                    >
                                      세션완료
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-600 border-orange-200 h-7 px-2 text-xs hover-elevate"
                                    onClick={() => refundPersonalTrainingMutation.mutate(pt.id)}
                                    disabled={refundPersonalTrainingMutation.isPending}
                                  >
                                    환불
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 h-7 px-2 text-xs hover-elevate"
                                    onClick={() => deletePersonalTrainingMutation.mutate(pt.id)}
                                    disabled={deletePersonalTrainingMutation.isPending}
                                  >
                                    삭제
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )})}
                        {/* 그룹 수업 등록 목록 (Group Lesson Enrollments list) */}
                        {groupLessonEnrollments.map((enrollment: any) => {
                          const groupLesson = groupLessons.find((gl: any) => gl.id === enrollment.groupLessonId);
                          const instructor = groupLesson?.instructorId ? staff.find((s: any) => s.id === groupLesson.instructorId) : null;
                          return (
                          <tr key={`gle-${enrollment.id}`} className="border-b">
                            <td className="p-3">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                그룹
                              </Badge>
                            </td>
                            <td className="p-3">{groupLesson?.name || '-'}</td>
                            <td className="p-3">{instructor?.name || '미지정'}</td>
                            <td className="p-3">-</td>
                            <td className="p-3">-</td>
                            <td className="p-3">-</td>
                            <td className="p-3">{enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : '-'}</td>
                            <td className="p-3">-</td>
                            <td className="p-3">
                              <Badge variant={enrollment.status === '활성' ? 'default' : enrollment.status === '취소' ? 'destructive' : 'secondary'}>
                                {enrollment.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="text-gray-400 text-xs">
                                {enrollment.price ? `${enrollment.price.toLocaleString()}원` : '-'}
                              </span>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 락커 상품 탭 (Locker Products Tab) */}
          {activeTab === '락커 상품' && (
            <Card>
              <CardContent className="p-6">
                {!Array.isArray(memberLockers) || memberLockers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4">등록된 락커 상품이 없습니다.</p>
                    <p className="text-gray-400 text-xs">락커 상품을 등록해 주세요.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">락커 ID</th>
                          <th className="text-left p-3 font-medium">시작일</th>
                          <th className="text-left p-3 font-medium">종료일</th>
                          <th className="text-left p-3 font-medium">월 사용료</th>
                          <th className="text-left p-3 font-medium">상태</th>
                          <th className="text-left p-3 font-medium">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberLockers.map((locker: any) => (
                          <tr key={locker.id} className="border-b">
                            <td className="p-3">{locker.lockerId}</td>
                            <td className="p-3">{new Date(locker.startDate).toLocaleDateString()}</td>
                            <td className="p-3">{new Date(locker.endDate).toLocaleDateString()}</td>
                            <td className="p-3 tabular-nums">{locker.monthlyFee ? locker.monthlyFee.toLocaleString() + '원' : '-'}</td>
                            <td className="p-3">
                              <Badge variant={locker.status === '사용중' ? 'default' : locker.status === '환불' ? 'destructive' : 'secondary'}>
                                {locker.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {locker.status !== '환불' && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-600 border-orange-200 h-7 px-2 text-xs hover-elevate"
                                    onClick={() => refundMemberLockerMutation.mutate(locker.id)}
                                    disabled={refundMemberLockerMutation.isPending}
                                  >
                                    환불
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 h-7 px-2 text-xs hover-elevate"
                                    onClick={() => deleteMemberLockerMutation.mutate(locker.id)}
                                    disabled={deleteMemberLockerMutation.isPending}
                                  >
                                    삭제
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 운동 용품 탭 (Equipment Tab) */}
          {activeTab === '운동 용품' && (
            <Card>
              <CardContent className="p-6">
                {!Array.isArray(memberEquipment) || memberEquipment.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Dumbbell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm mb-4">등록된 운동 용품이 없습니다.</p>
                    <p className="text-gray-400 text-xs">운동 용품을 등록해 주세요.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">용품명</th>
                          <th className="text-left p-3 font-medium">용품 유형</th>
                          <th className="text-left p-3 font-medium">대여일</th>
                          <th className="text-left p-3 font-medium">반납일</th>
                          <th className="text-left p-3 font-medium">상태</th>
                          <th className="text-left p-3 font-medium">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberEquipment.map((equipment: any) => (
                          <tr key={equipment.id} className="border-b">
                            <td className="p-3">{equipment.equipmentName || '-'}</td>
                            <td className="p-3">{equipment.equipmentType || '-'}</td>
                            <td className="p-3">{equipment.rentalDate ? new Date(equipment.rentalDate).toLocaleDateString() : '-'}</td>
                            <td className="p-3">{equipment.returnDate ? new Date(equipment.returnDate).toLocaleDateString() : '-'}</td>
                            <td className="p-3">
                              <Badge variant={equipment.status === '대여중' ? 'default' : equipment.status === '환불' ? 'destructive' : 'secondary'}>
                                {equipment.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {equipment.status !== '환불' && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-600 border-orange-200 h-7 px-2 text-xs hover-elevate"
                                    onClick={() => refundMemberEquipmentMutation.mutate(equipment.id)}
                                    disabled={refundMemberEquipmentMutation.isPending}
                                  >
                                    환불
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 h-7 px-2 text-xs hover-elevate"
                                    onClick={() => deleteMemberEquipmentMutation.mutate(equipment.id)}
                                    disabled={deleteMemberEquipmentMutation.isPending}
                                  >
                                    삭제
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">결제 정보</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={exportMemberHistory}>
                  <Download className="w-4 h-4 mr-2" />
                  내역 내보내기
                </Button>
                <Button size="sm" className="bg-blue-600 hover-elevate" onClick={() => setShowRegistrationDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === '회원권' && '회원권 등록'}
                  {activeTab === '수업 상품' && '수업 상품 등록'}
                  {activeTab === '락커 상품' && '락커 상품 등록'}
                  {activeTab === '운동 용품' && '운동 용품 등록'}
                </Button>
              </div>
            </div>

            {/* Payment Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-gray-700">결제일시</th>
                        <th className="text-left p-4 font-medium text-gray-700">서비스 이용권</th>
                        <th className="text-left p-4 font-medium text-gray-700">이용 형태</th>
                        <th className="text-left p-4 font-medium text-gray-700">결제 금액</th>
                        <th className="text-left p-4 font-medium text-gray-700">결제 상태</th>
                        <th className="text-left p-4 font-medium text-gray-700">결제 수단</th>
                        <th className="text-left p-4 font-medium text-gray-700">메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <CreditCard className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm mb-2">
                              아직 결제된 {activeTab}이 없습니다.
                            </p>
                            <Button size="sm" className="bg-blue-600 hover-elevate" onClick={() => setShowRegistrationDialog(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              {activeTab === '회원권' && '회원권 등록'}
                              {activeTab === '수업 상품' && '수업 상품 등록'}
                              {activeTab === '락커 상품' && '락커 상품 등록'}
                              {activeTab === '운동 용품' && '운동 용품 등록'}
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment: any) => (
                          <tr key={payment.id} className="border-b">
                            <td className="p-4">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                            <td className="p-4">{payment.description || activeTab}</td>
                            <td className="p-4">{activeTab}</td>
                            <td className="p-4 tabular-nums">{payment.amount.toLocaleString()}원</td>
                            <td className="p-4">
                              <Badge variant={payment.status === '완료' ? 'default' : 'secondary'}>
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="p-4">{payment.paymentMethod}</td>
                            <td className="p-4">{payment.description || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 등록 다이얼로그 (Registration Dialog) */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="registration-dialog-description">
          <DialogHeader>
            <DialogTitle>
              {activeTab === '회원권' && '회원권 등록'}
              {activeTab === '수업 상품' && '수업 상품 등록'}
              {activeTab === '락커 상품' && '락커 상품 등록'}
              {activeTab === '운동 용품' && '운동 용품 등록'}
            </DialogTitle>
            <DialogDescription id="registration-dialog-description" className="sr-only">
              {activeTab === '회원권' && '회원에게 새로운 회원권을 등록합니다.'}
              {activeTab === '수업 상품' && '회원에게 수업 상품을 등록합니다.'}
              {activeTab === '락커 상품' && '회원에게 락커 상품을 등록합니다.'}
              {activeTab === '운동 용품' && '회원에게 운동 용품을 등록합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RegistrationForm activeTab={activeTab} memberId={memberId} onSuccess={() => setShowRegistrationDialog(false)} onContractCreate={onContractCreate} />
          </div>
        </DialogContent>
      </Dialog>

      {/* 회원 정보 수정 다이얼로그 (Member Edit Dialog) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원 정보 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">이름 *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  data-testid="input-edit-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">연락처 *</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  data-testid="input-edit-phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">이메일</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-edit-email"
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">성별</Label>
                <Select 
                  value={editFormData.gender || ""} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger data-testid="select-edit-gender">
                    <SelectValue placeholder="성별 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="남">남</SelectItem>
                    <SelectItem value="여">여</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-birthDate">생년월일</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  value={editFormData.birthDate || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  data-testid="input-edit-birthdate"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">상태</Label>
                <Select 
                  value={editFormData.status || ""} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="활성">활성</SelectItem>
                    <SelectItem value="휴면">휴면</SelectItem>
                    <SelectItem value="정지">정지</SelectItem>
                    <SelectItem value="만료">만료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">주소</Label>
              <Input
                id="edit-address"
                value={editFormData.address || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                data-testid="input-edit-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-emergencyContact">비상연락처</Label>
                <Input
                  id="edit-emergencyContact"
                  value={editFormData.emergencyContact || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  data-testid="input-edit-emergency"
                />
              </div>
              <div>
                <Label htmlFor="edit-occupation">직업</Label>
                <Input
                  id="edit-occupation"
                  value={editFormData.occupation || ""}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, occupation: e.target.value }))}
                  data-testid="input-edit-occupation"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">메모</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                data-testid="textarea-edit-notes"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                data-testid="button-edit-cancel"
              >
                취소
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-500 hover-elevate"
                disabled={updateMemberMutation.isPending}
                data-testid="button-edit-submit"
              >
                {updateMemberMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 등록 폼 컴포넌트 (Registration Form Component)
function RegistrationForm({ activeTab, memberId, onSuccess, onContractCreate }: { activeTab: string; memberId: number; onSuccess: () => void; onContractCreate?: () => void }) {
  const [formData, setFormData] = useState<any>({});
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false);
  const [createProductCategory, setCreateProductCategory] = useState<"회원권" | "PT" | "그룹수업" | "락커 상품" | "운동 용품" | "기타">("회원권");
  const { toast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: lockers = [] } = useQuery<Locker[]>({
    queryKey: ["/api/lockers"],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: groupLessons = [] } = useQuery<any[]>({
    queryKey: ["/api/group-lessons"],
  });

  const createMembershipMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/memberships", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "회원권 등록에 실패했습니다" }));
        throw new Error(errorData.error || "회원권 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      toast({
        title: "회원권 등록 완료",
        description: "회원권이 성공적으로 등록되었습니다.",
        action: onContractCreate ? (
          <ToastAction altText="계약서 생성" onClick={onContractCreate}>
            계약서 생성
          </ToastAction>
        ) : undefined,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "회원권 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPersonalTrainingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/personal-training", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "개인 레슨 등록에 실패했습니다" }));
        throw new Error(errorData.error || "개인 레슨 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-training", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      toast({
        title: "개인 레슨 등록 완료",
        description: "개인 레슨이 성공적으로 등록되었습니다.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "개인 레슨 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createGroupLessonEnrollmentMutation = useMutation({
    mutationFn: async (data: { groupLessonId: number; memberId: number; price: number; paymentMethod: string; productId?: number }) => {
      const res = await apiRequest("POST", `/api/group-lessons/${data.groupLessonId}/enroll`, data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "그룹 수업 등록에 실패했습니다" }));
        throw new Error(errorData.error || "그룹 수업 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/group-lesson-enrollments", memberId] });
      toast({
        title: "그룹 수업 등록 완료",
        description: "그룹 수업이 성공적으로 등록되었습니다.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "그룹 수업 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMemberLockerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/member-lockers", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "락커 상품 등록에 실패했습니다" }));
        throw new Error(errorData.error || "락커 상품 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-lockers", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      toast({
        title: "락커 상품 등록 완료",
        description: "락커 상품이 성공적으로 등록되었습니다.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "락커 상품 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMemberEquipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/member-equipment", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "운동 용품 등록에 실패했습니다" }));
        throw new Error(errorData.error || "운동 용품 등록에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-equipment", memberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", memberId] });
      toast({
        title: "운동 용품 등록 완료",
        description: "운동 용품이 성공적으로 등록되었습니다.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "운동 용품 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataWithMemberId = { ...formData, memberId };

    if (activeTab === '회원권') {
      if (!formData.productId || !formData.type) {
        toast({
          title: "입력 오류",
          description: "회원권 상품을 선택해주세요.",
          variant: "destructive",
        });
        return;
      }
      createMembershipMutation.mutate(dataWithMemberId);
    } else if (activeTab === '수업 상품') {
      if (!formData.lessonType) {
        toast({
          title: "입력 오류",
          description: "수업 유형을 선택해주세요.",
          variant: "destructive",
        });
        return;
      }

      if (formData.lessonType === '개인레슨') {
        if (!formData.ptProductId) {
          toast({
            title: "입력 오류",
            description: "PT 상품을 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        const ptData = {
          ...dataWithMemberId,
          productId: formData.ptProductId,
          remainingSessions: formData.totalSessions,
          purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
          status: "활성",
          scheduledDays: formData.scheduledDays || [],
          preferredStartTime: formData.preferredStartTime || null,
          preferredEndTime: formData.preferredEndTime || null,
        };
        createPersonalTrainingMutation.mutate(ptData);
      } else if (formData.lessonType === '그룹수업') {
        if (!formData.groupLessonId) {
          toast({
            title: "입력 오류",
            description: "그룹 수업을 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        const groupLessonData = {
          groupLessonId: formData.groupLessonId,
          memberId: memberId,
          price: formData.price || 0,
          paymentMethod: formData.paymentMethod || '카드',
          productId: formData.productId || undefined,
        };
        createGroupLessonEnrollmentMutation.mutate(groupLessonData);
      }
    } else if (activeTab === '락커 상품') {
      // 락커 이용권 등록 (lockerId는 락커 페이지에서 배정)
      // Locker registration - lockerId is assigned from locker page
      createMemberLockerMutation.mutate(dataWithMemberId);
    } else if (activeTab === '운동 용품') {
      if (!formData.equipmentName) {
        toast({
          title: "입력 오류",
          description: "용품명을 입력해주세요.",
          variant: "destructive",
        });
        return;
      }
      createMemberEquipmentMutation.mutate(dataWithMemberId);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {activeTab === '회원권' && (
        <>
          <div>
            <Label htmlFor="productId">회원권 상품</Label>
            {products.filter((p: any) => p.category === '회원권').length === 0 ? (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center mt-2">
                <PackagePlus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">등록된 회원권 상품이 없습니다</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreateProductCategory("회원권");
                    setShowCreateProductDialog(true);
                  }}
                  className="text-blue-600 border-blue-300 hover-elevate"
                  data-testid="btn-create-membership-product"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  회원권 상품 등록하기
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Select 
                  value={formData.productId?.toString() || ''} 
                  onValueChange={(value) => {
                    const selectedProduct = products.find((p: any) => p.id === parseInt(value));
                    if (selectedProduct) {
                      handleInputChange('productId', parseInt(value));
                      handleInputChange('type', selectedProduct.name);
                      handleInputChange('price', selectedProduct.price);
                      
                      // 이용 횟수 자동 채우기
                      if (selectedProduct.sessions) {
                        handleInputChange('totalSessions', selectedProduct.sessions);
                      }
                      
                      // 기간 계산 (월/일/회 단위 처리)
                      if (selectedProduct.duration) {
                        const startDate = new Date();
                        const endDate = new Date();
                        const durationType = selectedProduct.durationType || '일';
                        
                        if (durationType === '월') {
                          endDate.setMonth(endDate.getMonth() + selectedProduct.duration);
                        } else if (durationType === '일') {
                          endDate.setDate(endDate.getDate() + selectedProduct.duration);
                        } else {
                          // '회' 또는 기타의 경우 기본 30일 * duration
                          endDate.setDate(endDate.getDate() + (selectedProduct.duration * 30));
                        }
                        
                        handleInputChange('startDate', startDate.toISOString().split('T')[0]);
                        handleInputChange('endDate', endDate.toISOString().split('T')[0]);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="회원권 상품을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p: any) => p.category === '회원권' && p.id != null)
                      .map((product: any) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name} - {product.price?.toLocaleString()}원 ({product.duration}일)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreateProductCategory("회원권");
                    setShowCreateProductDialog(true);
                  }}
                  className="text-xs text-gray-500 hover:text-blue-600"
                  data-testid="btn-add-new-membership-product"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  새 상품 추가
                </Button>
              </div>
            )}
          </div>

          {/* 회원권 상품 선택 시 자동 표시되는 정보 (Auto-filled info from selected membership product) */}
          {formData.productId && formData.type && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-700">선택한 회원권 정보</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">상품명</span>
                  <p className="font-medium">{formData.type || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">가격</span>
                  <p className="font-medium">{formData.price?.toLocaleString() || 0}원</p>
                </div>
                {formData.startDate && formData.endDate && (
                  <div>
                    <span className="text-gray-500">이용 기간</span>
                    <p className="font-medium">{formData.startDate} ~ {formData.endDate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">시작일 *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
                data-testid="input-membership-start-date"
              />
            </div>
            <div>
              <Label htmlFor="endDate">종료일 *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
                data-testid="input-membership-end-date"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="price">가격 (원)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', parseInt(e.target.value))}
              data-testid="input-membership-price"
            />
          </div>
          <div>
            <Label htmlFor="instructorId">담당 강사</Label>
            <Select 
              value={formData.instructorId?.toString() || 'none'} 
              onValueChange={(value) => handleInputChange('instructorId', value === 'none' ? null : parseInt(value))}
            >
              <SelectTrigger data-testid="select-membership-instructor">
                <SelectValue placeholder="담당 강사 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안함</SelectItem>
                {staff
                  .filter((s: Staff) => s.status === '재직')
                  .map((s: Staff) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} - {s.position}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalSessions">총 이용 횟수</Label>
              <Input
                id="totalSessions"
                type="number"
                value={formData.totalSessions || ''}
                onChange={(e) => handleInputChange('totalSessions', parseInt(e.target.value))}
                placeholder="무제한이면 비워두세요"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">결제 수단</Label>
              <Select value={formData.paymentMethod || '카드'} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                <SelectTrigger data-testid="select-membership-payment-method">
                  <SelectValue placeholder="결제 수단 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="카드">카드</SelectItem>
                  <SelectItem value="현금">현금</SelectItem>
                  <SelectItem value="계좌이체">계좌이체</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {activeTab === '수업 상품' && (
        <>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Label className="text-sm font-semibold text-blue-700 mb-3 block">수업 유형 선택 *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('lessonType', '개인레슨')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.lessonType === '개인레슨'
                    ? "border-blue-500 bg-blue-100 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
                }`}
                data-testid="select-lesson-type-personal"
              >
                <Dumbbell className="w-6 h-6" />
                <span className="font-medium">개인 레슨</span>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('lessonType', '그룹수업')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.lessonType === '그룹수업'
                    ? "border-green-500 bg-green-100 text-green-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-green-300"
                }`}
                data-testid="select-lesson-type-group"
              >
                <Users className="w-6 h-6" />
                <span className="font-medium">그룹 수업</span>
              </button>
            </div>
          </div>

          {formData.lessonType === '개인레슨' && (
            <>
              {/* PT 상품 선택 (Select from existing PT products) */}
              <div>
                <Label htmlFor="ptProductId">PT 상품 선택 *</Label>
                {products.filter((p: any) => p.category === 'PT' || p.category === '개인레슨' || (p.category === '수업 상품' && p.lessonType === '개인 레슨')).length === 0 ? (
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center mt-2">
                    <PackagePlus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">등록된 PT 상품이 없습니다</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCreateProductCategory("PT");
                        setShowCreateProductDialog(true);
                      }}
                      className="text-blue-600 border-blue-300 hover-elevate"
                      data-testid="btn-create-pt-product"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      PT 상품 등록하기
                    </Button>
                  </div>
                ) : (
                  <Select 
                    value={formData.ptProductId?.toString() || ''} 
                    onValueChange={(value) => {
                      const productId = Number(value);
                      const selectedProduct = products.find((p: any) => Number(p.id) === productId);
                      if (selectedProduct) {
                        handleInputChange('ptProductId', productId);
                        handleInputChange('price', Number(selectedProduct.price) || 0);
                        handleInputChange('totalSessions', Number(selectedProduct.sessions) || 10);
                        handleInputChange('instructorId', selectedProduct.instructorId ? Number(selectedProduct.instructorId) : null);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-pt-product">
                      <SelectValue placeholder="PT 상품을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.filter((p: any) => (p.category === 'PT' || p.category === '개인레슨' || (p.category === '수업 상품' && p.lessonType === '개인 레슨')) && p.id != null).map((product: any) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name} - {product.sessions || 0}회 ({(product.price || 0).toLocaleString()}원)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* PT 상품 선택 시 자동 표시되는 정보 (Auto-filled info from selected PT product) */}
              {formData.ptProductId && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-700">선택한 PT 상품 정보</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">총 차수</span>
                      <p className="font-medium">{formData.totalSessions || 0}회</p>
                    </div>
                    <div>
                      <span className="text-gray-500">가격</span>
                      <p className="font-medium">{formData.price?.toLocaleString() || 0}원</p>
                    </div>
                    <div>
                      <span className="text-gray-500">담당 강사</span>
                      <p className="font-medium">
                        {(() => {
                          const instructor = staff.find((s: any) => Number(s.id) === Number(formData.instructorId));
                          return instructor ? (instructor.status === '퇴사' ? '-' : instructor.name) : '미지정';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchaseDate">구매일 *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    required
                    data-testid="input-purchase-date"
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">만료일</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate || ''}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    data-testid="input-expiry-date"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="paymentMethod">결제 방법</Label>
                <Select value={formData.paymentMethod || '카드'} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="결제 방법 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="카드">카드</SelectItem>
                    <SelectItem value="현금">현금</SelectItem>
                    <SelectItem value="계좌이체">계좌이체</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 수업 주기 설정 (Schedule Days Selection) */}
              <div className="space-y-3">
                <Label>수업 요일 선택</Label>
                <div className="flex flex-wrap gap-2">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day) => {
                    const selectedDays = formData.scheduledDays || [];
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? selectedDays.filter((d: string) => d !== day)
                            : [...selectedDays, day];
                          handleInputChange('scheduledDays', newDays);
                        }}
                        className={`px-3 py-2 rounded-md border text-sm font-medium hover-elevate ${
 isSelected
 ? 'bg-blue-500 text-white border-blue-500'
 : 'bg-white text-gray-700 border-gray-300'
 }`}
                        data-testid={`btn-day-${day}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {formData.scheduledDays && formData.scheduledDays.length > 0 && (
                  <p className="text-sm text-blue-600">선택된 요일: {formData.scheduledDays.join(', ')}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredStartTime">선호 시작 시간</Label>
                  <Input
                    id="preferredStartTime"
                    type="time"
                    value={formData.preferredStartTime || ''}
                    onChange={(e) => handleInputChange('preferredStartTime', e.target.value)}
                    data-testid="input-preferred-start-time"
                  />
                </div>
                <div>
                  <Label htmlFor="preferredEndTime">선호 종료 시간</Label>
                  <Input
                    id="preferredEndTime"
                    type="time"
                    value={formData.preferredEndTime || ''}
                    onChange={(e) => handleInputChange('preferredEndTime', e.target.value)}
                    data-testid="input-preferred-end-time"
                  />
                </div>
              </div>
            </>
          )}

          {formData.lessonType === '그룹수업' && (
            <>
              <div>
                <Label htmlFor="groupLessonId">그룹 수업 선택 *</Label>
                {groupLessons.length === 0 ? (
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center mt-2">
                    <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">등록된 그룹 수업이 없습니다</p>
                    <p className="text-xs text-gray-500">그룹 수업 메뉴에서 먼저 수업을 등록해주세요</p>
                  </div>
                ) : (
                  <Select 
                    value={formData.groupLessonId?.toString() || ''} 
                    onValueChange={(value) => {
                      const lessonId = Number(value);
                      const selectedLesson = groupLessons.find((l: any) => Number(l.id) === lessonId);
                      if (selectedLesson) {
                        handleInputChange('groupLessonId', lessonId);
                        handleInputChange('groupLessonInstructorId', selectedLesson.instructorId ? Number(selectedLesson.instructorId) : null);
                        handleInputChange('groupLessonName', selectedLesson.name || '');
                        handleInputChange('price', selectedLesson.price || 0);
                        handleInputChange('productId', selectedLesson.productId || null);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-group-lesson">
                      <SelectValue placeholder="그룹 수업을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupLessons.filter((lesson: any) => lesson.id != null).map((lesson: any) => {
                        const instructor = staff.find((s: any) => Number(s.id) === Number(lesson.instructorId));
                        const instructorName = instructor ? (instructor.status === '퇴사' ? '-' : instructor.name) : '강사 미지정';
                        return (
                          <SelectItem key={lesson.id} value={String(lesson.id)}>
                            {lesson.name} ({instructorName})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 그룹 수업 선택 시 자동 표시되는 정보 (Auto-filled info from selected group lesson) */}
              {formData.groupLessonId && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">선택한 그룹 수업 정보</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">수업명</span>
                      <p className="font-medium">{formData.groupLessonName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">담당 강사</span>
                      <p className="font-medium">
                        {(() => {
                          const instructor = staff.find((s: any) => Number(s.id) === Number(formData.groupLessonInstructorId));
                          return instructor ? (instructor.status === '퇴사' ? '-' : instructor.name) : '미지정';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">가격 (원)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', Number(e.target.value) || 0)}
                    placeholder="결제 금액 입력"
                    data-testid="input-group-lesson-price"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">결제 방법</Label>
                  <Select value={formData.paymentMethod || '카드'} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                    <SelectTrigger data-testid="select-group-lesson-payment-method">
                      <SelectValue placeholder="결제 방법 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="카드">카드</SelectItem>
                      <SelectItem value="현금">현금</SelectItem>
                      <SelectItem value="계좌이체">계좌이체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === '락커 상품' && (
        <>
          {/* 락커 상품 선택 (Select locker product first to auto-fill price) */}
          <div>
            <Label htmlFor="lockerProductId">락커 상품 선택</Label>
            {products.filter((p: any) => p.category === '락커 상품').length === 0 ? (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center mt-2">
                <PackagePlus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">등록된 락커 상품이 없습니다</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreateProductCategory("락커 상품");
                    setShowCreateProductDialog(true);
                  }}
                  className="text-blue-600 border-blue-300 hover-elevate"
                  data-testid="btn-create-locker-product"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  락커 상품 등록하기
                </Button>
              </div>
            ) : (
              <Select 
                value={formData.lockerProductId?.toString() || ''} 
                onValueChange={(value) => {
                  const productId = Number(value);
                  const selectedProduct = products.find((p: any) => Number(p.id) === productId);
                  if (selectedProduct) {
                    handleInputChange('lockerProductId', productId);
                    handleInputChange('monthlyFee', Number(selectedProduct.price) || 0);
                    handleInputChange('lockerSection', selectedProduct.name);
                    
                    // 기간 자동 계산 (Auto-calculate dates based on product duration)
                    // 락커 상품은 기본 1개월로 설정 (Default 1 month for locker products)
                    const startDate = new Date();
                    const endDate = new Date();
                    const duration = selectedProduct.duration || 1;
                    const durationType = selectedProduct.durationType || '월';
                    
                    if (durationType === '월') {
                      endDate.setMonth(endDate.getMonth() + duration);
                    } else if (durationType === '일') {
                      endDate.setDate(endDate.getDate() + duration);
                    } else {
                      // 기타의 경우 기본 30일 * duration
                      endDate.setDate(endDate.getDate() + (duration * 30));
                    }
                    
                    handleInputChange('startDate', startDate.toISOString().split('T')[0]);
                    handleInputChange('endDate', endDate.toISOString().split('T')[0]);
                  }
                }}
              >
                <SelectTrigger data-testid="select-locker-product">
                  <SelectValue placeholder="락커 상품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter((p: any) => p.category === '락커 상품' && p.id != null).map((product: any) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name} - {(product.price || 0).toLocaleString()}원/월
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 락커 상품 선택 시 자동 표시되는 정보 */}
          {formData.lockerProductId && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-700">선택한 락커 상품 정보</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">상품명</span>
                  <p className="font-medium">{formData.lockerSection || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">월 사용료</span>
                  <p className="font-medium">{formData.monthlyFee?.toLocaleString() || 0}원</p>
                </div>
                {formData.startDate && formData.endDate && (
                  <div>
                    <span className="text-gray-500">이용 기간</span>
                    <p className="font-medium">{formData.startDate} ~ {formData.endDate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 락커 사용 현황 - 락커 배정은 락커 페이지에서 진행 (Locker assignment is done from the Locker page) */}
          <div>
            <Label>락커 사용 현황</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
              {formData.lockerId ? (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 font-medium">
                    사용중: {lockers.find((l: any) => l.id === formData.lockerId)?.section || ''} - {lockers.find((l: any) => l.id === formData.lockerId)?.number || ''}번
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">미정 (락커 페이지에서 배정)</span>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">시작일 *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
                data-testid="input-locker-start-date"
              />
            </div>
            <div>
              <Label htmlFor="endDate">종료일 *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
                data-testid="input-locker-end-date"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="monthlyFee">월 사용료 (원)</Label>
            <Input
              id="monthlyFee"
              type="number"
              value={formData.monthlyFee || ''}
              onChange={(e) => handleInputChange('monthlyFee', parseInt(e.target.value))}
              data-testid="input-monthly-fee"
            />
          </div>
        </>
      )}

      {activeTab === '운동 용품' && (
        <>
          {/* 운동 용품 상품 선택 (Equipment product selection) */}
          <div>
            <Label htmlFor="equipmentProductId">운동 용품 상품</Label>
            {products.filter((p: any) => p.category === '운동 용품').length === 0 ? (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center mt-2">
                <PackagePlus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">등록된 운동 용품 상품이 없습니다</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreateProductCategory("운동 용품");
                    setShowCreateProductDialog(true);
                  }}
                  className="text-blue-600 border-blue-300 hover-elevate"
                  data-testid="btn-create-equipment-product"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  운동 용품 상품 등록하기
                </Button>
              </div>
            ) : (
              <Select 
                value={formData.equipmentProductId?.toString() || ''} 
                onValueChange={(value) => {
                  const productId = Number(value);
                  const selectedProduct = products.find((p: any) => Number(p.id) === productId);
                  if (selectedProduct) {
                    handleInputChange('equipmentProductId', productId);
                    handleInputChange('equipmentName', selectedProduct.name);
                    handleInputChange('equipmentType', selectedProduct.description || '기타');
                    handleInputChange('price', Number(selectedProduct.price) || 0);
                    
                    // 대여일/반납일 자동 계산 (Auto-calculate rental dates)
                    const rentalDate = new Date();
                    const returnDate = new Date();
                    const duration = selectedProduct.duration || 1;
                    const durationType = selectedProduct.durationType || '월';
                    
                    if (durationType === '월') {
                      returnDate.setMonth(returnDate.getMonth() + duration);
                    } else if (durationType === '일') {
                      returnDate.setDate(returnDate.getDate() + duration);
                    } else {
                      returnDate.setDate(returnDate.getDate() + (duration * 30));
                    }
                    
                    handleInputChange('rentalDate', rentalDate.toISOString().split('T')[0]);
                    handleInputChange('returnDate', returnDate.toISOString().split('T')[0]);
                  }
                }}
              >
                <SelectTrigger data-testid="select-equipment-product">
                  <SelectValue placeholder="운동 용품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter((p: any) => p.category === '운동 용품').map((product: any) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name} - {product.price?.toLocaleString() || 0}원
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 운동 용품 선택 시 자동 표시되는 정보 */}
          {formData.equipmentProductId && (
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-semibold text-teal-700">선택한 용품 정보</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">용품명</span>
                  <p className="font-medium">{formData.equipmentName || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">가격</span>
                  <p className="font-medium">{formData.price?.toLocaleString() || 0}원</p>
                </div>
                {formData.rentalDate && formData.returnDate && (
                  <div>
                    <span className="text-gray-500">대여 기간</span>
                    <p className="font-medium">{formData.rentalDate} ~ {formData.returnDate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="equipmentType">용품 유형</Label>
            <Select value={formData.equipmentType || ''} onValueChange={(value) => handleInputChange('equipmentType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="용품 유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="운동복">운동복</SelectItem>
                <SelectItem value="운동화">운동화</SelectItem>
                <SelectItem value="수건">수건</SelectItem>
                <SelectItem value="락커키">락커키</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rentalDate">대여일</Label>
              <Input
                id="rentalDate"
                type="date"
                value={formData.rentalDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('rentalDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="returnDate">반납일</Label>
              <Input
                id="returnDate"
                type="date"
                value={formData.returnDate || ''}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="추가 메모사항을 입력하세요"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setFormData({})}>
          초기화
        </Button>
        <Button type="submit" className="bg-blue-600 hover-elevate">
          등록
        </Button>
      </div>

      {/* 상품 생성 다이얼로그 (Create Product Dialog) */}
      <CreateProductDialog
        open={showCreateProductDialog}
        onOpenChange={setShowCreateProductDialog}
        category={createProductCategory}
        onProductCreated={(productId) => {
          handleInputChange('productId', productId);
        }}
      />
    </form>
  );
}