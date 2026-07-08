import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, parseApiResponse } from "@/lib/queryClient";

import { 
  Home, 
  Users, 
  Building2, 
  CreditCard, 
  Package, 
  MapPin, 
  Calendar,
  Clock,
  BookOpen,
  MessageSquare,
  FileText,
  BarChart3,
  ChevronDown,
  Bell,
  Settings,
  User,
  HelpCircle,
  LogOut,
  ArrowLeft,
  DollarSign,
  Building,
  CheckCircle,
  Lock,
  ClipboardList,
  AlertTriangle,
  GraduationCap
} from "lucide-react";

export default function GroupLessonAddPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  
  // Form states
  const [className, setClassName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [canSetCapacity, setCanSetCapacity] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [minCapacity, setMinCapacity] = useState(1);
  const [reservationDeadline, setReservationDeadline] = useState("3일");
  const [useReservationDeadline, setUseReservationDeadline] = useState(false);
  const [autoCancel, setAutoCancel] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [allowOutsideReservation, setAllowOutsideReservation] = useState(false);
  const [attendanceManagement, setAttendanceManagement] = useState(false);
  const [tuition, setTuition] = useState(0);

  // 📊 직원 데이터 조회 (Fetch staff data)
  const { data: staffData = [] } = useQuery<any[]>({
    queryKey: ['/api/staff'],
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  // 📊 현재 사용자 정보 조회 (Fetch current user data)
  const { data: currentUser } = useQuery<{ name?: string; username: string; role: string } | null>({
    queryKey: ['/api/auth/me'],
    staleTime: 5 * 60 * 1000,
  });

  // 📝 그룹 수업 생성 뮤테이션 (Create group lesson mutation)
  const createGroupLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const res = await apiRequest('POST', '/api/group-lessons', lessonData);
      return await parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-lessons'] });
      toast({
        title: "그룹 수업 생성 완료",
        description: "새로운 그룹 수업이 성공적으로 생성되었습니다.",
      });
      setLocation("/group-lessons");
    },
    onError: (error: Error) => {
      toast({
        title: "생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!className || !instructor || !startTime || !endTime || selectedDays.length === 0) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 선택된 각 요일에 대해 수업 생성
    selectedDays.forEach((day) => {
      const dayIndex = ['월', '화', '수', '목', '금', '토', '일'].indexOf(day) + 1;
      const duration = calculateDuration(startTime, endTime);
      
      createGroupLessonMutation.mutate({
        name: className,
        instructorId: parseInt(instructor),
        time: startTime,
        duration: duration,
        maxParticipants: maxCapacity,
        minParticipants: minCapacity,
        participants: 0,
        dayOfWeek: dayIndex,
        color: '#10B981',
        price: tuition,
        status: "활성",
        startTime: startTime,
        endTime: endTime,
        operatingDays: selectedDays,
      });
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    const durationMinutes = endMinutes - startMinutes;
    return `${durationMinutes}분`;
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const days = ["월", "화", "수", "목", "금", "토", "일"];

  const sidebarMenus = [
    { icon: Home, label: "대시보드", active: false, path: "/" },
    { icon: Users, label: "회원 관리", active: false, path: "/members" },
    { icon: Building2, label: "매장", active: false, path: "/franchises" },
    { icon: CreditCard, label: "결제", active: false, path: "/payments" },
    { icon: Package, label: "상품", active: false, path: "/products" },
    { icon: MapPin, label: "락커", active: false, path: "/lockers" },
    { icon: Calendar, label: "출석", active: false, path: "/attendance" },
    { icon: Clock, label: "일정", active: false, path: "/schedules" },
    { icon: BookOpen, label: "그룹 수업", active: true, path: "/group-lessons" },
    { icon: MessageSquare, label: "개인 레슨", active: false, path: "/personal-training" },
    { icon: FileText, label: "계약서", active: false, path: "/contracts" },
    { icon: Users, label: "상담", active: false, path: "/consultations" },
    { icon: CreditCard, label: "기타 매출", active: false, path: "/other-sales" },
    { icon: BarChart3, label: "통계", active: false, path: "/statistics" }
  ];

  const handleMenuClick = (path: string) => {
    setLocation(path);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setLocation('/auth');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg">OUHVE ABM</span>
            <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">PRO</span>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 p-4">
          <div className="space-y-1">
            {sidebarMenus.map((menu, index) => (
              <button
                key={index}
                onClick={() => handleMenuClick(menu.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  menu.active 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-600 hover-elevate'
                }`}
              >
                <menu.icon className="w-4 h-4" />
                {menu.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover-elevate rounded-lg">
            <HelpCircle className="w-4 h-4" />
            <span>도움말</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover-elevate rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">수업 추가</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>그룹 수업</span>
                <ChevronDown className="w-4 h-4" />
                <span>수업 추가</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Bell className="w-5 h-5 text-gray-400" />
              <Settings className="w-5 h-5 text-gray-400" />
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {currentUser ? `${currentUser.name || currentUser.username} ${currentUser.role === 'admin' ? '관리자' : currentUser.role === 'staff' ? '직원' : '회원'}` : '사용자'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Basic Settings Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">기본 설정</h2>
              
              <div className="space-y-6">
                {/* Class Name */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">수업명 *</label>
                  <Input
                    placeholder="수업명을 입력하여 주세요."
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="flex-1 max-w-md"
                  />
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-orange-600 shrink-0" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">담당 강사 *</label>
                  <Select value={instructor} onValueChange={setInstructor}>
                    <SelectTrigger className="flex-1 max-w-md">
                      <SelectValue placeholder="강사를 선택해 주세요." />
                    </SelectTrigger>
                    <SelectContent>
                      {staffData.filter((staff: any) => staff.id != null && staff.status !== '퇴사').map((staff: any) => (
                        <SelectItem key={staff.id} value={String(staff.id)}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Period */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">수업 진행 기간</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-40"
                    />
                    <span className="text-gray-500">~</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-40"
                    />
                    <span className="text-sm text-gray-500 ml-2">종료일</span>
                    <span className="text-sm text-gray-500">월 - 일</span>
                  </div>
                </div>

                {/* Class Time */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">수업 시간 *</label>
                  <div className="flex items-center gap-2">
                    <Select value={startTime} onValueChange={setStartTime}>
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
                    <Select value={endTime} onValueChange={setEndTime}>
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
                    <span className="text-sm text-gray-500 ml-2">종료</span>
                    <span className="text-sm text-gray-500">분</span>
                  </div>
                </div>

                {/* Days Selection */}
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center mt-1">
                    <ClipboardList className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20 pt-1">운영 요일</label>
                  <div className="flex gap-2">
                    {days.map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                          selectedDays.includes(day)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover-elevate'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capacity Setting */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">수강 가능한 상품 설정 *</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="all-products"
                        name="capacity-setting"
                        checked={!canSetCapacity}
                        onChange={() => setCanSetCapacity(false)}
                        className="w-4 h-4 text-orange-600"
                      />
                      <label htmlFor="all-products" className="text-sm text-gray-700">모든 수강 수업</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="specific-products"
                        name="capacity-setting"
                        checked={canSetCapacity}
                        onChange={() => setCanSetCapacity(true)}
                        className="w-4 h-4 text-orange-600"
                      />
                      <label htmlFor="specific-products" className="text-sm text-gray-700">선택한 상품만 설정</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reservation Settings Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">예약 설정</h2>
              
              <div className="space-y-6">
                {/* Capacity */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">인원 설정 *</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">정원</span>
                      <Input
                        type="number"
                        value={maxCapacity}
                        onChange={(e) => setMaxCapacity(Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">명</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">최소 인원</span>
                      <Input
                        type="number"
                        value={minCapacity}
                        onChange={(e) => setMinCapacity(Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">명</span>
                    </div>
                  </div>
                </div>

                {/* Reservation Time */}
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">예약 가능 시간 설정 *</label>
                  <div className="flex gap-4">
                    {["3일", "1시간", "10분", "예약 불가"].map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={option}
                          name="reservation-time"
                          checked={reservationDeadline === option}
                          onChange={() => setReservationDeadline(option)}
                          className="w-4 h-4 text-orange-600"
                        />
                        <label htmlFor={option} className="text-sm text-gray-700">{option}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Toggle Settings */}
                <div className="space-y-4">
                  {/* Reservation Deadline */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <label className="text-sm font-medium text-gray-700">예약 마감 시간 설정</label>
                    </div>
                    <Switch
                      checked={useReservationDeadline}
                      onCheckedChange={setUseReservationDeadline}
                    />
                  </div>

                  {/* Auto Cancel */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">인원 미달 시 자동 취소 / 예약 승인</label>
                        <p className="text-xs text-gray-500">최소 인원 미달 시 수업을 자동으로 취소하거나, 승인 후 예약이 확정됩니다.</p>
                      </div>
                    </div>
                    <Switch
                      checked={autoCancel}
                      onCheckedChange={setAutoCancel}
                    />
                  </div>

                  {/* Require Approval */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">예약 승인</label>
                        <p className="text-xs text-gray-500">예약 승인 후 예약이 완료됩니다.</p>
                      </div>
                    </div>
                    <Switch
                      checked={requireApproval}
                      onCheckedChange={setRequireApproval}
                    />
                  </div>

                  {/* Outside Reservation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <Lock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">수업 외 예약 가능</label>
                        <p className="text-xs text-gray-500">수업 시간 외에도 예약할 수 있습니다.</p>
                      </div>
                    </div>
                    <Switch
                      checked={allowOutsideReservation}
                      onCheckedChange={setAllowOutsideReservation}
                    />
                  </div>

                  {/* Attendance Management */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <ClipboardList className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">출석 관리</label>
                        <p className="text-xs text-gray-500">출석을 별도로 관리하여 수업을 진행할 수 있습니다.</p>
                      </div>
                    </div>
                    <Switch
                      checked={attendanceManagement}
                      onCheckedChange={setAttendanceManagement}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tuition Settings Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">수업료 설정</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">수업료</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={tuition}
                      onChange={(e) => setTuition(Number(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">원</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <Building className="h-4 w-4 text-orange-600" />
                  </div>
                  <label className="text-sm font-medium text-gray-700 w-20">지급 옵션</label>
                  <Button variant="outline" size="sm">
                    조건 추가
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={createGroupLessonMutation.isPending}
              className="bg-orange-500 hover-elevate text-white px-8 py-3 rounded-lg"
            >
              {createGroupLessonMutation.isPending ? "저장 중..." : "수업 저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}