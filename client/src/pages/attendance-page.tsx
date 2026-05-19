import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, X, Plus, Loader2, LogIn, LogOut, Clock, Calendar, User, Dumbbell, Users, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneNumber } from "@/utils/input-sanitizer";
import type { Member, Staff, GroupLesson, Attendance, Consultation, PersonalTraining, PtSession } from '@shared/schema';

interface CalendarEvent {
  id: string;
  type: string;
  title: string;
  date: Date;
  time: string;
  member?: string;
  instructor?: string;
  status: string;
  category: string;
  details: any;
}

interface AttendancePageProps {
  selectedDate?: string;
  onDateSelect?: (date: string | undefined) => void;
  onMemberClick?: (memberId: number) => void;
}

export default function AttendancePage({ selectedDate, onDateSelect, onMemberClick }: AttendancePageProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateState, setSelectedDateState] = useState<string | undefined>(selectedDate);
  const [activeTab, setActiveTab] = useState('입출입');
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const { toast } = useToast();

  // 출석 등록 mutation (Check-in mutation)
  const checkInMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const now = new Date();
      await apiRequest("POST", "/api/attendance", {
        memberId,
        date: now.toISOString().split('T')[0],
        checkInTime: now.toISOString()
      });
    },
    onSuccess: () => {
      toast({ title: "입장 완료", description: "회원 입장이 등록되었습니다." });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      setShowCheckInDialog(false);
      setSelectedMemberId("");
    },
    onError: () => {
      toast({ title: "등록 실패", description: "입장 등록 중 오류가 발생했습니다.", variant: "destructive" });
    }
  });

  // 퇴장 등록 mutation (Check-out mutation)
  const checkOutMutation = useMutation({
    mutationFn: async (attendanceId: number) => {
      const now = new Date();
      await apiRequest("PUT", `/api/attendance/${attendanceId}`, {
        checkOutTime: now.toISOString()
      });
    },
    onSuccess: () => {
      toast({ title: "퇴장 완료", description: "회원 퇴장이 등록되었습니다." });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
    },
    onError: () => {
      toast({ title: "등록 실패", description: "퇴장 등록 중 오류가 발생했습니다.", variant: "destructive" });
    }
  });

  // PT 세션 상태 변경 mutation
  const updatePtSessionStatusMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: number; status: string }) => {
      await apiRequest("PUT", `/api/pt-sessions/${sessionId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pt-sessions'] });
      setShowDetailPanel(false);
      setSelectedEvent(null);
    },
    onError: () => {
      toast({ title: "상태 변경 실패", description: "상태 변경 중 오류가 발생했습니다.", variant: "destructive" });
    }
  });

  // 데이터베이스에서 각 탭의 일정 가져오기
  const { data: membersList = [] } = useQuery<Member[]>({
    queryKey: ['/api/members'],
    queryFn: () => fetch('/api/members').then(res => res.json())
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
    queryFn: () => fetch('/api/staff').then(res => res.json())
  });

  const { data: groupLessonsList = [] } = useQuery<GroupLesson[]>({
    queryKey: ['/api/group-lessons'],
    queryFn: () => fetch('/api/group-lessons').then(res => res.json())
  });

  const { data: personalTrainingList = [] } = useQuery<PersonalTraining[]>({
    queryKey: ['/api/personal-training'],
    queryFn: () => fetch('/api/personal-training').then(res => res.json())
  });

  const { data: ptSessionsList = [] } = useQuery<PtSession[]>({
    queryKey: ['/api/pt-sessions'],
    queryFn: () => fetch('/api/pt-sessions').then(res => res.json())
  });

  const { data: consultationsList = [] } = useQuery<Consultation[]>({
    queryKey: ['/api/consultations-direct'],
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

  const { data: attendanceList = [] } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance'],
    queryFn: () => fetch('/api/attendance').then(res => res.json())
  });

  // 특정 날짜의 일정 가져오기
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const targetDate = date.toDateString();
    const targetDayOfWeek = date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간을 00:00으로 설정하여 날짜만 비교
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    // 날짜 기반 상태 계산 함수
    const getDateBasedStatus = (originalStatus: string, isPastDate: boolean) => {
      if (isPastDate) {
        return '완료';
      }
      return originalStatus;
    };
    
    const isPastDate = eventDate < today;
    
    // 입출입 이벤트 (출석 기록)
    attendanceList.forEach(attendance => {
      const attendanceDate = new Date(attendance.date);
      if (attendanceDate.toDateString() === targetDate) {
        const member = membersList.find(m => m.id === attendance.memberId);
        const checkInTime = new Date(attendance.checkInTime);
        const time = checkInTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        
        // 출석 상태: 대기(기본), 출입(체크인 완료), 미출입(노쇼)
        let status = '대기';
        if (attendance.checkOutTime) {
          status = '출입';
        } else if (attendance.checkInTime) {
          status = '출입';
        }
        
        events.push({
          id: `attendance-${attendance.id}`,
          type: 'attendance',
          title: `${member?.name || '회원'} 출석`,
          date: attendanceDate,
          time: time,
          member: member?.name || '회원',
          status: status,
          category: '입출입',
          details: attendance
        });
      }
    });

    // 그룹 수업 이벤트 (요일 기반 + operatingDays 지원)
    const dayKoreanMapping = ['일', '월', '화', '수', '목', '금', '토'];
    const currentDayKorean = dayKoreanMapping[targetDayOfWeek];
    
    groupLessonsList.forEach(groupLesson => {
      // operatingDays가 있으면 그것을 우선 사용, 없으면 dayOfWeek 사용
      const operatingDays = groupLesson.operatingDays || [];
      let matchesDay = false;
      
      if (operatingDays.length > 0) {
        matchesDay = operatingDays.includes(currentDayKorean);
      } else {
        // dayOfWeek 값 변환: 1=월요일, 2=화요일, ..., 7=일요일 → 0=일요일, 1=월요일, ..., 6=토요일
        const lessonDayOfWeek = groupLesson.dayOfWeek === 7 ? 0 : groupLesson.dayOfWeek;
        matchesDay = lessonDayOfWeek === targetDayOfWeek;
      }
      
      if (matchesDay) {
        const instructor = staffList.find(s => s.id === groupLesson.instructorId);
        const instructorName = instructor ? (instructor.status === '퇴사' ? '-' : instructor.name) : (groupLesson.instructor || '강사 미정');
        
        // 그룹 수업 상태: 대기(기본), 참여, 미참
        const finalStatus = '대기';
        
        events.push({
          id: `group-lesson-${groupLesson.id}`,
          type: 'group-lesson',
          title: groupLesson.name,
          date: date,
          time: groupLesson.startTime || groupLesson.time || '시간 미정',
          instructor: instructorName,
          status: finalStatus,
          category: '그룹 수업',
          details: groupLesson
        });
      }
    });

    // 개인 레슨 이벤트 (PT 세션)
    ptSessionsList.forEach(session => {
      const sessionDate = new Date(session.scheduledDate);
      if (sessionDate.toDateString() === targetDate) {
        const pt = personalTrainingList.find(p => p.id === session.ptId);
        const member = pt ? membersList.find(m => m.id === pt.memberId) : null;
        const instructor = staffList.find(s => s.id === session.instructorId);
        const instructorName = instructor ? (instructor.status === '퇴사' ? '-' : instructor.name) : '강사 미정';
        const sessionTime = sessionDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // 개인 레슨 상태: 대기(기본), 참여, 미참
        const finalStatus = session.status === '완료' ? '참여' : session.status === '노쇼' ? '미참' : '대기';
        
        events.push({
          id: `pt-session-${session.id}`,
          type: 'personal-training',
          title: `${member?.name || '회원'} PT`,
          date: sessionDate,
          time: sessionTime,
          member: member?.name || '회원',
          instructor: instructorName,
          status: finalStatus,
          category: '개인 레슨',
          details: session
        });
      }
    });
    
    // 🏋️ PT 정기 일정 이벤트 (scheduledDays 기반)
    // 이미 해당 날짜에 ptSession이 있는 PT는 제외하여 중복 방지
    const existingPtIdsForDate = ptSessionsList
      .filter(session => new Date(session.scheduledDate).toDateString() === targetDate)
      .map(session => session.ptId);
    
    personalTrainingList.forEach(pt => {
      // 활성 상태이고 요일이 설정된 PT만 표시
      if (pt.status !== '활성') return;
      const scheduledDays = pt.scheduledDays || [];
      if (scheduledDays.length === 0) return;
      if (!scheduledDays.includes(currentDayKorean)) return;
      
      // 이미 해당 날짜에 PT 세션이 있으면 정기 일정 추가 안함 (중복 방지)
      if (existingPtIdsForDate.includes(pt.id)) return;
      
      const member = membersList.find(m => m.id === pt.memberId);
      const instructor = staffList.find(s => s.id === pt.instructorId);
      const instructorName = instructor ? (instructor.status === '퇴사' ? '-' : instructor.name) : '강사 미정';
      
      // 개인 레슨 상태: 대기(기본), 참여, 미참
      const finalStatus = '대기';
      
      events.push({
        id: `pt-reg-${pt.id}-${targetDate}`,
        type: 'personal-training',
        title: `${member?.name || '회원'} PT`,
        date: date,
        time: pt.preferredStartTime || '시간 미정',
        member: member?.name || '회원',
        instructor: instructorName,
        status: finalStatus,
        category: '개인 레슨',
        details: { ...pt, isRecurring: true, remainingSessions: pt.remainingSessions }
      });
    });

    // 상담 이벤트
    consultationsList.forEach(consultation => {
      const consultationDate = new Date(consultation.consultationDate);
      if (consultationDate.toDateString() === targetDate) {
        // 날짜 기반 상태 계산
        const baseStatus = consultation.status || '예약';
        const finalStatus = getDateBasedStatus(baseStatus, isPastDate);
        
        events.push({
          id: `consultation-${consultation.id}`,
          type: 'consultation',
          title: `${consultation.customerName} 상담`,
          date: consultationDate,
          time: consultationDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          member: consultation.customerName,
          status: finalStatus,
          category: '상담',
          details: consultation
        });
      }
    });

    return events.sort((a, b) => a.time.localeCompare(b.time));
  };

  // 정확한 날짜 선택 핸들러
  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    setSelectedDateState(dateStr);
    onDateSelect?.(dateStr);
  };

  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDayDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDayDate));
      currentDayDate.setDate(currentDayDate.getDate() + 1);
    }
    
    return days;
  };

  // 월 네비게이션
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const calendarDays = generateCalendarDays();
  const selectedDateObj = selectedDateState ? new Date(selectedDateState + 'T00:00:00') : null;

  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatMonthYear = (date: Date) => {
    return `${date.getFullYear()}년 ${(date.getMonth() + 1).toString().padStart(2, '0')}월`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">출석</h2>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          <TabsTrigger value="입출입" className="data-[state=active]:bg-white text-xs md:text-sm whitespace-nowrap">입출입</TabsTrigger>
          <TabsTrigger value="개인 레슨" className="data-[state=active]:bg-white text-xs md:text-sm whitespace-nowrap">개인 레슨</TabsTrigger>
          <TabsTrigger value="그룹 수업" className="data-[state=active]:bg-white text-xs md:text-sm whitespace-nowrap">그룹 수업</TabsTrigger>
          <TabsTrigger value="상담" className="data-[state=active]:bg-white text-xs md:text-sm whitespace-nowrap">상담</TabsTrigger>
        </TabsList>

        {/* 입출입 Tab */}
        <TabsContent value="입출입" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Side - Details */}
            <div className="lg:col-span-1">
              <Card className="border rounded-lg overflow-hidden">
                <CardContent className="p-0">
                  {selectedDateState ? (
                    <>
                      {/* 날짜 헤더 (Date Header) */}
                      <div className="bg-[#114293] text-white p-4">
                        <div className="text-lg font-bold">
                          {selectedDateObj && `${selectedDateObj.getMonth() + 1}월 ${selectedDateObj.getDate()}일`}
                        </div>
                        <div className="text-sm opacity-90 mt-1">
                          {selectedDateObj && (() => {
                            const events = getEventsForDate(selectedDateObj).filter(e => e.type === 'attendance');
                            return `${events.length}건의 입출입 기록`;
                          })()}
                        </div>
                      </div>
                      
                      {/* 일정 목록 (Event List) */}
                      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {selectedDateObj && (() => {
                          const events = getEventsForDate(selectedDateObj).filter(e => e.type === 'attendance');
                          return events.length > 0 ? events.map((event, index) => (
                            <div 
                              key={index} 
                              className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover-elevate"
                              onDoubleClick={() => {
                                setSelectedEvent(event);
                                setShowDetailPanel(true);
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{event.title}</div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  event.status === '대기' ? 'bg-yellow-100 text-yellow-700' : 
                                  event.status === '출입' ? 'bg-green-100 text-green-700' :
                                  event.status === '미출입' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                {event.time}
                                <span className="text-gray-300">|</span>
                                {event.member}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">더블클릭하여 상세보기</p>
                            </div>
                          )) : (
                            <div className="py-8 text-center">
                              <div className="text-gray-400 mb-2">
                                <Calendar className="w-10 h-10 mx-auto opacity-50" />
                              </div>
                              <p className="text-gray-500 text-sm">입출입 기록이 없습니다</p>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <Calendar className="w-10 h-10 mx-auto opacity-50" />
                      </div>
                      <p className="text-gray-500 text-sm">날짜를 선택하세요</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Calendar */}
            <div className="lg:col-span-3">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <h3 className="text-lg font-semibold">
                  {formatMonthYear(currentDate)}
                </h3>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div 
                    key={day} 
                    className={`p-2 text-center text-sm font-medium ${
                      index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  const isSelected = selectedDateState === dateStr;
                  const dayOfWeek = date.getDay();
                  
                  return (
                    <Card
                      key={index}
                      className={`h-16 md:h-32 cursor-pointer transition-all hover:shadow-sm border ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${!isCurrentMonth(date) ? 'opacity-50' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      <CardContent className="p-1 md:p-2 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-1 md:mb-2">
                          <span
                            className={`text-xs md:text-sm font-medium ${
                              isToday(date) ? 'bg-blue-500 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs' :
                              dayOfWeek === 0 ? 'text-red-500' :
                              dayOfWeek === 6 ? 'text-blue-500' :
                              'text-gray-900'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>

                        <div className="flex-1 space-y-1 overflow-hidden">
                          {getEventsForDate(date).filter(e => e.type === 'attendance').length > 0 && (
                            <div className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded whitespace-nowrap truncate">
                              입출입 {getEventsForDate(date).filter(e => e.type === 'attendance').length}건
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 개인 레슨 Tab */}
        <TabsContent value="개인 레슨" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Side - Details */}
            <div className="lg:col-span-1">
              <Card className="border rounded-lg overflow-hidden">
                <CardContent className="p-0">
                  {selectedDateState ? (
                    <>
                      {/* 날짜 헤더 (Date Header) */}
                      <div className="bg-purple-600 text-white p-4">
                        <div className="text-lg font-bold">
                          {selectedDateObj && `${selectedDateObj.getMonth() + 1}월 ${selectedDateObj.getDate()}일`}
                        </div>
                        <div className="text-sm opacity-90 mt-1">
                          {selectedDateObj && (() => {
                            const events = getEventsForDate(selectedDateObj).filter(e => e.type === 'personal-training');
                            return `${events.length}건의 개인 레슨`;
                          })()}
                        </div>
                      </div>
                      
                      {/* 일정 목록 (Event List) */}
                      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {selectedDateObj && (() => {
                          const events = getEventsForDate(selectedDateObj).filter(e => e.type === 'personal-training');
                          return events.length > 0 ? events.map((event, index) => (
                            <div 
                              key={index} 
                              className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover-elevate"
                              onDoubleClick={() => {
                                setSelectedEvent(event);
                                setShowDetailPanel(true);
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{event.title}</div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  event.status === '대기' ? 'bg-yellow-100 text-yellow-700' : 
                                  event.status === '참여' ? 'bg-green-100 text-green-700' :
                                  event.status === '미참' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                {event.time}
                                <span className="text-gray-300">|</span>
                                {event.member}
                                {event.instructor && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    {event.instructor}
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">더블클릭하여 상세보기</p>
                            </div>
                          )) : (
                            <div className="py-8 text-center">
                              <div className="text-gray-400 mb-2">
                                <Calendar className="w-10 h-10 mx-auto opacity-50" />
                              </div>
                              <p className="text-gray-500 text-sm">개인 레슨이 없습니다</p>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <Calendar className="w-10 h-10 mx-auto opacity-50" />
                      </div>
                      <p className="text-gray-500 text-sm">날짜를 선택하세요</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Calendar */}
            <div className="lg:col-span-3">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <h3 className="text-lg font-semibold">
                  {formatMonthYear(currentDate)}
                </h3>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div 
                    key={day} 
                    className={`p-2 text-center text-sm font-medium ${
                      index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  const isSelected = selectedDateState === dateStr;
                  const dayOfWeek = date.getDay();
                  
                  return (
                    <Card 
                      key={index}
                      className={`h-16 md:h-28 cursor-pointer transition-all hover:shadow-sm border ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${!isCurrentMonth(date) ? 'opacity-50' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      <CardContent className="p-1 md:p-2 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-1 md:mb-2">
                          <span
                            className={`text-xs md:text-sm font-medium ${
                              isToday(date) ? 'bg-blue-500 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs' :
                              dayOfWeek === 0 ? 'text-red-500' :
                              dayOfWeek === 6 ? 'text-blue-500' :
                              'text-gray-900'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>

                        <div className="flex-1 space-y-1 overflow-hidden">
                          {getEventsForDate(date).filter(e => e.type === 'personal-training').length > 0 && (
                            <div className="text-[10px] md:text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded whitespace-nowrap truncate">
                              개인 {getEventsForDate(date).filter(e => e.type === 'personal-training').length}건
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 그룹 수업 Tab */}
        <TabsContent value="그룹 수업" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Side - Details */}
            <div className="lg:col-span-1">
              <Card className="border rounded-lg overflow-hidden">
                <CardContent className="p-0">
                  {selectedDateState ? (
                    <>
                      {/* 날짜 헤더 (Date Header) */}
                      <div className="bg-emerald-600 text-white p-4">
                        <div className="text-lg font-bold">
                          {selectedDateObj && `${selectedDateObj.getMonth() + 1}월 ${selectedDateObj.getDate()}일`}
                        </div>
                        <div className="text-sm opacity-90 mt-1">
                          {selectedDateObj && (() => {
                            const events = getEventsForDate(selectedDateObj).filter(e => e.type === 'group-lesson');
                            return `${events.length}건의 그룹 수업`;
                          })()}
                        </div>
                      </div>
                      
                      {/* 일정 목록 (Event List) */}
                      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {selectedDateObj && (() => {
                          const events = getEventsForDate(selectedDateObj).filter(e => e.type === 'group-lesson');
                          return events.length > 0 ? events.map((event, index) => (
                            <div 
                              key={index} 
                              className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover-elevate"
                              onDoubleClick={() => {
                                setSelectedEvent(event);
                                setShowDetailPanel(true);
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{event.title}</div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  event.status === '대기' ? 'bg-yellow-100 text-yellow-700' : 
                                  event.status === '참여' ? 'bg-green-100 text-green-700' :
                                  event.status === '미참' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                {event.time}
                                {event.instructor && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    {event.instructor}
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">더블클릭하여 상세보기</p>
                            </div>
                          )) : (
                            <div className="py-8 text-center">
                              <div className="text-gray-400 mb-2">
                                <Calendar className="w-10 h-10 mx-auto opacity-50" />
                              </div>
                              <p className="text-gray-500 text-sm">그룹 수업이 없습니다</p>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <Calendar className="w-10 h-10 mx-auto opacity-50" />
                      </div>
                      <p className="text-gray-500 text-sm">날짜를 선택하세요</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Calendar */}
            <div className="lg:col-span-3">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <h3 className="text-lg font-semibold">
                  {formatMonthYear(currentDate)}
                </h3>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div 
                    key={day} 
                    className={`p-2 text-center text-sm font-medium ${
                      index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  const isSelected = selectedDateState === dateStr;
                  const dayOfWeek = date.getDay();
                  
                  return (
                    <Card 
                      key={index}
                      className={`h-16 md:h-28 cursor-pointer transition-all hover:shadow-sm border ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${!isCurrentMonth(date) ? 'opacity-50' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      <CardContent className="p-1 md:p-2 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-1 md:mb-2">
                          <span
                            className={`text-xs md:text-sm font-medium ${
                              isToday(date) ? 'bg-blue-500 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs' :
                              dayOfWeek === 0 ? 'text-red-500' :
                              dayOfWeek === 6 ? 'text-blue-500' :
                              'text-gray-900'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>

                        <div className="flex-1 space-y-1 overflow-hidden">
                          {getEventsForDate(date).filter(e => e.type === 'group-lesson').length > 0 && (
                            <div className="text-[10px] md:text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded whitespace-nowrap truncate">
                              그룹 {getEventsForDate(date).filter(e => e.type === 'group-lesson').length}건
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 상담 Tab */}
        <TabsContent value="상담" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Side - Details */}
            <div className="lg:col-span-1">
              <Card className="border rounded-lg overflow-hidden">
                <CardContent className="p-0">
                  {selectedDateState ? (
                    <>
                      {/* 날짜 헤더 (Date Header) */}
                      <div className="bg-amber-500 text-white p-4">
                        <div className="text-lg font-bold">
                          {selectedDateObj && `${selectedDateObj.getMonth() + 1}월 ${selectedDateObj.getDate()}일`}
                        </div>
                        <div className="text-sm opacity-90 mt-1">
                          {selectedDateObj && (() => {
                            const events = getEventsForDate(selectedDateObj).filter(e => e.type === 'consultation');
                            return `${events.length}건의 상담`;
                          })()}
                        </div>
                      </div>
                      
                      {/* 일정 목록 (Event List) */}
                      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {selectedDateObj && (() => {
                          const events = getEventsForDate(selectedDateObj).filter(e => e.type === 'consultation');
                          return events.length > 0 ? events.map((event, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{event.title}</div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  event.status === '예약' ? 'bg-blue-100 text-blue-700' : 
                                  event.status === '완료' ? 'bg-green-100 text-green-700' :
                                  event.status === '취소' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                {event.time}
                                <span className="text-gray-300">|</span>
                                {event.member}
                              </div>
                            </div>
                          )) : (
                            <div className="py-8 text-center">
                              <div className="text-gray-400 mb-2">
                                <Calendar className="w-10 h-10 mx-auto opacity-50" />
                              </div>
                              <p className="text-gray-500 text-sm">상담 일정이 없습니다</p>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <Calendar className="w-10 h-10 mx-auto opacity-50" />
                      </div>
                      <p className="text-gray-500 text-sm">날짜를 선택하세요</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Calendar */}
            <div className="lg:col-span-3">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <h3 className="text-lg font-semibold">
                  {formatMonthYear(currentDate)}
                </h3>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div 
                    key={day} 
                    className={`p-2 text-center text-sm font-medium ${
                      index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  const isSelected = selectedDateState === dateStr;
                  const dayOfWeek = date.getDay();
                  
                  return (
                    <Card 
                      key={index}
                      className={`h-16 md:h-28 cursor-pointer transition-all hover:shadow-sm border ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${!isCurrentMonth(date) ? 'opacity-50' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      <CardContent className="p-1 md:p-2 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-1 md:mb-2">
                          <span
                            className={`text-xs md:text-sm font-medium ${
                              isToday(date) ? 'bg-blue-500 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs' :
                              dayOfWeek === 0 ? 'text-red-500' :
                              dayOfWeek === 6 ? 'text-blue-500' :
                              'text-gray-900'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>

                        <div className="flex-1 space-y-1 overflow-hidden">
                          {getEventsForDate(date).filter(e => e.type === 'consultation').length > 0 && (
                            <div className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded whitespace-nowrap truncate">
                              상담 {getEventsForDate(date).filter(e => e.type === 'consultation').length}건
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 입장 등록 버튼 - 입출입 탭에서만 표시 (Check-in button - only show in access tab) */}
      {activeTab === '입출입' && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8">
          <Button
            className="bg-blue-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg hover-elevate"
            size="lg"
            onClick={() => setShowCheckInDialog(true)}
            data-testid="button-check-in"
          >
            <LogIn className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            <span className="text-sm md:text-base">입장 등록</span>
          </Button>
        </div>
      )}

      {/* 입장 등록 다이얼로그 (Check-in dialog) */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="max-w-md" aria-describedby="checkin-dialog-description">
          <DialogHeader>
            <DialogTitle>회원 입장 등록</DialogTitle>
            <DialogDescription id="checkin-dialog-description" className="sr-only">
              회원의 입장을 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>회원 선택 *</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger data-testid="select-member-checkin">
                  <SelectValue placeholder="회원을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {membersList.filter(member => member.id != null).map(member => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.name} ({formatPhoneNumber(member.phone)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => { setShowCheckInDialog(false); setSelectedMemberId(""); }}>
                취소
              </Button>
              <Button
                onClick={() => selectedMemberId && checkInMutation.mutate(parseInt(selectedMemberId))}
                disabled={!selectedMemberId || checkInMutation.isPending}
                className="bg-blue-500 hover-elevate"
                data-testid="button-confirm-checkin"
              >
                {checkInMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                입장 등록
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 상세 패널 (Detail Panel - Slide from right) */}
      <AnimatePresence>
        {showDetailPanel && selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => {
                setShowDetailPanel(false);
                setSelectedEvent(null);
              }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-4 md:p-6">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedEvent.type === 'attendance' ? 'bg-blue-100' :
                      selectedEvent.type === 'personal-training' ? 'bg-purple-100' :
                      selectedEvent.type === 'group-lesson' ? 'bg-green-100' :
                      'bg-gray-100'
                    }`}>
                      {selectedEvent.type === 'attendance' && <LogIn className={`w-5 h-5 text-blue-600`} />}
                      {selectedEvent.type === 'personal-training' && <Dumbbell className={`w-5 h-5 text-purple-600`} />}
                      {selectedEvent.type === 'group-lesson' && <Users className={`w-5 h-5 text-green-600`} />}
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-900">{selectedEvent.title}</h2>
                      <p className="text-sm text-gray-500">{selectedEvent.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailPanel(false);
                      setSelectedEvent(null);
                    }}
                    className="p-2 rounded-lg hover-elevate"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* 상태 뱃지 */}
                <div className="mb-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEvent.status === '대기' ? 'bg-yellow-100 text-yellow-700' :
                    selectedEvent.status === '출입' || selectedEvent.status === '참여' ? 'bg-green-100 text-green-700' :
                    selectedEvent.status === '미출입' || selectedEvent.status === '미참' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>

                {/* 상세 정보 */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">시간</p>
                      <p className="font-medium text-gray-900">{selectedEvent.time}</p>
                    </div>
                  </div>
                  {selectedEvent.member && (
                    <div
                      className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover-elevate ${onMemberClick && selectedEvent.details?.memberId ? "cursor-pointer group" : ""}`}
                      onClick={() => {
                        const memberId = selectedEvent.details?.memberId;
                        if (onMemberClick && memberId) {
                          onMemberClick(memberId);
                        }
                      }}
                    >
                      <User className={`w-5 h-5 ${onMemberClick && selectedEvent.details?.memberId ? "text-blue-400 group-hover:text-blue-600" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">회원</p>
                        <p className={`font-medium ${onMemberClick && selectedEvent.details?.memberId ? "text-blue-700 group-hover:underline" : "text-gray-900"}`}>{selectedEvent.member}</p>
                      </div>
                      {onMemberClick && selectedEvent.details?.memberId && (
                        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">상세보기 →</span>
                      )}
                    </div>
                  )}
                  {selectedEvent.instructor && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">강사</p>
                        <p className="font-medium text-gray-900">{selectedEvent.instructor}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">날짜</p>
                      <p className="font-medium text-gray-900">
                        {selectedEvent.date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 상태 변경 버튼 */}
                <div className="border-t pt-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">상태 변경</p>
                  <div className="flex gap-3">
                    {selectedEvent.type === 'attendance' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={selectedEvent.status === '출입'}
                          onClick={() => {
                            const attendanceId = selectedEvent.details?.id;
                            if (attendanceId) {
                              checkOutMutation.mutate(attendanceId);
                              toast({ title: "출입 처리", description: `${selectedEvent.member}님의 출입이 확인되었습니다.` });
                            }
                            setShowDetailPanel(false);
                            setSelectedEvent(null);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          출입
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={selectedEvent.status === '미출입'}
                          onClick={() => {
                            toast({ title: "미출입 처리", description: `${selectedEvent.member}님이 미출입 처리되었습니다.`, variant: "destructive" });
                            setShowDetailPanel(false);
                            setSelectedEvent(null);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          미출입
                        </Button>
                      </>
                    )}
                    {selectedEvent.type === 'personal-training' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={selectedEvent.status === '참여' || updatePtSessionStatusMutation.isPending}
                          onClick={() => {
                            const sessionId = selectedEvent.details?.id;
                            if (sessionId && !selectedEvent.details?.isRecurring) {
                              updatePtSessionStatusMutation.mutate({ sessionId, status: '완료' });
                              toast({ title: "참여 처리", description: `${selectedEvent.title}의 참여가 확인되었습니다.` });
                            } else {
                              toast({ title: "정기 일정", description: "정기 일정은 개별 세션으로 등록 후 상태를 변경할 수 있습니다." });
                              setShowDetailPanel(false);
                              setSelectedEvent(null);
                            }
                          }}
                        >
                          {updatePtSessionStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {!updatePtSessionStatusMutation.isPending && <CheckCircle className="w-4 h-4 mr-2" />}
                          참여
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={selectedEvent.status === '미참' || updatePtSessionStatusMutation.isPending}
                          onClick={() => {
                            const sessionId = selectedEvent.details?.id;
                            if (sessionId && !selectedEvent.details?.isRecurring) {
                              updatePtSessionStatusMutation.mutate({ sessionId, status: '노쇼' });
                              toast({ title: "미참 처리", description: `${selectedEvent.title}이(가) 미참 처리되었습니다.`, variant: "destructive" });
                            } else {
                              toast({ title: "정기 일정", description: "정기 일정은 개별 세션으로 등록 후 상태를 변경할 수 있습니다." });
                              setShowDetailPanel(false);
                              setSelectedEvent(null);
                            }
                          }}
                        >
                          {updatePtSessionStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {!updatePtSessionStatusMutation.isPending && <XCircle className="w-4 h-4 mr-2" />}
                          미참
                        </Button>
                      </>
                    )}
                    {selectedEvent.type === 'group-lesson' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={selectedEvent.status === '참여'}
                          onClick={() => {
                            toast({ title: "참여 처리", description: `${selectedEvent.title}의 참여가 확인되었습니다.` });
                            setShowDetailPanel(false);
                            setSelectedEvent(null);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          참여
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={selectedEvent.status === '미참'}
                          onClick={() => {
                            toast({ title: "미참 처리", description: `${selectedEvent.title}이(가) 미참 처리되었습니다.`, variant: "destructive" });
                            setShowDetailPanel(false);
                            setSelectedEvent(null);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          미참
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}