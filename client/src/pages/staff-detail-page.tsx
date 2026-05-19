import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Phone, MapPin, Calendar, Briefcase, Users, Edit, Camera } from "lucide-react";
import { Staff, insertStaffSchema, type InsertStaff, type Payment, type Member } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/input-sanitizer";

interface StaffDetailPageProps {
  staffId: number;
  onBack: () => void;
}

export default function StaffDetailPage({ staffId, onBack }: StaffDetailPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("이번 달");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const { toast } = useToast();

  const { data: staff, isLoading } = useQuery<Staff>({
    queryKey: ["/api/staff", staffId],
    queryFn: async () => {
      const response = await fetch(`/api/staff/${staffId}`);
      if (!response.ok) throw new Error("직원 정보를 불러올 수 없습니다");
      return response.json();
    },
    enabled: !!staffId,
  });

  // 직원 매출 조회 (Fetch staff payments for sales)
  const { data: staffPayments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments", "staff", staffId],
    queryFn: async () => {
      const response = await fetch(`/api/payments?staffId=${staffId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!staffId,
  });

  // 회원 목록 조회 (Fetch members for display)
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // 개인 트레이닝 조회 (Fetch personal training for this instructor)
  const { data: personalTrainings = [] } = useQuery<any[]>({
    queryKey: ["/api/personal-training"],
  });

  // 그룹 수업 조회 (Fetch group lessons for this instructor)
  const { data: groupLessons = [] } = useQuery<any[]>({
    queryKey: ["/api/group-lessons"],
  });

  // 담당 회원 필터링 (Filter members assigned to this staff)
  const assignedMembers = members.filter(m => {
    const hasPT = personalTrainings.some(pt => pt.instructorId === staffId && pt.memberId === m.id);
    return hasPT;
  });

  // 담당 개인 레슨 필터링 (Filter personal trainings for this instructor)
  const staffPersonalTrainings = personalTrainings.filter(pt => pt.instructorId === staffId);

  // 담당 그룹 수업 필터링 (Filter group lessons for this instructor)
  const staffGroupLessons = groupLessons.filter(gl => gl.instructorId === staffId);

  // 매출 카테고리별 계산 (Calculate sales by category)
  const membershipSales = staffPayments.filter(p => p.status === "완료" && (p.description?.includes("회원권") || false)).reduce((sum, p) => sum + (p.amount || 0), 0);
  const ptSales = staffPayments.filter(p => p.status === "완료" && (p.description?.includes("개인 레슨") || p.description?.includes("PT") || false)).reduce((sum, p) => sum + (p.amount || 0), 0);
  const lockerSales = staffPayments.filter(p => p.status === "완료" && (p.description?.includes("락커") || false)).reduce((sum, p) => sum + (p.amount || 0), 0);
  const equipmentSales = staffPayments.filter(p => p.status === "완료" && (p.description?.includes("운동") || p.description?.includes("용품") || false)).reduce((sum, p) => sum + (p.amount || 0), 0);

  // 매출 계산 (Calculate sales)
  const totalSales = staffPayments.filter(p => p.status === "완료").reduce((sum, p) => sum + (p.amount || 0), 0);
  const thisMonthPayments = staffPayments.filter(p => {
    if (!p.paymentDate) return false;
    const paymentDate = new Date(p.paymentDate);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  });
  const thisMonthSales = thisMonthPayments.filter(p => p.status === "완료").reduce((sum, p) => sum + (p.amount || 0), 0);

  // 직원 수정 폼 (Staff edit form)
  const editForm = useForm<Partial<InsertStaff>>({
    resolver: zodResolver(insertStaffSchema.partial()),
    defaultValues: {
      name: staff?.name || '',
      phone: staff?.phone || '',
      email: staff?.email || '',
      position: staff?.position || '',
      department: staff?.department || '',
      birthDate: staff?.birthDate || '',
      address: staff?.address || '',
      emergencyContact: staff?.emergencyContact || '',
      salary: staff?.salary || undefined,
      workType: staff?.workType || '정규직',
      workHours: staff?.workHours || '',
      notes: staff?.notes || '',
    },
  });

  // 직원 수정 뮤테이션 (Staff edit mutation)
  const editStaffMutation = useMutation({
    mutationFn: async (data: Partial<InsertStaff>) => {
      const res = await apiRequest("PUT", `/api/staff/${staffId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setShowEditDialog(false);
      toast({
        title: "수정 완료",
        description: "직원 정보가 성공적으로 수정되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "수정 실패",
        description: "직원 정보 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 폼 제출 (Form submission)
  const onEditSubmit = (data: Partial<InsertStaff>) => {
    editStaffMutation.mutate(data);
  };

  // 폼 값 초기화 (Initialize form values)
  useEffect(() => {
    if (staff) {
      editForm.reset({
        name: staff.name,
        phone: staff.phone,
        email: staff.email || '',
        position: staff.position,
        department: staff.department || '',
        birthDate: staff.birthDate || '',
        address: staff.address || '',
        emergencyContact: staff.emergencyContact || '',
        salary: staff.salary || undefined,
        workType: staff.workType,
        workHours: staff.workHours || '',
        notes: staff.notes || '',
      });
    }
  }, [staff, editForm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="flex space-x-6">
                <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-64"></div>
                  <div className="h-4 bg-gray-200 rounded w-56"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div className="text-center py-20">
            <p className="text-gray-500">직원 정보를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            직원 정보
          </Button>
        </div>

        {/* Profile Section */}
        <Card className="bg-white">
          <CardAccentLine />
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div 
                  className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center cursor-pointer hover-elevate transition-colors"
                  onClick={() => setShowPhotoUpload(true)}
                >
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs text-blue-600">사진 업로드</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  직원 수정
                </Button>
              </div>

              {/* Staff Info */}
              <div className="flex-1">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{staff.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      {staff.birthDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{staff.birthDate}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{formatPhoneNumber(staff.phone)}</span>
                      </div>
                      {staff.position && (
                        <div className="flex items-center space-x-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{staff.position}</span>
                        </div>
                      )}
                      {staff.workType && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">{staff.workType}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Information Grid */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">입사일</div>
                    <div className="text-sm font-medium">
                      {staff.hireDate ? new Date(staff.hireDate).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">부서</div>
                    <div className="text-sm font-medium">{staff.department || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">주소</div>
                    <div className="text-sm font-medium">{staff.address || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">이메일</div>
                    <div className="text-sm font-medium">{staff.email || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {staff.notes && (
                <div className="flex-shrink-0 w-80">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardAccentLine />
                    <CardContent className="p-4">
                      <h4 className="font-medium text-blue-900 mb-2">비고</h4>
                      <p className="text-sm text-blue-800">{staff.notes}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="매출" className="w-full">
          <TabsList className="bg-white border-b w-full justify-start gap-1 p-1">
            <TabsTrigger value="매출" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white px-6 py-2">매출</TabsTrigger>
            <TabsTrigger value="담당 회원" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white px-6 py-2">담당 회원</TabsTrigger>
            <TabsTrigger value="수업 내역" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white px-6 py-2">수업 내역</TabsTrigger>
          </TabsList>

          <TabsContent value="매출" className="space-y-6">
            <Card className="bg-white">
              <CardAccentLine />
              <CardContent className="p-6">
                {/* Sales Controls */}
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-sm text-gray-600">진행 매출 내역 (최신 작성 순서)</span>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="이번 달">이번 달</SelectItem>
                      <SelectItem value="지난 달">지난 달</SelectItem>
                      <SelectItem value="3개월">3개월</SelectItem>
                      <SelectItem value="6개월">6개월</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sales Stats Cards - 5 categories */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <Card className="border-l-4 border-blue-500">
                    <CardAccentLine />
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">전체 매출</div>
                      <div className="text-xl font-bold text-blue-600 tabular-nums">{totalSales.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">원</div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-green-500">
                    <CardAccentLine />
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">회원권 매출</div>
                      <div className="text-xl font-bold text-green-600 tabular-nums">{membershipSales.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">원</div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-purple-500">
                    <CardAccentLine />
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">개인 레슨 매출</div>
                      <div className="text-xl font-bold text-purple-600 tabular-nums">{ptSales.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">원</div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-orange-500">
                    <CardAccentLine />
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">락커 매출</div>
                      <div className="text-xl font-bold text-orange-600 tabular-nums">{lockerSales.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">원</div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-pink-500">
                    <CardAccentLine />
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">운동용품 매출</div>
                      <div className="text-xl font-bold text-pink-600 tabular-nums">{equipmentSales.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">원</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sales History Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">매출 내역 ({staffPayments.length}건)</span>
                  </div>
                  
                  <div className="bg-white border rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 text-sm font-medium">고객명</th>
                          <th className="text-left p-3 text-sm font-medium">결제일</th>
                          <th className="text-left p-3 text-sm font-medium">결제 내용</th>
                          <th className="text-right p-3 text-sm font-medium">금액</th>
                          <th className="text-center p-3 text-sm font-medium">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffPayments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <span className="text-sm text-gray-500">보여줄 매출 내역이 없습니다.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          staffPayments.map((payment) => {
                            const member = members.find(m => m.id === payment.memberId);
                            return (
                              <tr key={payment.id} className="border-b hover-elevate">
                                <td className="p-3 text-sm">{member?.name || "-"}</td>
                                <td className="p-3 text-sm">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ko-KR') : "-"}</td>
                                <td className="p-3 text-sm">{payment.description || "-"}</td>
                                <td className="p-3 text-sm text-right font-medium tabular-nums">{(payment.amount || 0).toLocaleString()}원</td>
                                <td className="p-3 text-sm text-center">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    payment.status === "완료" ? "bg-green-100 text-green-600" :
                                    payment.status === "취소" ? "bg-red-100 text-red-600" :
                                    "bg-gray-100 text-gray-600"
                                  }`}>
                                    {payment.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="담당 회원" className="space-y-6">
            <Card className="bg-white">
              <CardAccentLine />
              <CardContent className="p-6">
                {/* Member Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-medium">담당 회원 목록</span>
                </div>

                {/* Total Count */}
                <div className="mb-4">
                  <span className="text-lg font-bold">총 {assignedMembers.length}명</span>
                </div>

                {/* Members Table */}
                <div className="bg-white border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 text-sm font-medium">번호</th>
                        <th className="text-left p-3 text-sm font-medium">이름</th>
                        <th className="text-left p-3 text-sm font-medium">연락처</th>
                        <th className="text-left p-3 text-sm font-medium">성별</th>
                        <th className="text-left p-3 text-sm font-medium">레슨 상태</th>
                        <th className="text-left p-3 text-sm font-medium">잔여 횟수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedMembers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center space-y-2">
                              <Users className="w-12 h-12 text-gray-300" />
                              <span className="text-sm text-gray-500">담당 회원이 없습니다.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        assignedMembers.map((member, idx) => {
                          const pt = staffPersonalTrainings.find(p => p.memberId === member.id);
                          return (
                            <tr key={member.id} className="border-b hover-elevate">
                              <td className="p-3 text-sm">{idx + 1}</td>
                              <td className="p-3 text-sm font-medium">{member.name}</td>
                              <td className="p-3 text-sm">{formatPhoneNumber(member.phone)}</td>
                              <td className="p-3 text-sm">{member.gender || "-"}</td>
                              <td className="p-3 text-sm">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  pt?.status === "진행중" ? "bg-green-100 text-green-600" :
                                  pt?.status === "완료" ? "bg-gray-100 text-gray-600" :
                                  "bg-blue-100 text-blue-600"
                                }`}>
                                  {pt?.status || "활성"}
                                </span>
                              </td>
                              <td className="p-3 text-sm">{pt ? `${(pt.totalSessions || 0) - (pt.usedSessions || 0)}회` : "-"}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="수업 내역" className="space-y-6">
            <Card className="bg-white">
              <CardAccentLine />
              <CardContent className="p-6">
                {/* Lesson Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-medium">담당 수업 목록</span>
                </div>

                {/* Lesson Type Tabs */}
                <Tabs defaultValue="개인 레슨" className="w-full">
                  <TabsList className="bg-gray-100 mb-4">
                    <TabsTrigger value="개인 레슨" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      개인 레슨 ({staffPersonalTrainings.length})
                    </TabsTrigger>
                    <TabsTrigger value="그룹 수업" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      그룹 수업 ({staffGroupLessons.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="개인 레슨" className="space-y-4">
                    {/* Personal Lesson Table */}
                    <div className="mb-4">
                      <span className="text-lg font-bold">총 {staffPersonalTrainings.length}건</span>
                    </div>
                    <div className="bg-white border rounded-lg">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 text-sm font-medium">번호</th>
                            <th className="text-left p-3 text-sm font-medium">회원명</th>
                            <th className="text-left p-3 text-sm font-medium">총 횟수</th>
                            <th className="text-left p-3 text-sm font-medium">사용 횟수</th>
                            <th className="text-left p-3 text-sm font-medium">잔여 횟수</th>
                            <th className="text-left p-3 text-sm font-medium">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffPersonalTrainings.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-12">
                                <div className="flex flex-col items-center space-y-2">
                                  <Calendar className="w-12 h-12 text-gray-300" />
                                  <span className="text-sm text-gray-500">개인 레슨 내역이 없습니다.</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            staffPersonalTrainings.map((pt, idx) => {
                              const member = members.find(m => m.id === pt.memberId);
                              return (
                                <tr key={pt.id} className="border-b hover-elevate">
                                  <td className="p-3 text-sm">{idx + 1}</td>
                                  <td className="p-3 text-sm font-medium">{member?.name || "-"}</td>
                                  <td className="p-3 text-sm">{pt.totalSessions || 0}회</td>
                                  <td className="p-3 text-sm">{pt.usedSessions || 0}회</td>
                                  <td className="p-3 text-sm font-medium text-blue-600">{(pt.totalSessions || 0) - (pt.usedSessions || 0)}회</td>
                                  <td className="p-3 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      pt.status === "진행중" ? "bg-green-100 text-green-600" :
                                      pt.status === "완료" ? "bg-gray-100 text-gray-600" :
                                      "bg-blue-100 text-blue-600"
                                    }`}>
                                      {pt.status || "활성"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="그룹 수업" className="space-y-4">
                    {/* Group Class Table */}
                    <div className="mb-4">
                      <span className="text-lg font-bold">총 {staffGroupLessons.length}건</span>
                    </div>
                    <div className="bg-white border rounded-lg">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 text-sm font-medium">번호</th>
                            <th className="text-left p-3 text-sm font-medium">수업명</th>
                            <th className="text-left p-3 text-sm font-medium">수업 시간</th>
                            <th className="text-left p-3 text-sm font-medium">정원</th>
                            <th className="text-left p-3 text-sm font-medium">현재 참여</th>
                            <th className="text-left p-3 text-sm font-medium">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffGroupLessons.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-12">
                                <div className="flex flex-col items-center space-y-2">
                                  <Users className="w-12 h-12 text-gray-300" />
                                  <span className="text-sm text-gray-500">그룹 수업 내역이 없습니다.</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            staffGroupLessons.map((gl, idx) => (
                              <tr key={gl.id} className="border-b hover-elevate">
                                <td className="p-3 text-sm">{idx + 1}</td>
                                <td className="p-3 text-sm font-medium">{gl.name}</td>
                                <td className="p-3 text-sm">{gl.time || "-"}</td>
                                <td className="p-3 text-sm">{gl.maxParticipants || "-"}명</td>
                                <td className="p-3 text-sm">{gl.participants || 0}명</td>
                                <td className="p-3 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    gl.status === "활성" ? "bg-green-100 text-green-600" :
                                    "bg-gray-100 text-gray-600"
                                  }`}>
                                    {gl.status || "활성"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Staff Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>직원 정보 수정</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름 *</FormLabel>
                      <FormControl>
                        <Input placeholder="직원 이름" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>직급</FormLabel>
                      <FormControl>
                        <Input placeholder="직급" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>부서</FormLabel>
                      <FormControl>
                        <Input placeholder="부서" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="이메일" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>생년월일</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소</FormLabel>
                    <FormControl>
                      <Input placeholder="주소" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비상연락처</FormLabel>
                      <FormControl>
                        <Input placeholder="비상연락처" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>급여</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="급여" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>고용형태</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="고용형태 선택" />
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
                  control={editForm.control}
                  name="workHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>근무시간</FormLabel>
                      <FormControl>
                        <Input placeholder="근무시간" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메모</FormLabel>
                    <FormControl>
                      <Textarea placeholder="메모" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={editStaffMutation.isPending}>
                  {editStaffMutation.isPending ? "수정 중..." : "수정"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로필 사진 업로드</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>JPG, PNG 파일만 업로드 가능합니다.</p>
              <p>최대 파일 크기: 5MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // 실제 프로젝트에서는 파일 업로드 API 호출
                  toast({
                    title: "업로드 완료",
                    description: "프로필 사진이 업로드되었습니다.",
                  });
                  setShowPhotoUpload(false);
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}