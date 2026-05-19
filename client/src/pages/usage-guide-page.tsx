// 🔧 사용법 가이드 페이지 (Usage Guide Page)
// 🎯 Purpose: 시스템 사용법 및 기능 설명 페이지 (System usage and feature explanation page)
// 📚 Features: 각 페이지별 사용법, 기능 설명, 단계별 가이드 (Page-by-page usage, feature explanation, step-by-step guide)

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAccentLine } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  BookOpen, 
  Search,
  ChevronRight,
  CheckCircle,
  Users,
  UserCircle,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  Building2,
  Lock,
  ShoppingBag,
  MessageCircle,
  Dumbbell,
  Clock,
  Home,
  PlayCircle,
  Video,
  Monitor
} from "lucide-react";

interface UsageGuidePageProps {
  onBack: () => void;
}

export default function UsageGuidePage({ onBack }: UsageGuidePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const guideCategories = [
    {
      id: "dashboard",
      title: "대시보드",
      description: "메인 대시보드 사용법 및 주요 기능",
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      items: [
        {
          title: "대시보드 개요",
          description: "메인 화면에서 한눈에 볼 수 있는 정보들",
          steps: [
            "로그인 후 자동으로 대시보드 화면이 표시됩니다",
            "상단에서 전체 회원 수, 활성 회원 수, 오늘 출석 등을 확인할 수 있습니다",
            "최근 활동 섹션에서 최신 회원 등록, 상담 등록 내역을 확인할 수 있습니다",
            "빠른 액션 버튼으로 자주 사용하는 기능에 바로 접근할 수 있습니다"
          ]
        },
        {
          title: "빠른 액션 사용법",
          description: "대시보드에서 빠른 작업 수행 방법",
          steps: [
            "'회원 등록' 버튼을 클릭하여 새 회원을 바로 등록할 수 있습니다",
            "'상담 등록' 버튼으로 상담 예약을 즉시 생성할 수 있습니다",
            "'통계 보기' 버튼으로 매출 통계 페이지로 이동할 수 있습니다",
            "통계 카드를 클릭하면 해당 페이지로 바로 이동합니다"
          ]
        }
      ]
    },
    {
      id: "members",
      title: "회원 관리",
      description: "회원 등록, 수정, 삭제 및 회원권 관리",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      items: [
        {
          title: "회원 등록",
          description: "새로운 회원을 등록하는 방법",
          steps: [
            "회원 메뉴에서 '회원 등록' 버튼을 클릭합니다",
            "이름, 전화번호, 성별 등 필수 정보를 입력합니다",
            "가입 경로를 선택하거나 직접 입력합니다",
            "필요시 메모를 추가하고 '등록' 버튼을 클릭합니다"
          ]
        },
        {
          title: "회원 정보 수정",
          description: "기존 회원의 정보를 수정하는 방법",
          steps: [
            "회원 목록에서 수정할 회원을 선택합니다",
            "회원 상세 페이지에서 '수정' 버튼을 클릭합니다",
            "변경할 정보를 입력하고 저장합니다",
            "변경 내역이 즉시 반영됩니다"
          ]
        },
        {
          title: "회원권 관리",
          description: "회원권 등록, 연장, 정지 관리",
          steps: [
            "회원 상세 페이지에서 '회원권' 탭을 선택합니다",
            "'등록' 버튼을 클릭하여 새 회원권을 추가합니다",
            "상품, 기간, 가격 등을 설정하고 저장합니다",
            "기존 회원권의 연장이나 정지는 해당 버튼을 이용합니다"
          ]
        }
      ]
    },
    {
      id: "staff",
      title: "직원 관리",
      description: "직원 등록, 권한 관리, 근무 일정 관리",
      icon: UserCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      items: [
        {
          title: "직원 등록",
          description: "새로운 직원을 등록하는 방법",
          steps: [
            "직원 메뉴에서 '직원 등록' 버튼을 클릭합니다",
            "직원 이름, 연락처, 직급 등을 입력합니다",
            "근무 시간과 급여 정보를 설정합니다",
            "권한 레벨을 설정하고 등록을 완료합니다"
          ]
        },
        {
          title: "권한 관리",
          description: "직원별 시스템 접근 권한 설정",
          steps: [
            "직원 목록에서 권한을 변경할 직원을 선택합니다",
            "직원 상세 페이지에서 '권한 설정' 탭을 클릭합니다",
            "메뉴별 접근 권한을 체크박스로 설정합니다",
            "변경 사항을 저장합니다"
          ]
        }
      ]
    },
    {
      id: "products",
      title: "상품 관리",
      description: "회원권, 개인 레슨 등 상품 등록 및 관리",
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      items: [
        {
          title: "상품 등록",
          description: "새로운 상품을 등록하는 방법",
          steps: [
            "상품 메뉴에서 '상품 등록' 버튼을 클릭합니다",
            "상품명, 가격, 기간 등 기본 정보를 입력합니다",
            "상품 종류(회원권, 개인레슨 등)를 선택합니다",
            "할인 정책이나 특별 조건을 설정합니다"
          ]
        },
        {
          title: "가격 관리",
          description: "상품 가격 변경 및 할인 설정",
          steps: [
            "상품 목록에서 가격을 변경할 상품을 선택합니다",
            "'가격 수정' 버튼을 클릭합니다",
            "새로운 가격을 입력하고 적용일을 설정합니다",
            "할인율이나 프로모션 정보를 추가할 수 있습니다"
          ]
        }
      ]
    },
    {
      id: "attendance",
      title: "출석 관리",
      description: "회원 출석 체크 및 출석 현황 관리",
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-50",
      items: [
        {
          title: "출석 체크",
          description: "회원 출석을 체크하는 방법",
          steps: [
            "출석 메뉴에서 오늘 날짜를 선택합니다",
            "출석할 회원을 검색하거나 목록에서 선택합니다",
            "'출석' 버튼을 클릭하여 출석을 기록합니다",
            "출석 시간이 자동으로 기록됩니다"
          ]
        },
        {
          title: "출석 현황 확인",
          description: "회원별 출석 현황을 확인하는 방법",
          steps: [
            "출석 메뉴에서 '현황' 탭을 선택합니다",
            "기간을 설정하여 출석 현황을 조회합니다",
            "회원별 출석률을 확인할 수 있습니다",
            "엑셀로 출석 데이터를 내보낼 수 있습니다"
          ]
        }
      ]
    },
    {
      id: "schedule",
      title: "스케줄 관리",
      description: "그룹 수업, 개인 레슨 스케줄 관리",
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      items: [
        {
          title: "그룹 수업 등록",
          description: "정기 그룹 수업을 등록하는 방법",
          steps: [
            "스케줄 메뉴에서 '그룹 수업 등록' 버튼을 클릭합니다",
            "수업명, 강사, 시간 등을 입력합니다",
            "정원과 수업 설명을 추가합니다",
            "반복 일정을 설정하고 저장합니다"
          ]
        },
        {
          title: "개인 레슨 예약",
          description: "개인 레슨 예약을 관리하는 방법",
          steps: [
            "스케줄 메뉴에서 '개인 레슨' 탭을 선택합니다",
            "날짜와 시간을 클릭하여 예약을 생성합니다",
            "회원과 트레이너를 선택합니다",
            "레슨 내용과 특이사항을 입력합니다"
          ]
        }
      ]
    },
    {
      id: "statistics",
      title: "통계 및 분석",
      description: "매출 통계, 회원 현황 분석",
      icon: BarChart3,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      items: [
        {
          title: "매출 통계 확인",
          description: "월별 매출 통계를 확인하는 방법",
          steps: [
            "통계 메뉴에서 '매출 통계' 탭을 선택합니다",
            "조회하고 싶은 월을 선택합니다",
            "카테고리별 매출을 확인할 수 있습니다",
            "그래프로 시각화된 데이터를 볼 수 있습니다"
          ]
        },
        {
          title: "데이터 내보내기",
          description: "통계 데이터를 엑셀로 내보내는 방법",
          steps: [
            "통계 페이지에서 '엑셀 다운로드' 버튼을 클릭합니다",
            "내보낼 데이터 범위를 선택합니다",
            "파일이 자동으로 다운로드됩니다",
            "엑셀에서 추가 분석을 할 수 있습니다"
          ]
        }
      ]
    }
  ];

  const filteredCategories = guideCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedGuide) {
    const category = guideCategories.find(c => c.id === selectedGuide);
    if (!category) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedGuide(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Button>
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${category.bgColor} rounded-lg`}>
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{category.title}</h1>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                홈으로
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {category.items.map((item, index) => (
              <Card key={index} className="h-full">
                <CardAccentLine />
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className={`w-8 h-8 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                      <span className={`text-sm font-bold ${category.color}`}>{index + 1}</span>
                    </div>
                    <span>{item.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  {item.steps && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-800">단계별 가이드:</h4>
                      <ul className="space-y-2">
                        {item.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-blue-600">{stepIndex + 1}</span>
                            </div>
                            <span className="text-sm text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">사용법 가이드</h1>
                <p className="text-sm text-gray-600">시스템 사용 방법 및 단계별 안내</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="사용법 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 빠른 시작 가이드 */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardAccentLine />
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">빠른 시작 가이드</h3>
                  <p className="text-sm text-gray-600">처음 사용하시는 분들을 위한 필수 기능 안내</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1</div>
                    <div className="text-xs text-gray-600">회원 등록</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">2</div>
                    <div className="text-xs text-gray-600">상품 생성</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-xs text-gray-600">출석 체크</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 카테고리 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedGuide(category.id)}>
              <CardAccentLine />
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 ${category.bgColor} rounded-lg`}>
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {category.items.length}개 항목
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}