// 🏠 메인 홈페이지 (Main Homepage)
// 🎯 Purpose: 체육관 관리 시스템의 중앙 대시보드 및 네비게이션 허브 (Central dashboard and navigation hub for gym management system)
// 🔒 Security: 인증된 사용자만 접근 가능한 메인 관리 페이지 (Main management page accessible only to authenticated users)
// 📊 Features: 통합 메뉴, 프랜차이즈 정보, 회원/직원/상품 관리 (Integrated menu, franchise information, member/staff/product management)

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Member, Staff, Product, Locker, Attendance, GroupLesson, PersonalTraining, Consultation, OtApplication, Membership, PtSession } from "@shared/schema";
import { AppFooter } from "@/components/app-footer";
import MembersPage from "./members-page";
import MemberDeletePage from "./member-delete-page";
import StaffPage from "./staff-page";
import StaffDetailPage from "./staff-detail-page";
import ProductsPage from "./products-page";
import LockersPage from "./lockers-page";
import AttendancePage from "./attendance-page";
import SchedulesPage from "./schedules-page";
import OtApplicationPage from "./ot-application-page";
import PersonalTrainingPage from "./personal-training-page";
import GroupLessonsPage from "./group-lessons-page";
import ContractsPage from "./contracts-page";
import ContractCreatePage from "./contract-create-page";
import ConsultationsPage from "./consultations-page";
import OtherSalesPage from "./other-sales-page";
import StatisticsPage from "./statistics-page";
import AiInsightsPage from "./ai-insights-page";
import SuperadminPage from "./superadmin-page";
import StaffRegistrationPage from "./staff-registration-page";
import HelpPage from "./help-page";
import UsageGuidePage from "./usage-guide-page";
import { Chatbot } from "@/components/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { 
  Building2, 
  Users, 
  UserCircle,
  RotateCcw, 
  UserPlus, 
  DollarSign, 
  Calendar, 
  Settings, 
  FileText,
  BarChart3,
  LogOut,
  Search,
  HelpCircle,
  Star,
  Plus,
  Edit3,
  Instagram,
  Globe,
  Smartphone,
  Wifi,
  MapPin,
  Clock,
  Car,
  Zap,
  Coffee,
  Dumbbell,
  Music,
  Shield,
  Camera,
  Home,
  Gamepad2,
  Headphones,
  Tv,
  Monitor,
  PlayCircle,
  Volume2,
  Activity,
  Lock,
  ShoppingBag,
  MessageCircle,
  BookOpen,
  ClipboardList,
  PieChart,
  Archive,
  ChevronDown,
  Eye,
  EyeOff,
  Heart,
  AlertCircle,
  UserCheck,
  X,
  Waves,
  Target,
  Bike,
  Accessibility,
  Baby,
  LayoutGrid,
  Pencil,
  Trash2,
  Brain,
  CreditCard,
  Menu
} from "lucide-react";

// 최근 활동 모달 컴포넌트 (Recent Activities Modal Component)
const RecentActivitiesModal = ({ onClose }: { onClose: () => void }) => {
  // 실제 데이터 조회 (Fetch real data)
  const { data: membersList = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: groupLessonsList = [] } = useQuery<GroupLesson[]>({
    queryKey: ["/api/group-lessons"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: consultationsList = [] } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
    staleTime: 5 * 60 * 1000,
  });

  // 최근 활동 생성 (Generate recent activities) - 전체 데이터에서 최신순 정렬 후 표시
  const recentActivities = [
    ...membersList.map((member: any) => ({
      type: "member",
      message: `${member.name}님이 등록되었습니다.`,
      timestamp: member.createdAt ? new Date(member.createdAt).getTime() : 0,
      time: member.createdAt ? new Date(member.createdAt).toLocaleString('ko-KR') : '-',
      icon: Users
    })),
    ...groupLessonsList.map((lesson: any) => ({
      type: "lesson",
      message: `${lesson.name} 그룹 수업이 추가되었습니다.`,
      timestamp: lesson.createdAt ? new Date(lesson.createdAt).getTime() : 0,
      time: lesson.createdAt ? new Date(lesson.createdAt).toLocaleString('ko-KR') : '-',
      icon: Calendar
    })),
    ...consultationsList.map((consultation: any) => ({
      type: "consultation",
      message: `새로운 상담이 등록되었습니다.`,
      timestamp: consultation.createdAt ? new Date(consultation.createdAt).getTime() : 0,
      time: consultation.createdAt ? new Date(consultation.createdAt).toLocaleString('ko-KR') : '-',
      icon: MessageCircle
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">최근 활동 내역</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover-elevate">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <activity.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.type === 'member' ? 'bg-blue-100 text-blue-800' :
                        activity.type === 'lesson' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {activity.type === 'member' ? '회원 관리' :
                         activity.type === 'lesson' ? '수업 관리' : '상담 관리'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">아직 활동 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">총 {recentActivities.length}개의 활동</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 커스텀 팝업 컴포넌트 (Custom popup component matching the provided design)
const CustomConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  cancelText = "돌아가기",
  confirmText = "앱 미노출" 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 블러 배경 (Blurred background) */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      
      {/* 팝업 컨테이너 (Popup container) */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* 제목 (Title) */}
        <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
          {title}
        </h3>
        
        {/* 메시지 (Message) */}
        <p className="text-sm text-gray-600 text-center mb-8 leading-relaxed">
          {message}
        </p>
        
        {/* 버튼들 (Buttons) */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover-elevate"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover-elevate"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // URL 기반 탭 설정 (URL-based tab configuration)
  const getTabFromUrl = (url: string): string => {
    const urlTabMap: { [key: string]: string } = {
      "/": "대시보드",
      "/dashboard": "대시보드",
      "/members": "회원",
      "/staff": "직원",
      "/products": "상품",
      "/lockers": "락커",
      "/attendance": "출석",
      "/schedules": "스케줄",
      "/ot-application": "OT 신청",
      "/personal-training": "개인 레슨",
      "/group-lessons": "그룹 수업",
      "/contracts": "계약서",
      "/consultations": "상담",
      "/other-sales": "기타 매출",
      "/statistics": "통계",
      "/center-info": "센터 정보",
      "/ai-insights": "AI 인사이트",
      "/superadmin": "프랜차이즈 관리"
    };
    return urlTabMap[url] || "대시보드";
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromUrl(location));
  const [memberSubTab, setMemberSubTab] = useState("회원 정보");
  const [memberDeleteTab, setMemberDeleteTab] = useState("활성 회원");
  const [refundSubTab, setRefundSubTab] = useState("환불 처리");
  const [selectedMemberId, setSelectedMemberId] = useState<number | undefined>(undefined);
  const [selectedStaffId, setSelectedStaffId] = useState<number | undefined>(undefined);
  const [menuTab, setMenuTab] = useState<"전체 메뉴" | "즐겨찾기">("전체 메뉴");
  const [favoriteMenus, setFavoriteMenus] = useState<string[]>([]);
  const [hiddenMenus, setHiddenMenus] = useState<string[]>([]);
  const [isMainMenuExpanded, setIsMainMenuExpanded] = useState(true); // 전체 메뉴 접기/펼치기 상태
  const [isHiddenMenuExpanded, setIsHiddenMenuExpanded] = useState(false); // 숨김 메뉴 접기/펼치기 상태
  const [isFavoriteMenuExpanded, setIsFavoriteMenuExpanded] = useState(true); // 즐겨찾기 메뉴 접기/펼치기 상태
  const [showStaffRegistration, setShowStaffRegistration] = useState(false);
  const [showContractCreate, setShowContractCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelpPage, setShowHelpPage] = useState(false);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState<number>(-1);
  const [showNoResults, setShowNoResults] = useState(false);
  const [showSearchMessage, setShowSearchMessage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string[]>([activeTab]);
  const [showRecentActivities, setShowRecentActivities] = useState(false);
  const [showLessonTypeModal, setShowLessonTypeModal] = useState(false);
  
  // 🎨 커스텀 팝업 상태 관리 (Custom popup state management)
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  // URL이 변경될 때 탭 업데이트 (Update tab when URL changes)
  useEffect(() => {
    const newTab = getTabFromUrl(location);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
      // Reset all sub-tabs and related states when changing main tabs
      setMemberSubTab("회원 정보");
      setMemberDeleteTab("활성 회원");
      setRefundSubTab("환불 처리");
      setSelectedMemberId(undefined);
      setSelectedStaffId(undefined);
      setShowStaffRegistration(false);
      setShowContractCreate(false);
    }
  }, [location, activeTab]);

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const tabUrlMap: Record<string, string> = useMemo(() => ({
    "대시보드": "/dashboard",
    "회원": "/members",
    "직원": "/staff",
    "상품": "/products",
    "락커": "/lockers",
    "출석": "/attendance",
    "스케줄": "/schedules",
    "OT 신청": "/ot-application",
    "개인 레슨": "/personal-training",
    "그룹 수업": "/group-lessons",
    "계약서": "/contracts",
    "상담": "/consultations",
    "기타 매출": "/other-sales",
    "통계": "/statistics",
    "센터 정보": "/center-info",
    "AI 인사이트": "/ai-insights",
    "프랜차이즈 관리": "/superadmin"
  }), []);

  const handleTabChange = useCallback((tabName: string) => {
    setActiveTab(tabName);
    setCurrentLocation([tabName]);
    // Reset all sub-tabs and related states when changing main tabs
    setMemberSubTab("회원 정보");
    setMemberDeleteTab("활성 회원");
    setRefundSubTab("환불 처리");
    setSelectedMemberId(undefined);
    setSelectedStaffId(undefined);
    setShowStaffRegistration(false);
    setShowContractCreate(false);
    setSidebarOpen(false); // 모바일 사이드바 닫기 (Close mobile sidebar)

    // URL 업데이트 (Update URL)
    const newUrl = tabUrlMap[tabName] || "/dashboard";
    if (location !== newUrl) {
      window.history.pushState({}, "", newUrl);
    }
  }, [location, tabUrlMap]);

  const toggleFavorite = (menuName: string) => {
    setFavoriteMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const toggleHidden = (menuName: string) => {
    setHiddenMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const menuItems = [
    { icon: Home, name: "대시보드", color: "text-gray-500" },
    { icon: Building2, name: "센터 정보", color: "text-gray-500" },
    { icon: Users, name: "회원", color: "text-gray-500" },
    { icon: UserCircle, name: "직원", color: "text-gray-500" },
    { icon: ShoppingBag, name: "상품", color: "text-gray-500" },
    { icon: Lock, name: "락커", color: "text-gray-500" },
    { icon: Clock, name: "출석", color: "text-gray-500" },
    { icon: Calendar, name: "스케줄", color: "text-gray-500" },
    { icon: Dumbbell, name: "OT 신청", color: "text-gray-500" },
    { icon: UserCircle, name: "개인 레슨", color: "text-gray-500" },
    { icon: Users, name: "그룹 수업", color: "text-gray-500" },
    { icon: FileText, name: "계약서", color: "text-gray-500" },
    { icon: MessageCircle, name: "상담", color: "text-gray-500" },
    { icon: DollarSign, name: "기타 매출", color: "text-gray-500" },
    { icon: BarChart3, name: "통계", color: "text-gray-500" },
    { icon: Brain, name: "AI 인사이트", color: "text-purple-500" },
    ...(user?.role === 'superadmin' ? [
      { icon: Shield, name: "프랜차이즈 관리", color: "text-red-500" },
    ] : []),
  ];

  // 검색 기능 (Search functionality)
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedSearchResult(-1);
    
    if (query.trim() === "") {
      setSearchResults([]);
      setShowSearchMessage(false);
      return;
    }

    const results = [];
    
    // 메뉴 검색 (Menu search)
    const menuResults = menuItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    
    results.push(...menuResults.map(item => ({
      type: "menu",
      title: item.name,
      description: `${item.name} 메뉴로 이동`,
      action: () => handleTabChange(item.name),
      icon: item.icon,
      path: item.name
    })));

    // 하위 탭 검색 (Sub-tab search)
    const subTabMap = {
      "회원 정보": { menu: "회원", subTab: "회원 정보", description: "회원 > 회원 정보" },
      "회원 삭제": { menu: "회원", subTab: "회원 삭제", description: "회원 > 회원 삭제" },
      "환불 처리": { menu: "회원", subTab: "환불 처리", description: "회원 > 환불 처리" },
      "수업 연장": { menu: "회원", subTab: "수업 연장", description: "회원 > 수업 연장" },
      "정지 기록": { menu: "회원", subTab: "정지 기록", description: "회원 > 정지 기록" },
      "수정 기록": { menu: "회원", subTab: "수정 기록", description: "회원 > 수정 기록" },
      "회원등록": { menu: "회원", subTab: "회원 정보", description: "회원 > 회원 정보에서 새 회원 등록" },
      "직원등록": { menu: "직원", subTab: null, description: "직원 > 새 직원 등록" },
      "상품등록": { menu: "상품", subTab: null, description: "상품 > 새 상품 등록" },
      "락커관리": { menu: "락커", subTab: null, description: "락커 > 락커 배정 및 관리" },
      "출석체크": { menu: "출석", subTab: null, description: "출석 > 회원 출석 관리" },
      "스케줄관리": { menu: "스케줄", subTab: null, description: "스케줄 > 센터 스케줄 관리" },
      "개인레슨": { menu: "개인 레슨", subTab: null, description: "개인 레슨 > 개인 레슨 관리" },
      "그룹수업": { menu: "그룹 수업", subTab: null, description: "그룹 수업 > 그룹 수업 관리" },
      "계약서": { menu: "계약서", subTab: null, description: "계약서 > 계약서 작성 및 관리" },
      "상담": { menu: "상담", subTab: null, description: "상담 > 상담 일정 및 기록" },
      "통계": { menu: "통계", subTab: null, description: "통계 > 센터 운영 통계" }
    };

    Object.entries(subTabMap).forEach(([key, value]) => {
      if (key.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: "subtab",
          title: key,
          description: value.description,
          action: () => {
            handleTabChange(value.menu);
            if (value.subTab) {
              setMemberSubTab(value.subTab);
            }
          },
          icon: Search,
          path: value.description
        });
      }
    });

    setSearchResults(results);
    setShowSearchMessage(false);
  };

  // 키보드 네비게이션 처리 (Keyboard navigation)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        if (searchResults.length > 0) {
          e.preventDefault();
          setSelectedSearchResult(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        if (searchResults.length > 0) {
          e.preventDefault();
          setSelectedSearchResult(prev => prev > 0 ? prev - 1 : prev);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSearchResult >= 0) {
          // 선택된 검색 결과로 이동
          const result = searchResults[selectedSearchResult];
          result.action();
          setSearchQuery("");
          setSearchResults([]);
          setSelectedSearchResult(-1);
          setShowSearchMessage(false);
        } else if (searchResults.length > 0) {
          // 첫 번째 검색 결과로 이동
          const firstResult = searchResults[0];
          firstResult.action();
          setSearchQuery("");
          setSearchResults([]);
          setSelectedSearchResult(-1);
          setShowSearchMessage(false);
        } else if (searchQuery.trim() !== "") {
          // 검색 결과가 없을 때 '해당 결과가 없습니다' 표시
          setShowSearchMessage(true);
          setTimeout(() => setShowSearchMessage(false), 3000);
        }
        break;
      case 'Escape':
        setSearchQuery("");
        setSearchResults([]);
        setSelectedSearchResult(-1);
        setShowSearchMessage(false);
        break;
    }
  };

  // Center announcements from API - no sample data
  const centerData: any[] = [];

  // 도움말 페이지 표시 시 홈페이지 컨텐츠 숨기기
  if (showHelpPage) {
    return <HelpPage onBack={() => setShowHelpPage(false)} />;
  }
  
  // 사용법 가이드 페이지 표시 시 홈페이지 컨텐츠 숨기기
  if (showUsageGuide) {
    return <UsageGuidePage onBack={() => setShowUsageGuide(false)} />;
  }

  // Dashboard Content Component with Real Data
  const DashboardContent = () => {
    // 실제 데이터 조회 (Fetch real data)
    const { data: membersList = [] } = useQuery<Member[]>({
      queryKey: ["/api/members"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: staffList = [] } = useQuery<Staff[]>({
      queryKey: ["/api/staff"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: productsList = [] } = useQuery<Product[]>({
      queryKey: ["/api/products"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: attendanceList = [] } = useQuery<Attendance[]>({
      queryKey: ["/api/attendance"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: groupLessonsList = [] } = useQuery<GroupLesson[]>({
      queryKey: ["/api/group-lessons"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: personalTrainingList = [] } = useQuery<PersonalTraining[]>({
      queryKey: ["/api/personal-training"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: consultationsList = [] } = useQuery<Consultation[]>({
      queryKey: ["/api/consultations"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: lockersList = [] } = useQuery<Locker[]>({
      queryKey: ["/api/lockers"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: membershipsList = [] } = useQuery<Membership[]>({
      queryKey: ["/api/memberships"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: otApplicationsList = [] } = useQuery<OtApplication[]>({
      queryKey: ["/api/ot-applications"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: ptSessionsList = [] } = useQuery<PtSession[]>({
      queryKey: ["/api/pt-sessions"],
      staleTime: 5 * 60 * 1000,
    });

    // 통계 계산 (Statistics calculation)
    const totalMembers = membersList.length;
    const activeMembers = membersList.filter(member => member.status === "active").length;
    const totalStaff = staffList.filter(staff => staff.status !== "퇴사").length;
    const occupiedLockers = lockersList.filter(locker => locker.status === "occupied").length;
    
    // 이번 달 수익 계산 (Monthly revenue calculation)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = productsList.reduce((total, product) => {
      return total + (product.price || 0);
    }, 0);

    // 오늘 출석 (Today's attendance)
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceList.filter(attendance =>
      attendance.date && new Date(attendance.date).toISOString().split('T')[0] === today
    ).length;

    // 알림 계산 (Alert calculations)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const expiringMemberships = membershipsList.filter(m => {
      if (m.status !== "활성" || !m.endDate) return false;
      const end = new Date(m.endDate);
      return end >= new Date() && end <= sevenDaysLater;
    });
    const pendingOtList = otApplicationsList.filter(a => a.status === "대기");
    const todayPtSessions = ptSessionsList.filter(s => {
      if (s.status !== "예약" || !s.scheduledDate) return false;
      return new Date(s.scheduledDate).toISOString().split('T')[0] === today;
    });

    // 최근 활동 (Recent activities) - 전체 데이터에서 최신순 정렬 후 표시
    const recentActivities = [
      ...membersList.map(member => ({
        type: "member",
        message: `${member.name}님이 등록되었습니다.`,
        timestamp: member.createdAt ? new Date(member.createdAt).getTime() : 0,
        time: member.createdAt ? new Date(member.createdAt).toLocaleString('ko-KR') : '-',
        icon: Users
      })),
      ...groupLessonsList.map(lesson => ({
        type: "lesson",
        message: `${lesson.name} 그룹 수업이 추가되었습니다.`,
        timestamp: lesson.createdAt ? new Date(lesson.createdAt).getTime() : 0,
        time: lesson.createdAt ? new Date(lesson.createdAt).toLocaleString('ko-KR') : '-',
        icon: Calendar
      })),
      ...consultationsList.map(consultation => ({
        type: "consultation",
        message: `새로운 상담이 등록되었습니다.`,
        timestamp: consultation.createdAt ? new Date(consultation.createdAt).getTime() : 0,
        time: consultation.createdAt ? new Date(consultation.createdAt).toLocaleString('ko-KR') : '-',
        icon: MessageCircle
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    return (
      <div className="space-y-6">
        {/* 통계 카드 (Statistics Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange("회원")}>
            <CardAccentLine />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-600">전체 회원</p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums">{totalMembers}</p>
                  <p className="text-xs text-green-600 mt-1 tabular-nums">활성 회원: {activeMembers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange("직원")}>
            <CardAccentLine />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-600">직원 수</p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums">{totalStaff}</p>
                  <p className="text-xs text-blue-600 mt-1 tabular-nums">오늘 출석: {todayAttendance}</p>
                </div>
                <UserCircle className="h-8 w-8 text-purple-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange("상품")}>
            <CardAccentLine />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-600">등록 상품</p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums">{productsList.length}</p>
                  <p className="text-xs text-green-600 mt-1 tabular-nums">총 금액: ₩{monthlyRevenue.toLocaleString()}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange("락커")}>
            <CardAccentLine />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-600">락커 현황</p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums">{occupiedLockers}</p>
                  <p className="text-xs text-gray-600 mt-1 tabular-nums">전체: {lockersList.length}</p>
                </div>
                <Lock className="h-8 w-8 text-blue-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 주의 알림 (Alert notifications) - 조건부 표시 */}
        {(expiringMemberships.length > 0 || pendingOtList.length > 0 || todayPtSessions.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {expiringMemberships.length > 0 && (
              <div
                className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover-elevate"
                onClick={() => handleTabChange("회원")}
              >
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-800">만료 임박 회원</p>
                  <p className="text-xs text-amber-600 truncate">7일 이내 {expiringMemberships.length}건 만료 예정</p>
                </div>
                <span className="ml-auto text-lg font-bold text-amber-700 tabular-nums">{expiringMemberships.length}</span>
              </div>
            )}
            {pendingOtList.length > 0 && (
              <div
                className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover-elevate"
                onClick={() => handleTabChange("OT 신청")}
              >
                <UserCheck className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-blue-800">대기 중 OT 신청</p>
                  <p className="text-xs text-blue-600 truncate">승인 대기 {pendingOtList.length}건</p>
                </div>
                <span className="ml-auto text-lg font-bold text-blue-700 tabular-nums">{pendingOtList.length}</span>
              </div>
            )}
            {todayPtSessions.length > 0 && (
              <div
                className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover-elevate"
                onClick={() => handleTabChange("개인 레슨")}
              >
                <Activity className="w-5 h-5 text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-purple-800">오늘의 PT 세션</p>
                  <p className="text-xs text-purple-600 truncate">예약된 세션 {todayPtSessions.length}건</p>
                </div>
                <span className="ml-auto text-lg font-bold text-purple-700 tabular-nums">{todayPtSessions.length}</span>
              </div>
            )}
          </div>
        )}

        {/* 오늘의 활동 요약 (Today's Activity Summary) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">오늘의 활동</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0">
                    <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-blue-900">출석 현황</p>
                      <p className="text-sm text-blue-700">오늘 {todayAttendance}명 출석</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleTabChange("출석")}>
                    →
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Calendar className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-green-900">그룹 수업</p>
                      <p className="text-sm text-green-700">{groupLessonsList.length}개 수업 운영중</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleTabChange("그룹 수업")}>
                    →
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0">
                    <MessageCircle className="w-5 h-5 text-purple-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-purple-900">상담 현황</p>
                      <p className="text-sm text-purple-700">{consultationsList.length}건 상담 대기중</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleTabChange("상담")}>
                    →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 최근 활동 (Recent Activities) */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
                <Button variant="outline" size="sm" onClick={() => setShowRecentActivities(true)}>
                  <Clock className="w-4 h-4 mr-2" />
                  더보기
                </Button>
              </div>
              
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <activity.icon className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm">아직 활동 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 빠른 액션 (Quick Actions) */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => handleTabChange("회원")}>
                <UserPlus className="w-5 h-5" />
                <span className="text-sm">회원 등록</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setShowLessonTypeModal(true)}>
                <Calendar className="w-5 h-5" />
                <span className="text-sm">수업 추가</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => handleTabChange("상담")}>
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">상담 등록</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => handleTabChange("통계")}>
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm">통계 보기</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // 사이드바 콘텐츠 (Sidebar content — shared between desktop and mobile Sheet)
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">GL Pay</span>
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">PRO</span>
          </div>
        </div>

        {/* Center Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-800">(주)GL Pay 창업센터/2F</span>
          </div>
          
          {/* Tab Buttons */}
          <div className="flex rounded-lg bg-gray-100 p-1 gap-1">
            <button
              onClick={() => setMenuTab("전체 메뉴")}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                menuTab === "전체 메뉴"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              전체 메뉴
            </button>
            <button
              onClick={() => setMenuTab("즐겨찾기")}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                menuTab === "즐겨찾기"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              즐겨찾기
            </button>
          </div>
        </div>

        {/* Menu Items and Bottom Actions Container */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Menu Items */}
          <div className="overflow-y-auto px-3 py-2">
            {/* 전체 메뉴 탭 */}
            {menuTab === "전체 메뉴" && (
              <div>
                <button
                  onClick={() => setIsMainMenuExpanded(!isMainMenuExpanded)}
                  className="w-full flex items-center justify-between text-xs text-gray-500 mb-3 hover:text-gray-700 transition-colors"
                >
                  <span>전체 메뉴</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ease-in-out ${isMainMenuExpanded ? 'rotate-180' : ''}`} />
                </button>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  isMainMenuExpanded ? 'max-h-[1000px]' : 'max-h-0'
                }`}>
                  {menuItems
                    .filter(item => !hiddenMenus.includes(item.name))
                    .map((item) => (
                      <div key={item.name} className="group relative">
                        <button
                          onClick={() => handleTabChange(item.name)}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm rounded-md transition-colors mb-1 ${
                            activeTab === item.name 
                              ? "bg-gray-900 text-white" 
                              : "text-gray-700 hover-elevate"
                          }`}
                        >
                          <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.name ? "text-white" : item.color}`} />
                          <span className="flex-1">{item.name}</span>
                        </button>
                        
                        {/* Action Icons */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHidden(item.name);
                            }}
                            className="p-1 hover-elevate rounded"
                            title="숨기기"
                          >
                            <EyeOff className="w-3 h-3 text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.name);
                            }}
                            className="p-1 hover-elevate rounded"
                            title="즐겨찾기"
                          >
                            <Heart className={`w-3 h-3 ${favoriteMenus.includes(item.name) ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 즐겨찾기 탭 */}
            {menuTab === "즐겨찾기" && (
              <div>
                <button
                  onClick={() => setIsFavoriteMenuExpanded(!isFavoriteMenuExpanded)}
                  className="w-full flex items-center justify-between text-xs text-gray-500 mb-3 hover:text-gray-700 transition-colors"
                >
                  <span>즐겨찾기</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ease-in-out ${isFavoriteMenuExpanded ? 'rotate-180' : ''}`} />
                </button>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  isFavoriteMenuExpanded ? 'max-h-[1000px]' : 'max-h-0'
                }`}>
                  {favoriteMenus.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-8">
                      즐겨찾기 메뉴가 없습니다
                    </div>
                  ) : (
                    menuItems
                      .filter(item => favoriteMenus.includes(item.name))
                      .map((item) => (
                        <div key={item.name} className="group relative">
                          <button
                            onClick={() => handleTabChange(item.name)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm rounded-md transition-colors mb-1 ${
                              activeTab === item.name 
                                ? "bg-gray-900 text-white" 
                                : "text-gray-700 hover-elevate"
                            }`}
                          >
                            <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.name ? "text-white" : item.color}`} />
                            <span className="flex-1">{item.name}</span>
                          </button>
                          
                          {/* Remove from favorites icon */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.name);
                              }}
                              className="p-1 hover-elevate rounded"
                              title="즐겨찾기 해제"
                            >
                              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* 숨김 메뉴 섹션 */}
            {hiddenMenus.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsHiddenMenuExpanded(!isHiddenMenuExpanded)}
                  className="w-full flex items-center justify-between text-xs text-gray-500 mb-3 hover:text-gray-700 transition-colors"
                >
                  <span>숨김 메뉴</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ease-in-out ${isHiddenMenuExpanded ? 'rotate-180' : ''}`} />
                </button>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  isHiddenMenuExpanded ? 'max-h-[1000px]' : 'max-h-0'
                }`}>
                  {menuItems
                    .filter(item => hiddenMenus.includes(item.name))
                    .map((item) => (
                      <div key={item.name} className="group relative">
                        <button
                          onClick={() => {
                            setActiveTab(item.name);
                            if (item.name === "회원") {
                              setSelectedMemberId(undefined);
                            }
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm rounded-md transition-colors mb-1 opacity-60 ${
                            activeTab === item.name 
                              ? "bg-gray-900 text-white" 
                              : "text-gray-500 hover-elevate"
                          }`}
                        >
                          <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.name ? "text-white" : "text-gray-400"}`} />
                          <span className="flex-1">{item.name}</span>
                        </button>
                        
                        {/* Show/Unhide Icons */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHidden(item.name);
                            }}
                            className="p-1 hover-elevate rounded"
                            title="다시 보이기"
                          >
                            <Eye className="w-3 h-3 text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.name);
                            }}
                            className="p-1 hover-elevate rounded"
                            title="즐겨찾기"
                          >
                            <Heart className={`w-3 h-3 ${favoriteMenus.includes(item.name) ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Bottom Actions - 메뉴 접힘 시 바로 위로 이동 */}
            <div className="mt-4 pt-2 border-t border-gray-200 space-y-1">
              {/* Action Buttons */}
              <div className="space-y-0.5">
                <button 
                  onClick={() => setShowHelpPage(true)}
                  className="w-full flex items-center space-x-3 px-3 py-1.5 text-left text-sm text-gray-700 hover-elevate rounded-md"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>도움말</span>
                </button>
                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="w-full flex items-center space-x-3 px-3 py-1.5 text-left text-sm text-gray-700 hover-elevate rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <AppFooter variant="sidebar" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar — 모바일에서 숨김 (Hidden on mobile) */}
      {!isMobile && (
        <div className="w-64 border-r border-gray-200 flex flex-col shrink-0">
          {sidebarContent}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
          {/* 검색 결과 없음 알림 */}
          {showSearchMessage && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  "<strong>{searchQuery}</strong>" 해당 결과가 없습니다.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              {/* 모바일 햄버거 메뉴 (Mobile hamburger menu) */}
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <button className="p-2 rounded-lg hover-elevate shrink-0">
                      <Menu className="w-5 h-5 text-gray-600 shrink-0" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72">
                    {sidebarContent}
                  </SheetContent>
                </Sheet>
              )}
              <div className="flex items-center space-x-2 min-w-0">
                {currentLocation.map((location, index) => (
                  <div key={index} className="flex items-center space-x-2 min-w-0">
                    <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{location}</h1>
                    {index < currentLocation.length - 1 && (
                      <span className="text-gray-400 shrink-0">{">"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              {/* 결제 터미널 버튼 (Payment Terminal) */}
              <button
                onClick={() => window.location.href = '/payment-terminal'}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover-elevate text-sm font-medium"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Pay</span>
              </button>

              {/* AI 챗봇 버튼 — 모바일 숨김 (Hidden on mobile) */}
              <div className="hidden md:block">
                <Chatbot />
              </div>

              {/* 검색 기능 — 모바일에서 축소 (Compact on mobile) */}
              <div className="relative hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="메뉴, 회원, 상품 검색..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* 검색 결과 드롭다운 (Search results dropdown) */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          result.action();
                          setSearchQuery("");
                          setSearchResults([]);
                          setSelectedSearchResult(-1);
                        }}
                        className={`w-full px-3 py-2 text-left border-b last:border-b-0 border-gray-100 flex items-center space-x-3 transition-colors ${
                          selectedSearchResult === index
                            ? "bg-blue-50 text-blue-900"
                            : "hover-elevate"
                        }`}
                      >
                        <result.icon className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{result.title}</div>
                          <div className="text-xs text-gray-500">{result.path}</div>
                        </div>
                        {result.type === "subtab" && (
                          <div className="text-xs text-blue-600 font-medium">하위 탭</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 사용자 프로필 드롭다운 메뉴 */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center space-x-2 bg-gray-50 hover-elevate px-2 md:px-3 py-2 rounded-lg cursor-pointer"
                      data-testid="button-user-profile-menu"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-sm text-left hidden md:block">
                        <p className="font-medium text-gray-900">{user.username}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      {user.name || user.username}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowUsageGuide(true)}
                      className="cursor-pointer"
                      data-testid="menu-item-usage-guide"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      사용법 가이드
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      data-testid="menu-item-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-3 md:p-6">
          {activeTab === "대시보드" && <DashboardContent />}
          {activeTab === "센터 정보" && <CenterInfoContent />}
          {activeTab === "직원" && (
            showStaffRegistration ? (
              <StaffRegistrationPage onBack={() => setShowStaffRegistration(false)} />
            ) : selectedStaffId ? (
              <StaffDetailPage 
                staffId={selectedStaffId} 
                onBack={() => setSelectedStaffId(undefined)} 
              />
            ) : (
              <StaffPage 
                selectedStaffId={selectedStaffId}
                onStaffSelect={setSelectedStaffId}
                onRegister={() => setShowStaffRegistration(true)} 
              />
            )
          )}
          {activeTab === "상품" && <ProductsPage onNavigate={setCurrentLocation} />}
          {activeTab === "락커" && <LockersPage />}
          {activeTab === "출석" && (
            <AttendancePage
              onMemberClick={(memberId) => {
                setSelectedMemberId(memberId);
                handleTabChange("회원");
              }}
            />
          )}
          {activeTab === "스케줄" && <SchedulesPage />}
          {activeTab === "OT 신청" && <OtApplicationPage />}
          {activeTab === "개인 레슨" && <PersonalTrainingPage />}
          {activeTab === "그룹 수업" && <GroupLessonsPage />}
          {activeTab === "계약서" && (
            showContractCreate ? (
              <ContractCreatePage onBack={() => setShowContractCreate(false)} />
            ) : (
              <ContractsPage onCreateContract={() => setShowContractCreate(true)} />
            )
          )}
          {activeTab === "상담" && <ConsultationsPage />}
          {activeTab === "기타 매출" && <OtherSalesPage />}
          {activeTab === "통계" && <StatisticsPage />}
          {activeTab === "AI 인사이트" && <AiInsightsPage />}
          {activeTab === "프랜차이즈 관리" && <SuperadminPage />}
          
          {activeTab === "회원" && (
            <MembersPage
              selectedMemberId={selectedMemberId}
              onMemberSelect={setSelectedMemberId}
              onContractCreate={() => {
                setShowContractCreate(true);
                handleTabChange("계약서");
              }}
            />
          )}

          {/* Other tabs content can be added here */}
          {activeTab !== "센터 정보" && activeTab !== "회원" && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                {/* 빈 컨텐츠 영역 - 필요시 컨텐츠 추가 */}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* 🚨 커스텀 알림 팝업 (Custom Alert Popup) */}
      <CustomDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        onConfirm={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        description={alertDialog.description}
        confirmText="확인"
        type="alert"
      />

      {/* 최근 활동 상세보기 팝업 (Recent Activities Detail Modal) */}
      {showRecentActivities && <RecentActivitiesModal onClose={() => setShowRecentActivities(false)} />}

      {/* 수업 유형 선택 모달 (Lesson Type Selection Modal) */}
      {showLessonTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowLessonTypeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">수업 유형 선택</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowLessonTypeModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">추가하실 수업 유형을 선택해주세요.</p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col space-y-2 hover-elevate hover:border-blue-300"
                  onClick={() => {
                    setShowLessonTypeModal(false);
                    handleTabChange("그룹 수업");
                  }}
                >
                  <Users className="w-8 h-8 text-blue-500" />
                  <span className="text-sm font-medium">그룹 수업</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col space-y-2 hover-elevate hover:border-green-300"
                  onClick={() => {
                    setShowLessonTypeModal(false);
                    handleTabChange("개인 레슨");
                  }}
                >
                  <UserCircle className="w-8 h-8 text-green-500" />
                  <span className="text-sm font-medium">개인 레슨</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// Center Info Content Component
function CenterInfoContent() {
  const [centerInfoTab, setCenterInfoTab] = useState("공지사항");
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [showKioskNotice, setShowKioskNotice] = useState(false);
  const [noticeSubTab, setNoticeSubTab] = useState<"latest" | "kiosk">("latest");
  const [showKioskNoticeForm, setShowKioskNoticeForm] = useState(false);
  const [editingKioskNotice, setEditingKioskNotice] = useState<any>(null);
  const [showCenterEdit, setShowCenterEdit] = useState(false);
  const [activeServices, setActiveServices] = useState<string[]>(['주차', '앱', '음료', '와이파이', '헬스', '보안', '요가/필라테스']);
  const [showServiceModal, setShowServiceModal] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 📊 게시글 데이터 조회 (Fetch posts data)
  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch: refetchPosts } = useQuery({
    queryKey: ['/api/posts'],
    enabled: centerInfoTab === "공지사항",
    staleTime: 5 * 60 * 1000, // 5분 캐시
    retry: 2,
  });

  // 📝 게시글 생성 뮤테이션 (Create post mutation)
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(postData),
      });
      if (!response.ok) throw new Error('게시글 생성 실패');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  // 📝 게시글 업데이트 뮤테이션 (Update post mutation)
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, ...postData }: any) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(postData),
      });
      if (!response.ok) throw new Error('게시글 업데이트 실패');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  // 🗑️ 게시글 삭제 뮤테이션 (Delete post mutation)
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('게시글 삭제 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
  });

  const centerData: any[] = Array.isArray(posts) ? posts : [];

  // 페이지네이션 계산 (Pagination calculations)
  const totalPages = Math.ceil(centerData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = centerData.slice(startIndex, endIndex);

  // 키오스크 공지 데이터 조회 (Fetch kiosk notices)
  const { data: kioskNotices = [], isLoading: kioskNoticesLoading, error: kioskNoticesError, refetch: refetchKioskNotices } = useQuery<any[]>({
    queryKey: ["/api/kiosk-notices"],
    enabled: noticeSubTab === "kiosk",
  });

  // 키오스크 공지 CRUD mutations
  const createKioskNoticeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/kiosk-notices", data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "등록 실패" }));
        throw new Error(error.error || "등록 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kiosk-notices"] });
      toast({ title: "등록 완료", description: "키오스크 공지가 등록되었습니다." });
      setShowKioskNoticeForm(false);
      setEditingKioskNotice(null);
    },
    onError: (error: Error) => {
      toast({ title: "등록 실패", description: error.message, variant: "destructive" });
    },
  });

  const updateKioskNoticeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/kiosk-notices/${id}`, data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "수정 실패" }));
        throw new Error(error.error || "수정 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kiosk-notices"] });
      toast({ title: "수정 완료", description: "키오스크 공지가 수정되었습니다." });
      setShowKioskNoticeForm(false);
      setEditingKioskNotice(null);
    },
    onError: (error: Error) => {
      toast({ title: "수정 실패", description: error.message, variant: "destructive" });
    },
  });

  const deleteKioskNoticeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/kiosk-notices/${id}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "삭제 실패" }));
        throw new Error(error.error || "삭제 실패");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kiosk-notices"] });
      toast({ title: "삭제 완료", description: "키오스크 공지가 삭제되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
    },
  });

  // 공지사항 탭 내용
  const NoticeContent = () => {
    return (
        <div className="space-y-6">
          {/* Sub-Tab Navigation for 공지사항 */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded">
            <Button
              variant="ghost"
              className={`px-4 py-2 text-sm ${noticeSubTab === "latest" ? "bg-gray-800 text-white" : "text-gray-600 hover-elevate"}`}
              onClick={() => setNoticeSubTab("latest")}
              data-testid="tab-latest-notice"
            >
              최신 공지
            </Button>
            <Button
              variant="ghost"
              className={`px-4 py-2 text-sm ${noticeSubTab === "kiosk" ? "bg-gray-800 text-white" : "text-gray-600 hover-elevate"}`}
              onClick={() => setNoticeSubTab("kiosk")}
              data-testid="tab-kiosk-notice"
            >
              키오스크 공지
            </Button>
          </div>

          {/* 최신 공지 탭 내용 */}
          {noticeSubTab === "latest" && (
            <>
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="키워드로 검색" 
                  className="pl-10"
                />
                <Button size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2">
                  <Search className="w-3 h-3" />
                </Button>
              </div>

              {/* Data Table */}
              <Card>
                <CardContent className="p-0">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-4 p-4 bg-gray-100 border-b font-medium text-sm text-gray-700">
                    <div>번호</div>
                    <div>제목</div>
                    <div>등록일</div>
                    <div>작성자</div>
                    <div>상태</div>
                  </div>

                  {/* Table Rows */}
                  {postsLoading ? (
                    <div className="p-8 text-center">
                      <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                        <div>게시글을 불러오는 중...</div>
                      </div>
                    </div>
                  ) : postsError ? (
                    <div className="p-8 text-center">
                      <div className="text-red-500 mb-2">게시글을 불러오는 중 오류가 발생했습니다.</div>
                      <div className="text-sm text-gray-400 mb-4">페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</div>
                      <Button 
                        onClick={() => refetchPosts()}
                        variant="outline"
                        size="sm"
                        className="text-blue-500 border-blue-500 hover-elevate mr-2"
                      >
                        다시 시도
                      </Button>
                      <Button 
                        onClick={() => window.location.reload()}
                        variant="outline"
                        size="sm"
                        className="text-gray-500 border-gray-500 hover-elevate"
                      >
                        새로고침
                      </Button>
                    </div>
                  ) : centerData.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-500">등록된 공지사항이 없습니다.</div>
                      <div className="text-sm text-gray-400 mt-2">새로운 공지사항을 작성해보세요.</div>
                    </div>
                  ) : (
                    paginatedData.map((item) => (
                      <div key={item.id} className="grid grid-cols-5 gap-4 p-4 border-b text-sm hover-elevate">
                        <div className="flex items-center space-x-2">
                          {item.isImportant && (
                            <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
                          )}
                          <span>{item.id}</span>
                        </div>
                        <div 
                          className="text-blue-600 hover:underline cursor-pointer"
                          onClick={() => {
                            setSelectedPost(item);
                            setShowPostDetail(true);
                          }}
                        >
                          {item.title}
                        </div>
                        <div className="text-gray-600">{new Date(item.createdAt).toLocaleDateString('ko-KR')}</div>
                        <div className="text-gray-600">{item.author}</div>
                        <div className="text-green-600">{item.status}</div>
                      </div>
                    ))
                  )}

                  {/* 페이지네이션 (Pagination) */}
                  {centerData.length > itemsPerPage && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        전체 {centerData.length}개 중 {startIndex + 1}-{Math.min(endIndex, centerData.length)}개 표시
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

              {/* Add Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowPostCreation(true)}
                  className="bg-blue-500 hover-elevate"
                  data-testid="button-create-post"
                >
                  게시글 작성
                </Button>
              </div>
            </>
          )}

          {/* 키오스크 공지 탭 내용 */}
          {noticeSubTab === "kiosk" && (
            <>
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="키워드로 검색" 
                  className="pl-10"
                  data-testid="input-search-kiosk-notice"
                />
                <Button size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2">
                  <Search className="w-3 h-3" />
                </Button>
              </div>

              {/* Data Table - 센터 공지와 동일한 형태 */}
              <Card>
                <CardContent className="p-0">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-4 p-4 bg-gray-100 border-b font-medium text-sm text-gray-700">
                    <div>번호</div>
                    <div>제목</div>
                    <div>등록일</div>
                    <div>작성자</div>
                    <div>상태</div>
                  </div>

                  {/* Table Rows */}
                  {kioskNoticesLoading ? (
                    <div className="p-8 text-center">
                      <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                        <div>키오스크 공지를 불러오는 중...</div>
                      </div>
                    </div>
                  ) : kioskNoticesError ? (
                    <div className="p-8 text-center">
                      <div className="text-red-500 mb-2">키오스크 공지를 불러오는 중 오류가 발생했습니다.</div>
                      <div className="text-sm text-gray-400 mb-4">페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</div>
                      <Button 
                        onClick={() => refetchKioskNotices()}
                        variant="outline"
                        size="sm"
                        className="text-blue-500 border-blue-500 hover-elevate mr-2"
                        data-testid="button-retry-kiosk-notices"
                      >
                        다시 시도
                      </Button>
                      <Button 
                        onClick={() => window.location.reload()}
                        variant="outline"
                        size="sm"
                        className="text-gray-500 border-gray-500 hover-elevate"
                      >
                        새로고침
                      </Button>
                    </div>
                  ) : kioskNotices.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-500">등록된 키오스크 공지가 없습니다.</div>
                      <div className="text-sm text-gray-400 mt-2">새로운 키오스크 공지를 작성해보세요.</div>
                    </div>
                  ) : (
                    kioskNotices.map((item: any) => (
                      <div key={item.id} className="grid grid-cols-5 gap-4 p-4 border-b text-sm hover-elevate" data-testid={`row-kiosk-notice-${item.id}`}>
                        <div className="flex items-center space-x-2">
                          {item.isImportant && (
                            <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
                          )}
                          <span>{item.id}</span>
                        </div>
                        <div 
                          className="text-blue-600 hover:underline cursor-pointer"
                          onClick={() => {
                            setEditingKioskNotice(item);
                            setShowKioskNoticeForm(true);
                          }}
                        >
                          {item.title}
                        </div>
                        <div className="text-gray-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-'}</div>
                        <div className="text-gray-600">{item.author || '관리자'}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-600">{item.status || '게시중'}</span>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingKioskNotice(item);
                                setShowKioskNoticeForm(true);
                              }}
                              data-testid={`button-edit-kiosk-${item.id}`}
                            >
                              <Pencil className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={() => {
                                if (confirm("정말 삭제하시겠습니까?")) {
                                  deleteKioskNoticeMutation.mutate(item.id);
                                }
                              }}
                              disabled={deleteKioskNoticeMutation.isPending}
                              data-testid={`button-delete-kiosk-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Add Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    setEditingKioskNotice(null);
                    setShowKioskNoticeForm(true);
                  }}
                  className="bg-blue-500 hover-elevate"
                  data-testid="button-create-kiosk-notice"
                >
                  키오스크 공지 작성
                </Button>
              </div>
            </>
          )}
        </div>
    );
  };

  // 센터 정보 탭 내용
  const CenterInfoTab = () => {
    // 📊 그룹 수업 및 개인 레슨 데이터 조회 (Fetch group lessons and PT data)
    const { data: groupLessons = [] } = useQuery<GroupLesson[]>({
      queryKey: ["/api/group-lessons"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: personalTrainings = [] } = useQuery<PersonalTraining[]>({
      queryKey: ["/api/personal-training"],
      staleTime: 5 * 60 * 1000,
    });

    // 📋 센터에 표시할 프로그램 목록 조회 (Fetch center programs)
    const { data: centerPrograms = [] } = useQuery<any[]>({
      queryKey: ["/api/center-programs"],
      staleTime: 5 * 60 * 1000,
    });

    // 회원 및 직원 목록 조회 (회원명/트레이너명 표시용)
    const { data: membersList = [] } = useQuery<Member[]>({
      queryKey: ["/api/members"],
      staleTime: 5 * 60 * 1000,
    });

    const { data: staffList = [] } = useQuery<Staff[]>({
      queryKey: ["/api/staff"],
      staleTime: 5 * 60 * 1000,
    });

    // 센터에 표시할 그룹 수업/개인 레슨 필터링 (Filter lessons to display on center)
    const selectedGroupIds = centerPrograms.filter(p => p.programType === 'group').map(p => p.programId);
    const selectedPersonalIds = centerPrograms.filter(p => p.programType === 'personal').map(p => p.programId);
    
    // 선택된 프로그램이 있으면 해당 프로그램만 표시, 없으면 모든 프로그램 표시 (Show selected or all)
    const displayGroupLessons = selectedGroupIds.length > 0 
      ? groupLessons.filter(l => selectedGroupIds.includes(l.id))
      : groupLessons;
    const displayPersonalTrainings = selectedPersonalIds.length > 0
      ? personalTrainings.filter(pt => selectedPersonalIds.includes(pt.id))
      : personalTrainings;

    // 회원/트레이너 이름 조회 헬퍼
    const getMemberName = (memberId: number) => membersList.find(m => m.id === memberId)?.name || "회원";
    const getStaffName = (staffId: number | null | undefined) => staffId ? staffList.find(s => s.id === staffId)?.name || "트레이너" : null;

    return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Left Column - Center Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">센터 정보</h3>
                {!showCenterEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCenterEdit(true)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    수정
                  </Button>
                )}
              </div>
              
              {showCenterEdit ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">지점명</label>
                    <Input defaultValue="OUHVE ABM 강남점" placeholder="지점명을 입력하세요" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">운영 시간</label>
                    <Input defaultValue="평일 06:00 - 23:00 / 주말 08:00 - 20:00" placeholder="운영 시간을 입력하세요" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">지점명</label>
                    <p className="text-sm text-gray-900 mt-1">OUHVE ABM 강남점</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">운영 시간</label>
                    <p className="text-sm text-gray-900 mt-1">평일 06:00 - 23:00 / 주말 08:00 - 20:00</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SNS 주소 섹션 */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">SNS 주소</h3>
              {showCenterEdit ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">인스타그램</label>
                    <div className="flex">
                      <Select defaultValue="instagram">
                        <SelectTrigger className="w-[140px] rounded-r-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">인스타그램</SelectItem>
                          <SelectItem value="facebook">페이스북</SelectItem>
                          <SelectItem value="youtube">유튜브</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        defaultValue="@ouhve_gangnam" 
                        placeholder="SNS 주소를 입력하세요"
                        className="rounded-l-none flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">웹사이트</label>
                    <div className="flex">
                      <Select defaultValue="homepage">
                        <SelectTrigger className="w-[140px] rounded-r-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homepage">홈페이지</SelectItem>
                          <SelectItem value="blog">블로그</SelectItem>
                          <SelectItem value="shop">온라인샵</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        defaultValue="https://ouhve.example.com" 
                        placeholder="웹사이트 주소를 입력하세요"
                        className="rounded-l-none flex-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-16">인스타그램</span>
                    <span className="text-sm text-gray-900">@ouhve_gangnam</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-16">홈페이지</span>
                    <span className="text-sm text-gray-900">https://ouhve.example.com</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Center Images */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">센터 사진</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center h-24 relative">
                  <span className="text-white text-xs font-medium">GL Pay</span>
                  {showCenterEdit && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-white"
                    >
                      <X className="w-4 h-4 shrink-0" />
                    </Button>
                  )}
                </div>
                <div className="bg-gray-600 rounded-lg p-4 flex items-center justify-center h-24 relative">
                  <span className="text-white text-xs font-medium">GL Pay</span>
                  {showCenterEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-white"
                    >
                      <X className="w-4 h-4 shrink-0" />
                    </Button>
                  )}
                </div>
              </div>
              {showCenterEdit && (
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  사진 추가
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service Icons Grid */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">편의 서비스</h3>
          {showCenterEdit && (
            <p className="text-sm text-gray-600 mb-4">운영하시는 서비스를 아이콘을 클릭하여 선택해 주세요</p>
          )}
          <div className="grid grid-cols-10 gap-4">
            {/* First Row */}
            {[
              { key: '주차', icon: <Car className="w-6 h-6" />, label: '주차' },
              { key: '앱', icon: <Smartphone className="w-6 h-6" />, label: '앱' },
              { key: '음료', icon: <Coffee className="w-6 h-6" />, label: '음료' },
              { key: '위치', icon: <MapPin className="w-6 h-6" />, label: '위치' },
              { key: '수건', icon: <Zap className="w-6 h-6" />, label: '수건' },
              { key: '와이파이', icon: <Wifi className="w-6 h-6" />, label: '와이파이' },
              { key: '헬스', icon: <Dumbbell className="w-6 h-6" />, label: '헬스' },
              { key: '음악', icon: <Music className="w-6 h-6" />, label: '음악' },
              { key: '보안', icon: <Shield className="w-6 h-6" />, label: '보안' },
              { key: '촬영', icon: <Camera className="w-6 h-6" />, label: '촬영' }
            ].map((service) => (
              <div key={service.key} className="flex flex-col items-center space-y-2">
                {showCenterEdit ? (
                  <button
                    onClick={() => {
                      if (activeServices.includes(service.key)) {
                        setActiveServices(activeServices.filter(s => s !== service.key));
                      } else {
                        setActiveServices([...activeServices, service.key]);
                      }
                    }}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      activeServices.includes(service.key) 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-400 hover-elevate'
                    }`}
                  >
                    {service.icon}
                  </button>
                ) : (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    activeServices.includes(service.key) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {service.icon}
                  </div>
                )}
                <span className="text-xs text-gray-600">{service.label}</span>
              </div>
            ))}

            {/* Second Row */}
            {[
              { key: '체력단', icon: <Activity className="w-6 h-6" />, label: '체력단' },
              { key: '크로스핏', icon: <Dumbbell className="w-6 h-6" />, label: '크로스핏' },
              { key: '스피닝', icon: <Bike className="w-6 h-6" />, label: '스피닝' },
              { key: '복싱', icon: <Target className="w-6 h-6" />, label: '복싱' },
              { key: '기타', icon: <LayoutGrid className="w-6 h-6" />, label: '기타' },
              { key: '요가/필라테스', icon: <Heart className="w-6 h-6" />, label: '요가/필라테스' },
              { key: '실버', icon: <Accessibility className="w-6 h-6" />, label: '실버' },
              { key: '나머지피트', icon: <Activity className="w-6 h-6" />, label: '나머지피트' },
              { key: '키즈족', icon: <Baby className="w-6 h-6" />, label: '키즈족' },
              { key: '수영장', icon: <Waves className="w-6 h-6" />, label: '수영장' }
            ].map((service) => (
              <div key={service.key} className="flex flex-col items-center space-y-2">
                {showCenterEdit ? (
                  <button
                    onClick={() => {
                      if (activeServices.includes(service.key)) {
                        setActiveServices(activeServices.filter(s => s !== service.key));
                      } else {
                        setActiveServices([...activeServices, service.key]);
                      }
                    }}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      activeServices.includes(service.key) 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-400 hover-elevate'
                    }`}
                  >
                    {service.icon}
                  </button>
                ) : (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    activeServices.includes(service.key) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {service.icon}
                  </div>
                )}
                <span className="text-xs text-gray-600">{service.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 무료 서비스 & 유료 서비스 섹션 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 무료 서비스 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">무료 서비스</h3>
              {showCenterEdit && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-blue-600"
                  onClick={() => setShowServiceModal('free')}
                >
                  서비스 추가
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">음료 무제한</p>
                    <p className="text-xs text-gray-500">커피, 이온음료 등</p>
                  </div>
                </div>
                {showCenterEdit && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">무료 WiFi</p>
                    <p className="text-xs text-gray-500">전관 고속 인터넷</p>
                  </div>
                </div>
                {showCenterEdit && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">주차 2시간</p>
                    <p className="text-xs text-gray-500">지하 주차장 이용</p>
                  </div>
                </div>
                {showCenterEdit && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 유료 서비스 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">유료 서비스</h3>
              {showCenterEdit && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-blue-600"
                  onClick={() => setShowServiceModal('paid')}
                >
                  서비스 추가
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">운동복/수건 대여</p>
                    <p className="text-xs text-gray-500">1회 3,000원</p>
                  </div>
                </div>
                {showCenterEdit && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">락커 대여</p>
                    <p className="text-xs text-gray-500">월 10,000원</p>
                  </div>
                </div>
                {showCenterEdit && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OT 안내 섹션 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">OT 안내</h3>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
              </div>
            </div>
          </div>
          {showCenterEdit ? (
            <div className="space-y-4">
              <Textarea 
                placeholder="OT에 대한 내용을 입력해 주세요."
                className="min-h-[60px]"
                defaultValue="신규 회원님을 위한 1:1 맞춤 OT 프로그램을 제공합니다. 체성분 분석, 운동 목표 설정, 기구 사용법 안내 등 전문 트레이너가 친절하게 설명해드립니다."
              />
              <Button variant="outline" size="sm">
                프로그램 추가
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-900 leading-relaxed">
                신규 회원님을 위한 1:1 맞춤 OT 프로그램을 제공합니다. 체성분 분석, 운동 목표 설정, 기구 사용법 안내 등 전문 트레이너가 친절하게 설명해드립니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 프로그램 섹션 - 실제 그룹 수업 및 개인 레슨 데이터 표시 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">프로그램</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">그룹 수업 {displayGroupLessons.length}개 / 개인 레슨 {displayPersonalTrainings.length}개</span>
              {showCenterEdit && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-blue-600"
                  onClick={() => setShowServiceModal('program')}
                >
                  프로그램 추가
                </Button>
              )}
            </div>
          </div>
          
          {/* 그룹 수업 섹션 */}
          {displayGroupLessons.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1 text-green-600" />
                그룹 수업
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {displayGroupLessons.slice(0, 6).map((lesson) => (
                  <div key={lesson.id} className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-gray-900 text-sm truncate">{lesson.name}</h4>
                    </div>
                    <p className="text-xs text-gray-600">
                      {lesson.instructor && `강사: ${lesson.instructor}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      참가: {lesson.participants}/{lesson.maxParticipants}명
                      {lesson.time && ` | ${lesson.time}`}
                      {lesson.duration && ` (${lesson.duration})`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 개인 레슨 섹션 */}
          {displayPersonalTrainings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Dumbbell className="w-4 h-4 mr-1 text-blue-600" />
                개인 레슨 (PT)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {displayPersonalTrainings.slice(0, 6).map((pt) => (
                  <div key={pt.id} className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <Dumbbell className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900 text-sm truncate">{getMemberName(pt.memberId)}</h4>
                    </div>
                    <p className="text-xs text-gray-600">
                      {getStaffName(pt.instructorId) && `트레이너: ${getStaffName(pt.instructorId)}`}
                      {!getStaffName(pt.instructorId) && `상태: ${pt.status}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pt.totalSessions !== null && pt.totalSessions !== undefined && pt.totalSessions > 0 ? `총 ${pt.totalSessions}회 / 잔여 ${pt.remainingSessions}회` : '무제한'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 데이터가 없을 때 */}
          {displayGroupLessons.length === 0 && displayPersonalTrainings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Dumbbell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">등록된 프로그램이 없습니다.</p>
              <p className="text-xs mt-1">수업 메뉴에서 그룹 수업이나 개인 레슨을 추가해주세요.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 내용 수정 / 저장 버튼 */}
      <div className="flex justify-end">
        {showCenterEdit ? (
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => setShowCenterEdit(false)}
            >
              돌아가기
            </Button>
            <Button 
              className="bg-blue-500 hover-elevate"
              onClick={() => setShowCenterEdit(false)}
            >
              저장
            </Button>
          </div>
        ) : (
          <Button 
            className="bg-blue-500 hover-elevate"
            onClick={() => setShowCenterEdit(true)}
          >
            내용 수정
          </Button>
        )}
      </div>
    </div>
  );
  };

  // 게시물 작성 모달
  const PostCreationModal = () => {
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");
    const [isImportant, setIsImportant] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    
    // 편집 모드일 때 기존 데이터로 초기화
    useEffect(() => {
      if (showPostCreation && selectedPost) {
        setPostTitle(selectedPost.content);
        setPostContent(selectedPost.fullContent || selectedPost.content);
        setIsImportant(selectedPost.type === "중요");
        setEditingPostId(selectedPost.id);
      } else if (showPostCreation) {
        setPostTitle("");
        setPostContent("");
        setIsImportant(false);
        setEditingPostId(null);
      }
    }, [showPostCreation, selectedPost]);
    
    if (!showPostCreation) return null;

    // 키보드 이벤트 핸들러 (ESC=닫기, Ctrl+Enter=저장)
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowPostCreation(false);
      } else if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleSavePost();
      }
    };

    // 게시글 저장 함수 (Save post function)
    const handleSavePost = async () => {
      if (!postTitle.trim() || !postContent.trim()) {
        toast({
          title: "입력 오류",
          description: "제목과 내용을 모두 입력해주세요.",
          variant: "destructive",
        });
        return;
      }
      
      setIsSaving(true);
      
      try {
        const postData = {
          title: postTitle,
          content: postContent,
          isImportant: isImportant,
          status: "게시 중",
          author: "관리자"
        };
        
        if (editingPostId) {
          // 기존 게시글 수정 (Update existing post)
          await updatePostMutation.mutateAsync({ id: editingPostId, ...postData });
        } else {
          // 새 게시글 생성 (Create new post)
          await createPostMutation.mutateAsync(postData);
        }
        
        // 저장 성공 시 모달 닫기 (Close modal on success)
        setShowPostCreation(false);
        setPostTitle("");
        setPostContent("");
        setIsImportant(false);
        setEditingPostId(null);
        
      } catch (error) {
        console.error('게시글 저장 오류:', error);
        toast({
          title: "저장 실패",
          description: "게시글 저장에 실패했습니다. 다시 시도해주세요.",
          variant: "destructive",
        });
      } finally{
        setIsSaving(false);
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">센터 공지 작성</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">자동 임시</span>
                <span className="text-sm text-gray-500">페이지 기본정책</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">게시글 유형 선택 (최대 20자 이내)</label>
                <Input 
                  placeholder="게시글 제목 입력"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">내용을 입력 주세요. (최대 1,000자)</label>
                <Textarea 
                  placeholder="내용을 입력하세요"
                  className="min-h-[200px] resize-none"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  maxLength={1000}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="urgent" 
                  className="w-4 h-4" 
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                />
                <label htmlFor="urgent" className="text-sm">중요 공지사항 상태로 게시</label>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>사진 (선택)</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">파일 10장을 선택할 수 있습니다. 3MB 이하의 jpg png pdf 파일만 가능합니다.</p>
                <Button variant="outline" className="mt-2">
                  사진 추가
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowPostCreation(false)}
                disabled={isSaving}
              >
                임시 저장 취소
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" disabled={isSaving}>임시 저장</Button>
                <Button 
                  className="bg-blue-500 hover-elevate"
                  onClick={handleSavePost}
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : editingPostId ? "수정 완료" : "게시글 저장"}
                </Button>
              </div>
            </div>
        </div>
      </div>
    );
  };

  // 키오스크 공지 작성/수정 모달 (Kiosk Notice Form Modal)
  const KioskNoticeFormModal = () => {
    const [noticeTitle, setNoticeTitle] = useState(editingKioskNotice?.title || "");
    const [noticeContent, setNoticeContent] = useState(editingKioskNotice?.content || "");
    
    useEffect(() => {
      if (showKioskNoticeForm) {
        if (editingKioskNotice) {
          setNoticeTitle(editingKioskNotice.title || "");
          setNoticeContent(editingKioskNotice.content || "");
        } else {
          setNoticeTitle("");
          setNoticeContent("");
        }
      }
    }, [showKioskNoticeForm, editingKioskNotice]);
    
    if (!showKioskNoticeForm) return null;

    const isSaving = createKioskNoticeMutation.isPending || updateKioskNoticeMutation.isPending;

    // 키보드 이벤트 핸들러 (ESC=닫기, Ctrl+Enter=저장)
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowKioskNoticeForm(false);
        setEditingKioskNotice(null);
      } else if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleSave();
      }
    };

    const handleSave = () => {
      if (!noticeTitle.trim() || !noticeContent.trim()) {
        toast({ title: "입력 오류", description: "제목과 내용을 모두 입력해주세요.", variant: "destructive" });
        return;
      }

      const data = { title: noticeTitle, content: noticeContent, isActive: true };

      if (editingKioskNotice) {
        updateKioskNoticeMutation.mutate({ id: editingKioskNotice.id, data });
      } else {
        createKioskNoticeMutation.mutate(data);
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50" 
        data-testid="modal-kiosk-notice-form"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" data-testid="text-kiosk-form-title">
              {editingKioskNotice ? "키오스크 공지 수정" : "키오스크 공지 작성"}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setShowKioskNoticeForm(false); setEditingKioskNotice(null); }}
              data-testid="button-close-kiosk-form"
            >
              <X className="w-4 h-4 shrink-0" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">공지 제목</label>
              <Input
                placeholder="공지 제목을 입력하세요"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                data-testid="input-kiosk-title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">공지 내용</label>
              <Textarea
                placeholder="공지 내용을 입력하세요"
                className="min-h-[120px] resize-none"
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                data-testid="input-kiosk-content"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => { setShowKioskNoticeForm(false); setEditingKioskNotice(null); }} 
                disabled={isSaving} 
                data-testid="button-cancel-kiosk-form"
              >
                취소
              </Button>
              <Button 
                className="bg-blue-500 hover-elevate" 
                onClick={handleSave} 
                disabled={isSaving} 
                data-testid="button-save-kiosk-form"
              >
                {isSaving ? "저장 중..." : editingKioskNotice ? "수정" : "등록"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 센터 정보 수정 모달
  const CenterEditModal = () => {
    if (!showCenterEdit) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <Card className="w-full max-w-4xl mx-4 my-8">
          <CardAccentLine />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">센터 정보 수정</h2>
              <Button
                variant="ghost"
                onClick={() => setShowCenterEdit(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 shrink-0" />
              </Button>
            </div>

            <div className="space-y-8">
              {/* 센터 정보 섹션 */}
              <div>
                <h3 className="text-lg font-medium mb-4">센터 정보</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">지점명</label>
                      <Input defaultValue="(주)GL Pay 월리스터스점" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">운영 시간</label>
                      <Input defaultValue="평일 06:00-23:00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">인스타그램 주소</label>
                      <Input defaultValue="https://www.instagram.com/glpay_center/" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">웹사이트 주소</label>
                      <Input defaultValue="https://www.glpay.kr/" />
                    </div>
                  </div>
                  
                  {/* 센터 사진 업로드 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">센터 사진</label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center h-24 relative">
                        <span className="text-white text-xs font-medium">GL Pay</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4 shrink-0" />
                        </Button>
                      </div>
                      <div className="bg-gray-600 rounded-lg p-4 flex items-center justify-center h-24 relative">
                        <span className="text-white text-xs font-medium">GL Pay</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4 shrink-0" />
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      사진 추가
                    </Button>
                  </div>
                </div>
              </div>

              {/* 편의 서비스 섹션 */}
              <div>
                <h3 className="text-lg font-medium mb-4">편의 서비스</h3>
                <div className="grid grid-cols-10 gap-4">
                  {/* 편의 서비스 아이콘들 - 클릭 가능하도록 수정 */}
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      <Car className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-600">주차</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      <Smartphone className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-600">앱</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      <Coffee className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-600">음료</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <MapPin className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">위치</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-600">수건</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      <Wifi className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-600">와이파이</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      <Dumbbell className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-600">헬스</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      <Music className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-600">음악</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Shield className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">보안</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">촬영</span>
                  </div>

                  {/* Second Row */}
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Home className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">체력단</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Gamepad2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">크로스핏</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Headphones className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">스피닝</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Tv className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">복싱</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Monitor className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">기타</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <PlayCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">요가/필라테스</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Volume2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">실버</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">나머지피트</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Settings className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">키즈족</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600">수영장</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">서비스 아이콘을 클릭하여 활성화/비활성화할 수 있습니다.</p>
              </div>

              {/* 유료 결제 서비스 섹션 */}
              <div>
                <h3 className="text-lg font-medium mb-4">유료 결제 서비스</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">유료 결제 서비스 1</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-4">서비스 이미지를 업로드하세요</p>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        이미지 추가
                      </Button>
                    </div>
                    <Input placeholder="서비스 제목" className="mt-2" />
                    <Textarea placeholder="서비스 설명" className="mt-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">유료 결제 서비스 2</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-4">서비스 이미지를 업로드하세요</p>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        이미지 추가
                      </Button>
                    </div>
                    <Input placeholder="서비스 제목" className="mt-2" />
                    <Textarea placeholder="서비스 설명" className="mt-2" />
                  </div>
                </div>
              </div>

              {/* OT 안내 섹션 */}
              <div>
                <h3 className="text-lg font-medium mb-4">OT 안내</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-4">OT 안내 이미지를 업로드하세요</p>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    이미지 추가
                  </Button>
                </div>
                <Input placeholder="OT 프로그램 제목" className="mb-2" />
                <Textarea placeholder="OT 프로그램 설명 및 안내사항" />
              </div>

              {/* 프로그램 섹션 */}
              <div>
                <h3 className="text-lg font-medium mb-4">프로그램</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-4">프로그램 이미지를 업로드하세요</p>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    이미지 추가
                  </Button>
                </div>
                <Input placeholder="프로그램 제목" className="mb-2" />
                <Textarea placeholder="프로그램 설명 및 일정" />
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end space-x-2 mt-8 pt-6 border-t">
              <Button 
                variant="outline"
                onClick={() => setShowCenterEdit(false)}
              >
                취소
              </Button>
              <Button className="bg-blue-500 hover-elevate">
                변경사항 저장
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // 서비스 추가 모달
  const ServiceModal = () => {
    const [programType, setProgramType] = useState<'group' | 'personal'>('group');
    const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
    
    // 그룹 수업 및 개인 레슨 데이터 조회 (Fetch group lessons and PT data for program selection)
    const { data: groupLessonsData = [] } = useQuery<GroupLesson[]>({
      queryKey: ["/api/group-lessons"],
      staleTime: 5 * 60 * 1000,
      enabled: showServiceModal === 'program',
    });

    const { data: personalTrainingsData = [] } = useQuery<PersonalTraining[]>({
      queryKey: ["/api/personal-training"],
      staleTime: 5 * 60 * 1000,
      enabled: showServiceModal === 'program',
    });

    const { data: membersData = [] } = useQuery<Member[]>({
      queryKey: ["/api/members"],
      staleTime: 5 * 60 * 1000,
      enabled: showServiceModal === 'program',
    });

    const { data: staffData = [] } = useQuery<Staff[]>({
      queryKey: ["/api/staff"],
      staleTime: 5 * 60 * 1000,
      enabled: showServiceModal === 'program',
    });

    const getMemberName = (memberId: number) => membersData.find(m => m.id === memberId)?.name || "회원";
    const getStaffName = (staffId: number | null | undefined) => staffId ? staffData.find(s => s.id === staffId)?.name || "트레이너" : null;

    if (!showServiceModal) return null;

    const getModalTitle = () => {
      switch (showServiceModal) {
        case 'free': return '무료 서비스 추가';
        case 'paid': return '유료 서비스 추가';
        case 'program': return '프로그램 추가';
        default: return '서비스 추가';
      }
    };

    const toggleProgramSelection = (id: number) => {
      setSelectedPrograms(prev => 
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
    };

    const handleAddPrograms = async () => {
      try {
        const response = await fetch('/api/center-programs/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            programType,
            programIds: selectedPrograms,
          }),
        });
        
        if (!response.ok) {
          throw new Error('저장 실패');
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/center-programs'] });
        toast({
          title: "프로그램 추가 완료",
          description: `${selectedPrograms.length}개의 ${programType === 'group' ? '그룹 수업' : '개인 레슨'}이 추가되었습니다.`,
        });
        setSelectedPrograms([]);
        setShowServiceModal(null);
      } catch (error) {
        toast({
          title: "저장 실패",
          description: "프로그램 추가에 실패했습니다. 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    };

    // 프로그램 추가 모달 (기존 수업 선택)
    if (showServiceModal === 'program') {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <CardAccentLine />
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{getModalTitle()}</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSelectedPrograms([]);
                    setShowServiceModal(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* 프로그램 타입 선택 탭 */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded mb-4">
                <Button
                  variant="ghost"
                  className={`flex-1 px-4 py-2 text-sm ${programType === 'group' ? 'bg-gray-800 text-white' : 'text-gray-600 hover-elevate'}`}
                  onClick={() => {
                    setProgramType('group');
                    setSelectedPrograms([]);
                  }}
                  data-testid="tab-group-program"
                >
                  <Users className="w-4 h-4 mr-2" />
                  그룹 수업 ({groupLessonsData.length})
                </Button>
                <Button
                  variant="ghost"
                  className={`flex-1 px-4 py-2 text-sm ${programType === 'personal' ? 'bg-gray-800 text-white' : 'text-gray-600 hover-elevate'}`}
                  onClick={() => {
                    setProgramType('personal');
                    setSelectedPrograms([]);
                  }}
                  data-testid="tab-personal-program"
                >
                  <Dumbbell className="w-4 h-4 mr-2" />
                  개인 레슨 ({personalTrainingsData.length})
                </Button>
              </div>

              {/* 수업 목록 */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[400px]">
                {programType === 'group' ? (
                  groupLessonsData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">등록된 그룹 수업이 없습니다.</p>
                      <p className="text-xs mt-1">수업 메뉴에서 그룹 수업을 먼저 추가해주세요.</p>
                    </div>
                  ) : (
                    groupLessonsData.map((lesson) => (
                      <div 
                        key={lesson.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPrograms.includes(lesson.id)
                            ? 'bg-green-50 border-green-500'
                            : 'bg-white border-gray-200 hover:border-green-300'
                        }`}
                        onClick={() => toggleProgramSelection(lesson.id)}
                        data-testid={`program-group-${lesson.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedPrograms.includes(lesson.id) 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300'
                            }`}>
                              {selectedPrograms.includes(lesson.id) && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{lesson.name}</h4>
                              <p className="text-xs text-gray-500">
                                {lesson.instructor && `강사: ${lesson.instructor}`}
                                {lesson.time && ` | ${lesson.time}`}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {lesson.participants}/{lesson.maxParticipants}명
                          </span>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  personalTrainingsData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Dumbbell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">등록된 개인 레슨이 없습니다.</p>
                      <p className="text-xs mt-1">수업 메뉴에서 개인 레슨을 먼저 추가해주세요.</p>
                    </div>
                  ) : (
                    personalTrainingsData.map((pt) => (
                      <div 
                        key={pt.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPrograms.includes(pt.id)
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => toggleProgramSelection(pt.id)}
                        data-testid={`program-personal-${pt.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedPrograms.includes(pt.id) 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {selectedPrograms.includes(pt.id) && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{getMemberName(pt.memberId)}</h4>
                              <p className="text-xs text-gray-500">
                                {getStaffName(pt.instructorId) && `트레이너: ${getStaffName(pt.instructorId)}`}
                                {!getStaffName(pt.instructorId) && `상태: ${pt.status}`}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {pt.totalSessions !== null && pt.totalSessions !== undefined && pt.totalSessions > 0 ? `${pt.remainingSessions}/${pt.totalSessions}회` : '무제한'}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>

              {/* 선택 개수 표시 및 버튼 */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-gray-600">
                  {selectedPrograms.length}개 선택됨
                </span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedPrograms([]);
                      setShowServiceModal(null);
                    }}
                  >
                    취소
                  </Button>
                  <Button 
                    className="bg-blue-500 hover-elevate"
                    onClick={handleAddPrograms}
                    disabled={selectedPrograms.length === 0}
                  >
                    추가하기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // 기존 서비스 추가 모달 (free/paid)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardAccentLine />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{getModalTitle()}</h2>
              <Button
                variant="ghost"
                onClick={() => setShowServiceModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 shrink-0" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">서비스명</label>
                <Input placeholder="이름을 입력하세요" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <Textarea 
                  placeholder="설명을 입력하세요"
                  className="min-h-[80px] resize-none"
                />
              </div>

              {showServiceModal === 'paid' && (
                <div>
                  <label className="block text-sm font-medium mb-2">가격</label>
                  <Input placeholder="예: 10,000원" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">이미지</label>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  이미지 업로드
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowServiceModal(null)}
              >
                취소
              </Button>
              <Button 
                className="bg-blue-500 hover-elevate"
                onClick={() => setShowServiceModal(null)}
              >
                저장
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // 게시글 상세 보기 모달 (Post detail modal)
  const PostDetailModal = () => {
    if (!showPostDetail || !selectedPost) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <CardAccentLine />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">공지사항 상세</h2>
                {selectedPost.type === "중요" && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-red-500" />
                    중요
                  </span>
                )}
              </div>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowPostDetail(false)}
              >
                <X className="w-4 h-4 shrink-0" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* 게시글 제목 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedPost.content}
                </h3>
              </div>

              {/* 게시글 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">작성자:</span>
                  <span className="ml-2 text-sm font-medium">{selectedPost.author}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">등록일:</span>
                  <span className="ml-2 text-sm font-medium">{selectedPost.date}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">상태:</span>
                  <span className="ml-2 text-sm font-medium text-green-600">{selectedPost.status}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">작성 시간:</span>
                  <span className="ml-2 text-sm font-medium">{selectedPost.createdAt}</span>
                </div>
              </div>

              {/* 게시글 내용 */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">내용</h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[200px]">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedPost.fullContent || selectedPost.content}
                  </p>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowPostDetail(false);
                    setShowPostCreation(true);
                  }}
                >
                  수정
                </Button>
                <Button 
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover-elevate"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                  }}
                >
                  삭제
                </Button>
                <Button 
                  onClick={() => setShowPostDetail(false)}
                  className="bg-blue-500 hover-elevate"
                >
                  닫기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          onClick={() => setCenterInfoTab("공지사항")}
          variant={centerInfoTab === "공지사항" ? "default" : "ghost"}
          className={`px-6 py-2 text-sm font-medium rounded-md ${
            centerInfoTab === "공지사항" 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover-elevate'
          }`}
        >
          공지사항
        </Button>
        <Button
          onClick={() => setCenterInfoTab("센터 정보")}
          variant={centerInfoTab === "센터 정보" ? "default" : "ghost"}
          className={`px-6 py-2 text-sm font-medium rounded-md ${
            centerInfoTab === "센터 정보" 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover-elevate'
          }`}
        >
          센터 정보
        </Button>
      </div>

      {/* Tab Content */}
      {centerInfoTab === "공지사항" && <NoticeContent />}
      {centerInfoTab === "센터 정보" && <CenterInfoTab />}

      {/* Modals */}
      <PostCreationModal />
      <KioskNoticeFormModal />
      <PostDetailModal />
      {showServiceModal && <ServiceModal />}
      
      {/* 삭제 확인 팝업 (Delete confirmation popup) */}
      <CustomConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (selectedPost) {
            deletePostMutation.mutate(selectedPost.id);
            setShowDeleteConfirm(false);
            setShowPostDetail(false);
          }
        }}
        title="이 게시글을 삭제하시겠습니까?"
        message="삭제 시, 게시글이 완전히 제거됩니다."
        cancelText="돌아가기"
        confirmText="삭제"
      />



    </div>
  );
}
