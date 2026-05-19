import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { type Schedule, type Staff, type GroupLesson, type Consultation, type PtSession, type PersonalTraining, type Member } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight,
  X,
  Users,
  Clock,
  MessageCircle,
  Dumbbell,
  Plus,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";

const scheduleFormSchema = z.object({
  title: z.string().min(1, "일정명을 입력해주세요"),
  description: z.string().optional(),
  instructorId: z.string().optional(),
  dayOfWeek: z.string().min(1, "요일을 선택해주세요"),
  startTime: z.string().min(1, "시작 시간을 선택해주세요"),
  endTime: z.string().min(1, "종료 시간을 선택해주세요"),
  color: z.string().default("#3B82F6"),
  isRecurring: z.boolean().default(true),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: "종료 시간은 시작 시간보다 뒤여야 합니다",
  path: ["endTime"],
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface ExtendedSchedule {
  id: number | string;
  title: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: number;
  color: string;
  type?: string;
  instructorId?: number | null;
  customerName?: string;
  phone?: string;
  participants?: number | null;
  maxParticipants?: number | null;
  description?: string | null;
  isRecurring?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  franchiseId?: number | null;
  currentParticipants?: number | null;
}

export default function SchedulesPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<ExtendedSchedule | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<string>("all");
  const { toast } = useToast();

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: "",
      description: "",
      instructorId: "",
      dayOfWeek: "1",
      startTime: "09:00",
      endTime: "10:00",
      color: "#3B82F6",
      isRecurring: true,
    },
  });

  const { data: schedulesList = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      await apiRequest("POST", "/api/schedules", {
        ...data,
        dayOfWeek: parseInt(data.dayOfWeek),
        instructorId: data.instructorId ? parseInt(data.instructorId) : null,
        isActive: true
      });
    },
    onSuccess: () => {
      toast({ title: "일정 등록 완료", description: "새 일정이 추가되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "등록 실패", description: "일정 등록 중 오류가 발생했습니다.", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ScheduleFormData }) => {
      await apiRequest("PUT", `/api/schedules/${id}`, {
        ...data,
        dayOfWeek: parseInt(data.dayOfWeek),
        instructorId: data.instructorId ? parseInt(data.instructorId) : null
      });
    },
    onSuccess: () => {
      toast({ title: "수정 완료", description: "일정이 수정되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowEditDialog(false);
      setEditingSchedule(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "수정 실패", description: "일정 수정 중 오류가 발생했습니다.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      toast({ title: "삭제 완료", description: "일정이 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowDeleteDialog(false);
      setSelectedSchedule(null);
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "일정 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    }
  });

  const handleEdit = (schedule: ExtendedSchedule) => {
    if (typeof schedule.id === 'string') {
      toast({ title: "수정 불가", description: "이 일정은 직접 수정할 수 없습니다.", variant: "destructive" });
      return;
    }
    const originalSchedule = schedulesList.find(s => s.id === schedule.id);
    if (originalSchedule) {
      setEditingSchedule(originalSchedule);
      form.reset({
        title: originalSchedule.title,
        description: originalSchedule.description || "",
        instructorId: originalSchedule.instructorId?.toString() || "",
        dayOfWeek: originalSchedule.dayOfWeek?.toString() || "1",
        startTime: originalSchedule.startTime || "09:00",
        endTime: originalSchedule.endTime || "10:00",
        color: originalSchedule.color || "#3B82F6",
        isRecurring: (originalSchedule as any).isRecurring ?? true
      });
      setShowEditDialog(true);
    }
  };

  const handleDelete = (schedule: ExtendedSchedule) => {
    if (typeof schedule.id === 'string') {
      toast({ title: "삭제 불가", description: "이 일정은 직접 삭제할 수 없습니다.", variant: "destructive" });
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleCreateSubmit = (data: ScheduleFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdateSubmit = (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    }
  };

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: groupLessonsList = [] } = useQuery<GroupLesson[]>({
    queryKey: ["/api/group-lessons"],
  });

  const { data: consultationsList = [] } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations-direct"],
    queryFn: async () => {
      const response = await fetch('/api/consultations-direct', {
        credentials: 'include'
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    }
  });

  const { data: ptSessionsList = [] } = useQuery<PtSession[]>({
    queryKey: ["/api/pt-sessions"],
    queryFn: async () => {
      const response = await fetch('/api/pt-sessions', {
        credentials: 'include'
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    }
  });

  // 🏋️ PT 등록 정보 조회 (Fetch personal training registrations for schedule display)
  const { data: personalTrainingList = [] } = useQuery<PersonalTraining[]>({
    queryKey: ["/api/personal-training"],
  });

  // 👥 회원 목록 조회 (Fetch member list for PT schedule display)
  const { data: membersList = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // 📋 회원 이름 조회 헬퍼 함수 (Helper function to get member name)
  const getMemberName = (memberId: number | null | undefined) => {
    if (!memberId) return "미정";
    const member = membersList.find(m => m.id === memberId);
    return member ? member.name : "미정";
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);
      const days = direction === 'prev' ? -7 : 7;
      newWeek.setDate(newWeek.getDate() + days);
      return newWeek;
    });
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return start;
  };

  const generateWeekDays = () => {
    const weekStart = getWeekStart(currentWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatWeekRange = () => {
    const weekStart = getWeekStart(currentWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.getFullYear()}년 ${(weekStart.getMonth() + 1).toString().padStart(2, '0')}월 ${weekStart.getDate()}일 ~ ${weekEnd.getDate()}일`;
    } else {
      return `${weekStart.getFullYear()}년 ${(weekStart.getMonth() + 1).toString().padStart(2, '0')}월 ${weekStart.getDate()}일 ~ ${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}월 ${weekEnd.getDate()}일`;
    }
  };

  const getSchedulesForDay = (dayOfWeek: number) => {
    const schedules = schedulesList.filter(schedule => 
      schedule.dayOfWeek === dayOfWeek && schedule.isActive
    );
    
    // 🏋️ 요일 매핑 (Day mapping for operatingDays)
    const dayKoreanMapping = ['일', '월', '화', '수', '목', '금', '토'];
    const currentDayKorean = dayKoreanMapping[dayOfWeek];
    
    const groupLessonsAsSchedules = groupLessonsList
      .filter(lesson => {
        // operatingDays가 있으면 그것을 우선 사용, 없으면 dayOfWeek 사용
        const operatingDays = lesson.operatingDays || [];
        if (operatingDays.length > 0) {
          return operatingDays.includes(currentDayKorean);
        }
        // dayOfWeek 값 변환: DB에서 1=월요일, 2=화요일, ..., 7=일요일 → JS Date에서 0=일요일, 1=월요일, ..., 6=토요일
        const lessonDayOfWeek = lesson.dayOfWeek === 7 ? 0 : lesson.dayOfWeek;
        return lessonDayOfWeek === dayOfWeek;
      })
      .map(lesson => ({
        id: `group-${lesson.id}-${dayOfWeek}`,
        title: lesson.name,
        description: `그룹 수업 - ${lesson.name}`,
        instructorId: lesson.instructorId,
        startTime: lesson.startTime || lesson.time || "09:00",
        endTime: lesson.endTime || calculateEndTime(lesson.startTime || lesson.time || "09:00", lesson.duration || "60분"),
        dayOfWeek: dayOfWeek,
        isRecurring: true,
        isActive: true,
        color: lesson.color || '#10B981',
        type: 'group-lesson',
        groupLessonId: lesson.id,
        participants: lesson.participants || 0,
        maxParticipants: lesson.maxParticipants || 10
      }));
    
    const consultationsAsSchedules = consultationsList
      .filter(consultation => {
        const consultationDate = new Date(consultation.consultationDate);
        const weekStart = getWeekStart(currentWeek);
        const targetDate = new Date(weekStart);
        targetDate.setDate(targetDate.getDate() + dayOfWeek);
        
        return consultationDate.toDateString() === targetDate.toDateString();
      })
      .map(consultation => ({
        id: `consultation-${consultation.id}`,
        title: `${consultation.customerName} 상담`,
        description: `상담 - ${consultation.customerName}`,
        instructorId: consultation.counselorId,
        startTime: new Date(consultation.consultationDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        endTime: calculateEndTime(new Date(consultation.consultationDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }), "60분"),
        dayOfWeek: dayOfWeek,
        isRecurring: false,
        isActive: true,
        color: '#f59e0b',
        type: 'consultation',
        consultationId: consultation.id,
        customerName: consultation.customerName,
        phone: consultation.phone
      }));
    
    const ptSessionsAsSchedules = ptSessionsList
      .filter(session => {
        const sessionDate = new Date(session.scheduledDate);
        const weekStart = getWeekStart(currentWeek);
        const targetDate = new Date(weekStart);
        targetDate.setDate(targetDate.getDate() + dayOfWeek);
        
        return sessionDate.toDateString() === targetDate.toDateString();
      })
      .map(session => ({
        id: `pt-${session.id}`,
        title: `PT 세션`,
        description: `개인 레슨 - PT ${session.id}`,
        instructorId: session.instructorId,
        startTime: new Date(session.scheduledDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        endTime: calculateEndTime(
          new Date(session.scheduledDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }), 
          `${session.duration || 60}분`
        ),
        dayOfWeek: dayOfWeek,
        isRecurring: false,
        isActive: true,
        color: '#8b5cf6',
        type: 'pt-session',
        ptSessionId: session.id,
        status: session.status
      }));
    
    // 🏋️ PT 등록 정기 일정 표시 (Show recurring PT schedules based on member registrations)
    // 이미 해당 날짜에 ptSession이 있는 PT는 제외하여 중복 방지
    const weekStart = getWeekStart(currentWeek);
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + dayOfWeek);
    const targetDateStr = targetDate.toDateString();
    
    const existingPtIdsForDay = ptSessionsList
      .filter(session => new Date(session.scheduledDate).toDateString() === targetDateStr)
      .map(session => session.ptId);
    
    const ptRegistrationsAsSchedules = personalTrainingList
      .filter(pt => {
        // 활성 상태인 PT만 표시, 요일이 설정된 경우에만
        if (pt.status !== '활성') return false;
        const scheduledDays = pt.scheduledDays || [];
        if (scheduledDays.length === 0) return false;
        if (!scheduledDays.includes(currentDayKorean)) return false;
        // 이미 해당 날짜에 PT 세션이 있으면 제외 (중복 방지)
        if (existingPtIdsForDay.includes(pt.id)) return false;
        return true;
      })
      .map(pt => ({
        id: `pt-reg-${pt.id}`,
        title: `${getMemberName(pt.memberId)} PT`,
        description: `개인 레슨 - ${getMemberName(pt.memberId)} (잔여 ${pt.remainingSessions}회)`,
        instructorId: pt.instructorId,
        startTime: pt.preferredStartTime || "10:00",
        endTime: pt.preferredEndTime || calculateEndTime(pt.preferredStartTime || "10:00", "60분"),
        dayOfWeek: dayOfWeek,
        isRecurring: true,
        isActive: true,
        color: '#a855f7', // 보라색 - PT 정기 일정
        type: 'pt-registration',
        ptRegistrationId: pt.id,
        remainingSessions: pt.remainingSessions,
        totalSessions: pt.totalSessions
      }));
    
    return [...schedules, ...groupLessonsAsSchedules, ...consultationsAsSchedules, ...ptSessionsAsSchedules, ...ptRegistrationsAsSchedules];
  };

  const calculateEndTime = (startTime: string, duration: string): string => {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const durationInMinutes = parseInt(duration.replace(/[^\d]/g, '')) || 60;
      const totalMinutes = hours * 60 + minutes + durationInMinutes;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const normalizedHours = endHours % 24;
      
      return `${normalizedHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    } catch (error) {
      return startTime;
    }
  };

  const getInstructorName = (instructorId: number | null | undefined) => {
    if (!instructorId) return "";
    const instructor = staffList.find(staff => staff.id === instructorId);
    return instructor ? instructor.name : "";
  };

  const handleScheduleClick = (schedule: ExtendedSchedule) => {
    setSelectedSchedule(schedule);
  };

  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekDays = generateWeekDays();
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  const filterSchedules = (schedules: ExtendedSchedule[]) => {
    if (scheduleFilter === "all") return schedules;
    return schedules.filter(schedule => {
      switch (scheduleFilter) {
        case "consultation":
          return schedule.type === "consultation";
        case "personal":
          return schedule.type === "pt-session" || schedule.type === "pt-registration";
        case "group":
          return schedule.type === "group-lesson";
        case "schedule":
          return !schedule.type || schedule.type === "schedule";
        default:
          return true;
      }
    });
  };

  return (
    <div className="relative">
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">스케줄</h2>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap overflow-x-auto">
          <Button 
            variant={scheduleFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setScheduleFilter("all")}
            className={scheduleFilter === "all" ? "bg-[#114293] hover-elevate" : ""}
            data-testid="filter-all"
          >
            전체
          </Button>
          <Button 
            variant={scheduleFilter === "consultation" ? "default" : "outline"}
            size="sm"
            onClick={() => setScheduleFilter("consultation")}
            className={scheduleFilter === "consultation" ? "bg-amber-500 hover-elevate" : ""}
            data-testid="filter-consultation"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            상담
          </Button>
          <Button 
            variant={scheduleFilter === "personal" ? "default" : "outline"}
            size="sm"
            onClick={() => setScheduleFilter("personal")}
            className={scheduleFilter === "personal" ? "bg-purple-500 hover-elevate" : ""}
            data-testid="filter-personal"
          >
            <Dumbbell className="w-4 h-4 mr-1" />
            개인 레슨
          </Button>
          <Button 
            variant={scheduleFilter === "group" ? "default" : "outline"}
            size="sm"
            onClick={() => setScheduleFilter("group")}
            className={scheduleFilter === "group" ? "bg-emerald-500 hover-elevate" : ""}
            data-testid="filter-group"
          >
            <Users className="w-4 h-4 mr-1" />
            그룹 수업
          </Button>
          <Button 
            variant={scheduleFilter === "schedule" ? "default" : "outline"}
            size="sm"
            onClick={() => setScheduleFilter("schedule")}
            className={scheduleFilter === "schedule" ? "bg-blue-500 hover-elevate" : ""}
            data-testid="filter-schedule"
          >
            <Clock className="w-4 h-4 mr-1" />
            기타 일정
          </Button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-sm md:text-lg font-semibold whitespace-nowrap">{formatWeekRange()}</h3>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 md:px-4"
          >
            오늘
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white overflow-x-auto">
          <div className="grid grid-cols-8 border-b min-w-[700px]">
            <div className="p-2 md:p-4 text-center text-xs md:text-sm font-medium text-gray-600 border-r">시간</div>
            {weekDays.map((day, index) => {
              const today = new Date();
              const isToday = day.getDate() === today.getDate() && 
                              day.getMonth() === today.getMonth() && 
                              day.getFullYear() === today.getFullYear();
              return (
                <div key={index} className={`p-2 md:p-4 text-center border-r ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className={`text-xs md:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {dayNames[day.getDay()]}
                  </div>
                  <div className={`text-xs md:text-sm ${isToday ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            {timeSlots.map((time, timeIndex) => (
              <div key={time} className="grid grid-cols-8 border-b h-12 relative min-w-[700px]">
                <div className="p-1 md:p-2 text-xs md:text-sm text-gray-600 border-r flex items-center">
                  {time}
                </div>
                
                {weekDays.map((day, dayIndex) => {
                  const schedulesForHour = filterSchedules(getSchedulesForDay(day.getDay())).filter((schedule) => {
                    const scheduleHour = parseInt(schedule.startTime?.split(':')[0] || '0', 10);
                    return scheduleHour === timeIndex;
                  });
                  
                  const today = new Date();
                  const isToday = day.getDate() === today.getDate() && 
                                  day.getMonth() === today.getMonth() && 
                                  day.getFullYear() === today.getFullYear();
                  
                  return (
                    <div key={dayIndex} className={`border-r relative h-12 ${isToday ? 'bg-blue-50/50' : ''}`}>
                      {schedulesForHour.map((schedule) => {
                        const instructor = getInstructorName(schedule.instructorId);
                        const startHour = parseInt(schedule.startTime?.split(':')[0] || '0', 10);
                        const startMin = parseInt(schedule.startTime?.split(':')[1] || '0', 10);
                        const endHour = parseInt(schedule.endTime?.split(':')[0] || '0', 10);
                        const endMin = parseInt(schedule.endTime?.split(':')[1] || '0', 10);
                        const durationHours = (endHour + endMin / 60) - (startHour + startMin / 60);
                        const heightPx = Math.max(durationHours * 48, 24);
                        const topOffset = (startMin / 60) * 48;
                        
                        return (
                          <div
                            key={schedule.id}
                            className="absolute left-1 right-1 rounded px-2 py-1 text-xs cursor-pointer transition-opacity hover:opacity-80 overflow-hidden"
                            style={{
                              backgroundColor: schedule.color,
                              color: 'white',
                              zIndex: 10,
                              top: `${topOffset}px`,
                              height: `${heightPx}px`,
                            }}
                            onClick={() => handleScheduleClick(schedule)}
                          >
                            <div className="font-medium truncate">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                            <div className="truncate">{schedule.title}</div>
                            {instructor && (
                              <div className="truncate opacity-90">{instructor}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSchedule && (
        <div className="fixed inset-x-2 bottom-2 md:inset-x-auto md:right-4 md:top-4 md:bottom-4 md:w-80 bg-white border rounded-lg shadow-lg z-50 overflow-hidden max-h-[70vh] md:max-h-none">
          <div className="flex items-center justify-between p-3 md:p-4 border-b">
            <h3 className="font-semibold text-base md:text-lg truncate min-w-0">{selectedSchedule.title}</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedSchedule(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto">
            <div className="text-sm text-gray-600">
              {selectedSchedule.startTime} - {selectedSchedule.endTime}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {selectedSchedule.type === 'consultation' ? (
                  <MessageCircle className="w-4 h-4" />
                ) : selectedSchedule.type === 'group-lesson' ? (
                  <Users className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="font-medium">
                  {getInstructorName(selectedSchedule.instructorId) || '담당자 미정'} / {selectedSchedule.type === 'consultation' ? '상담' : selectedSchedule.type === 'group-lesson' ? '그룹 수업' : '일반 스케줄'}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {selectedSchedule.type === 'consultation' && (
                <>
                  <div className="text-sm">
                    <span className="text-gray-600">고객명</span>
                    <span className="text-gray-900 ml-2">{selectedSchedule.customerName}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">연락처</span>
                    <span className="text-gray-900 ml-2">{selectedSchedule.phone}</span>
                  </div>
                </>
              )}
              {selectedSchedule.type === 'group-lesson' && (
                <>
                  <div className="text-sm">
                    <span className="text-gray-600">참여 인원</span>
                    <span className="text-gray-900 ml-2">{selectedSchedule.participants} / {selectedSchedule.maxParticipants}명</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">수업 유형</span>
                    <span className="text-gray-900 ml-2">그룹 수업</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">{selectedSchedule.description}</div>
            </div>

            {typeof selectedSchedule.id === 'number' && (
              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(selectedSchedule)}
                  className="flex-1"
                  data-testid="button-edit-schedule"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(selectedSchedule)}
                  className="flex-1 text-red-600 hover:text-red-700"
                  data-testid="button-delete-schedule"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8">
        <Button
          className="bg-blue-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg hover-elevate"
          size="lg"
          onClick={() => { form.reset(); setShowCreateDialog(true); }}
          data-testid="button-create-schedule"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          <span className="text-sm md:text-base">일정 추가</span>
        </Button>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 일정 등록</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>일정명 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="일정명을 입력하세요"
                        data-testid="input-schedule-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="일정 설명"
                        data-testid="input-schedule-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>요일</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-schedule-day">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">일요일</SelectItem>
                          <SelectItem value="1">월요일</SelectItem>
                          <SelectItem value="2">화요일</SelectItem>
                          <SelectItem value="3">수요일</SelectItem>
                          <SelectItem value="4">목요일</SelectItem>
                          <SelectItem value="5">금요일</SelectItem>
                          <SelectItem value="6">토요일</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>담당자</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-schedule-instructor">
                            <SelectValue placeholder="담당자 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staffList.filter(staff => staff.id != null).map(staff => (
                            <SelectItem key={staff.id} value={String(staff.id)}>{staff.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                          data-testid="input-schedule-start-time"
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
                          data-testid="input-schedule-end-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>색상</FormLabel>
                    <FormControl>
                      <Input
                        type="color"
                        {...field}
                        className="h-10 w-full"
                        data-testid="input-schedule-color"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>취소</Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-500 hover-elevate"
                  data-testid="button-submit-schedule"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  등록
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>일정 수정</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>일정명 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-schedule-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-schedule-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>요일</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">일요일</SelectItem>
                          <SelectItem value="1">월요일</SelectItem>
                          <SelectItem value="2">화요일</SelectItem>
                          <SelectItem value="3">수요일</SelectItem>
                          <SelectItem value="4">목요일</SelectItem>
                          <SelectItem value="5">금요일</SelectItem>
                          <SelectItem value="6">토요일</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>담당자</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="담당자 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staffList.filter(staff => staff.id != null).map(staff => (
                            <SelectItem key={staff.id} value={String(staff.id)}>{staff.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>색상</FormLabel>
                    <FormControl>
                      <Input
                        type="color"
                        {...field}
                        className="h-10 w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); setEditingSchedule(null); }}>취소</Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-blue-500 hover-elevate"
                  data-testid="button-update-schedule"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  수정
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedSchedule?.title}" 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSchedule && typeof selectedSchedule.id === 'number' && deleteMutation.mutate(selectedSchedule.id)}
              className="bg-red-600 hover-elevate"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-schedule"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
