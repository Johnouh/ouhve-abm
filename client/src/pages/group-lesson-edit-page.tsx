import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, parseApiResponse } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

import {
  ChevronLeft,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  DollarSign,
  Building,
  CheckCircle,
  Lock,
  ClipboardList,
  AlertTriangle
} from "lucide-react";

export default function GroupLessonEditPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{id: string}>();
  const lessonId = params.id;
  
  // Form states
  const [className, setClassName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
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

  // 그룹 수업 데이터 타입 (Group lesson data type)
  interface GroupLessonData {
    id: number;
    name: string;
    instructorId: number;
    time: string;
    duration?: string;
    maxParticipants: number;
    participants: number;
    dayOfWeek: number;
    price?: number;
    status?: string;
    color?: string;
  }

  // 🔍 기존 수업 데이터 조회 (Fetch existing lesson data)
  const { data: lessonData, isLoading: isLoadingLesson, error: lessonError } = useQuery<GroupLessonData | null>({
    queryKey: [`/api/group-lessons/${lessonId}`],
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  });

  // 📝 폼 데이터 초기화 (Initialize form data)
  useEffect(() => {
    if (lessonData) {
      
      setClassName(lessonData.name || "");
      setInstructor(lessonData.instructorId?.toString() || "");
      
      // 시간 처리 - "09:00 - 10:00" 형식인 경우 분리
      const timeString = lessonData.time || "";
      if (timeString.includes(' - ')) {
        const [start, end] = timeString.split(' - ');
        setStartTime(start);
        setEndTime(end);
      } else {
        setStartTime(timeString);
        // 기간으로부터 종료 시간 계산
        if (lessonData.duration) {
          const durationMinutes = parseInt(lessonData.duration.replace(/[^\d]/g, '')) || 60;
          const [startHours, startMins] = timeString.split(':').map(Number);
          const startTimeMinutes = startHours * 60 + startMins;
          const endTimeMinutes = startTimeMinutes + durationMinutes;
          const endHours = Math.floor(endTimeMinutes / 60);
          const endMins = endTimeMinutes % 60;
          setEndTime(`${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`);
        }
      }
      
      setMaxCapacity(lessonData.maxParticipants || 10);
      setMinCapacity(lessonData.participants || 1);
      
      // 기간 설정 - duration 필드 초기화
      if (lessonData.duration) {
        setDuration(lessonData.duration);
      }
      
      // 날짜 범위 설정 - 기본값으로 오늘부터 한 달 후까지
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(nextMonth.toISOString().split('T')[0]);
      
      // 요일 설정 - dayOfWeek 수정 (0=일요일, 1=월요일, ..., 6=토요일)
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      if (lessonData.dayOfWeek !== undefined && lessonData.dayOfWeek >= 0 && lessonData.dayOfWeek <= 6) {
        setSelectedDays([dayNames[lessonData.dayOfWeek]]);
      }
      
      // 기타 설정값들
      setCanSetCapacity(true);
      setTuition(lessonData.price || 0);
      
      // 상태 및 옵션 설정
      if (lessonData.status) {
        setAttendanceManagement(lessonData.status === 'active');
      }
    }
  }, [lessonData]);

  // 📝 그룹 수업 수정 뮤테이션 (Update group lesson mutation)
  const updateGroupLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const res = await apiRequest('PUT', `/api/group-lessons/${lessonId}`, lessonData);
      return await parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-lessons'] });
      toast({
        title: "그룹 수업 수정 완료",
        description: "그룹 수업이 성공적으로 수정되었습니다.",
      });
      setLocation("/group-lessons");
    },
    onError: (error: Error) => {
      toast({
        title: "수정 실패",
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

    const dayIndex = ['일', '월', '화', '수', '목', '금', '토'].indexOf(selectedDays[0]);
    const duration = calculateDuration(startTime, endTime);
    
    updateGroupLessonMutation.mutate({
      name: className,
      instructorId: parseInt(instructor),
      time: startTime,
      duration: duration,
      maxParticipants: maxCapacity,
      dayOfWeek: dayIndex,
      color: '#10B981',
      price: tuition,
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    const durationMinutes = endMinutes - startMinutes;
    return `${durationMinutes}분`;
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  if (isLoadingLesson) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  
  // 수업을 찾지 못한 경우
  if (lessonId && !lessonData && !isLoadingLesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">수업을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">요청한 수업 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => setLocation("/group-lessons")}>
            그룹 수업 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/group-lessons")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로 가기
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">그룹 수업 수정</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            나가기
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">기본 정보</h2>
            
            <div className="space-y-6">
              {/* Class Name */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                  <Settings className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-700 w-20">수업명</label>
                <Input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="수업명을 입력해 주세요."
                  className="flex-1 max-w-md"
                />
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-700 w-20">강사</label>
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

              {/* Period */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-700 w-20">기간</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-48"
                  />
                  <span className="text-gray-500">~</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-48"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-700 w-20">시간</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-gray-500">~</span>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-gray-500 ml-4">소요시간:</span>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="예: 60분"
                    className="w-24"
                  />
                </div>
              </div>

              {/* Days */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-700 w-20">요일</label>
                <div className="flex gap-2">
                  {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                    <Button
                      key={day}
                      variant={selectedDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayToggle(day)}
                      className={selectedDays.includes(day) ? "bg-orange-500 hover-elevate" : ""}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Settings Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">정원 설정</h2>
            
            <div className="space-y-6">
              {/* Capacity Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">정원 설정</label>
                    <p className="text-xs text-gray-500">수업 정원을 별도로 설정할 수 있습니다.</p>
                  </div>
                </div>
                <Switch
                  checked={canSetCapacity}
                  onCheckedChange={setCanSetCapacity}
                />
              </div>

              {/* Capacity Inputs */}
              {canSetCapacity && (
                <div className="space-y-4 ml-10">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20">최대 인원</label>
                    <Input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">명</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20">최소 인원</label>
                    <Input
                      type="number"
                      value={minCapacity}
                      onChange={(e) => setMinCapacity(Number(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">명</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reservation Settings Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">예약 설정</h2>
            
            <div className="space-y-6">
              {/* Reservation Deadline */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">예약 마감 기한</label>
                    <p className="text-xs text-gray-500">수업 시작 전 예약 마감 시간을 설정할 수 있습니다.</p>
                  </div>
                </div>
                <Switch
                  checked={useReservationDeadline}
                  onCheckedChange={setUseReservationDeadline}
                />
              </div>

              {useReservationDeadline && (
                <div className="ml-10">
                  <Select value={reservationDeadline} onValueChange={setReservationDeadline}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1일">1일 전</SelectItem>
                      <SelectItem value="3일">3일 전</SelectItem>
                      <SelectItem value="1주">1주 전</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
            disabled={updateGroupLessonMutation.isPending}
            className="bg-orange-500 hover-elevate text-white px-8 py-3 rounded-lg"
          >
            {updateGroupLessonMutation.isPending ? "저장 중..." : "수업 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}