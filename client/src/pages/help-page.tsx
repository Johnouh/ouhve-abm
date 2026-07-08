// 💡 운영 가이드 & 지원센터 (Operation Guide & Support Center)
// 🎯 Purpose: 체육관 운영 전문 지식 및 문제 해결 가이드 제공 (Provide professional gym operation knowledge and troubleshooting guide)
// 🔧 Features: 운영 노하우, 문제 해결, 업계 모범 사례, 기술 지원 (Operation know-how, problem solving, industry best practices, technical support)

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAccentLine } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  HelpCircle, 
  Search,
  PlayCircle,
  Video,
  ChevronRight,
  CheckCircle,
  Keyboard,
  MessageCircle,
  Phone,
  Mail,
  BookOpen,
  ExternalLink,
  Users,
  UserCircle,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  User,
  AlertCircle,
  Heart
} from "lucide-react";

interface HelpPageProps {
  onBack: () => void;
}

export default function HelpPage({ onBack }: HelpPageProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const helpCategories = [
    {
      id: "operation",
      title: "운영 노하우",
      description: "체육관 운영 성공을 위한 전문 지식과 모범 사례",
      icon: Settings,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      items: [
        {
          title: "회원 유지율 향상 전략",
          description: "회원 이탈을 방지하고 장기 회원을 확보하는 실무 노하우",
          details: [
            "신규 회원 온보딩 프로세스 구축",
            "회원 만족도 조사 및 피드백 시스템",
            "개인별 맞춤 프로그램 제공",
            "리워드 시스템 및 이벤트 기획",
            "휴면 회원 복귀 전략"
          ]
        },
        {
          title: "매출 최적화 방법",
          description: "효율적인 매출 관리와 수익성 향상 방안",
          details: [
            "회원권 가격 정책 수립",
            "부가 서비스 상품화 전략",
            "성수기/비수기 대응 방안",
            "트레이너 수수료 최적화",
            "운영비 절감 및 효율화"
          ]
        },
        {
          title: "고객 서비스 향상",
          description: "고객 만족도를 높이는 서비스 운영 가이드",
          details: [
            "고객 응대 매뉴얼 구축",
            "불만 처리 프로세스",
            "VIP 회원 관리 시스템",
            "커뮤니케이션 채널 다양화",
            "서비스 품질 모니터링"
          ]
        }
      ]
    },
    {
      id: "troubleshooting",
      title: "문제 해결",
      description: "자주 발생하는 문제와 해결 방법",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      items: [
        {
          title: "시스템 오류 해결",
          description: "시스템 사용 중 발생할 수 있는 오류 상황 대처법",
          details: [
            "로그인 문제 해결",
            "데이터 동기화 오류 처리",
            "결제 시스템 문제 대응",
            "네트워크 연결 문제 해결",
            "브라우저 호환성 문제"
          ]
        },
        {
          title: "회원 관련 문제",
          description: "회원 관리 업무 중 발생하는 문제 해결 가이드",
          details: [
            "회원권 연장/환불 처리",
            "출입 권한 문제 해결",
            "중복 회원 정리 방법",
            "결제 분쟁 처리",
            "개인정보 변경 요청 처리"
          ]
        },
        {
          title: "직원 관리 문제",
          description: "직원 관련 업무 처리 시 발생하는 문제 해결",
          details: [
            "권한 설정 문제 해결",
            "근무 기록 오류 수정",
            "급여 계산 문제 처리",
            "직원 계정 관리",
            "업무 분장 및 책임 명확화"
          ]
        }
      ]
    },
    {
      id: "best-practices",
      title: "업계 모범 사례",
      description: "성공적인 체육관 운영을 위한 업계 표준",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      items: [
        {
          title: "안전 관리 기준",
          description: "체육관 운영 시 반드시 준수해야 할 안전 관리 기준",
          details: [
            "기구 안전 점검 체크리스트",
            "응급상황 대응 매뉴얼",
            "회원 안전 교육 프로그램",
            "시설 위생 관리 기준",
            "사고 예방 및 대응 절차"
          ]
        },
        {
          title: "개인정보 보호",
          description: "회원 개인정보 보호를 위한 필수 준수 사항",
          details: [
            "개인정보 수집 및 이용 동의",
            "정보 보안 관리 체계",
            "접근 권한 관리",
            "데이터 백업 및 복구",
            "개인정보 파기 절차"
          ]
        },
        {
          title: "법적 준수 사항",
          description: "체육관 운영 관련 법규 준수 가이드",
          details: [
            "체육시설업 등록 및 신고",
            "소방 및 건축 관련 법규",
            "근로기준법 준수",
            "소비자보호법 준수",
            "세무 관련 준수 사항"
          ]
        }
      ]
    },
    {
      id: "marketing",
      title: "마케팅 전략",
      description: "효과적인 마케팅과 홍보 전략",
      icon: Heart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      items: [
        {
          title: "디지털 마케팅",
          description: "온라인 채널을 활용한 효과적인 마케팅 방법",
          details: [
            "소셜미디어 마케팅 전략",
            "구글 마이비즈니스 활용법",
            "온라인 광고 최적화",
            "콘텐츠 마케팅 기획",
            "리뷰 관리 및 평판 관리"
          ]
        },
        {
          title: "오프라인 마케팅",
          description: "지역 사회와 연계한 오프라인 마케팅 전략",
          details: [
            "지역 커뮤니티 참여",
            "기업 복지 프로그램 제안",
            "이벤트 및 프로모션 기획",
            "파트너십 구축",
            "추천 시스템 운영"
          ]
        },
        {
          title: "고객 세분화",
          description: "고객 유형별 맞춤 마케팅 전략",
          details: [
            "연령대별 프로그램 차별화",
            "목적별 운동 프로그램",
            "시간대별 타겟팅",
            "라이프스타일 기반 세분화",
            "개인화된 마케팅 메시지"
          ]
        }
      ]
    },
    {
      id: "data-analysis",
      title: "데이터 분석",
      description: "운영 데이터를 활용한 의사결정 지원",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      items: [
        {
          title: "핵심 지표 관리",
          description: "체육관 운영 성과를 측정하는 핵심 지표",
          details: [
            "회원 유지율 (Retention Rate)",
            "평균 회원 생애 가치 (LTV)",
            "시설 이용률",
            "트레이너 생산성",
            "마케팅 ROI 측정"
          ]
        },
        {
          title: "트렌드 분석",
          description: "데이터를 통한 운영 트렌드 파악",
          details: [
            "월별/계절별 이용 패턴",
            "인기 프로그램 분석",
            "회원 행동 패턴 분석",
            "경쟁사 비교 분석",
            "시장 동향 파악"
          ]
        },
        {
          title: "예측 분석",
          description: "데이터 기반 미래 전망 및 계획 수립",
          details: [
            "매출 예측 모델",
            "회원 증감 예측",
            "시설 투자 계획",
            "인력 계획 수립",
            "위험 요소 사전 감지"
          ]
        }
      ]
    },
    {
      id: "technical-support",
      title: "기술 지원",
      description: "시스템 사용 및 기술적 문제 해결",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      items: [
        {
          title: "시스템 최적화",
          description: "시스템 성능 향상을 위한 최적화 방법",
          details: [
            "데이터베이스 최적화",
            "서버 성능 모니터링",
            "보안 업데이트 관리",
            "백업 시스템 구축",
            "성능 개선 방안"
          ]
        },
        {
          title: "통합 연동",
          description: "외부 시스템과의 연동 및 통합 가이드",
          details: [
            "결제 시스템 연동",
            "출입 통제 시스템",
            "회계 프로그램 연동",
            "SMS/이메일 발송",
            "API 활용 가이드"
          ]
        },
        {
          title: "업데이트 관리",
          description: "시스템 업데이트 및 유지보수 가이드",
          details: [
            "정기 업데이트 절차",
            "기능 개선 요청",
            "버그 리포트 방법",
            "사용자 피드백 수집",
            "업데이트 알림 설정"
          ]
        }
      ]
    }
  ];

  const quickTips = [
    {
      category: "운영 효율성",
      tips: [
        { title: "피크 시간 관리", description: "오후 6-8시 회원 집중 시간대 직원 배치 최적화" },
        { title: "회원 리텐션", description: "3개월 주기 만족도 조사로 이탈 징후 사전 파악" },
        { title: "공간 활용", description: "시간대별 프로그램 배치로 공간 효율성 극대화" },
        { title: "비용 절감", description: "에너지 효율적인 운영으로 월 10-15% 비용 절감 가능" }
      ]
    },
    {
      category: "고객 서비스",
      tips: [
        { title: "첫 인상 관리", description: "신규 회원 첫 방문 시 전담 직원 배정" },
        { title: "피드백 시스템", description: "익명 건의함 설치로 솔직한 의견 수렴" },
        { title: "개인화 서비스", description: "회원별 운동 기록 추적 및 맞춤 조언 제공" },
        { title: "커뮤니티 구축", description: "정기 이벤트로 회원 간 네트워킹 촉진" }
      ]
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCategory) {
    const category = helpCategories.find(c => c.id === selectedCategory);
    if (!category) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>
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
                  {item.details && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-800">상세 내용:</h4>
                      <ul className="space-y-1">
                        {item.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{detail}</span>
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
      {/* 새로운 헤더 디자인 - 홈페이지와 동일한 스타일 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">운영 가이드 & 지원센터</h1>
                <p className="text-sm text-gray-600">체육관 운영 전문 지식과 문제 해결 솔루션</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 검색 기능 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="운영 가이드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 체육관 운영 핵심 지표 */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardAccentLine />
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">체육관 운영 핵심 지표</h3>
                  <p className="text-sm text-gray-600">성공적인 체육관 운영을 위한 필수 성과 지표와 목표 기준</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">85%</div>
                    <div className="text-xs text-gray-600">회원 유지율</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₩1.2M</div>
                    <div className="text-xs text-gray-600">회원 LTV</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">75%</div>
                    <div className="text-xs text-gray-600">시설 이용률</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메인 카테고리 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedCategory(category.id)}>
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

        {/* 운영 팁 & 노하우 */}
        <Card className="mb-8">
          <CardAccentLine />
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-orange-600" />
              <span>운영 팁 & 노하우</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickTips.map((section, index) => (
                <div key={index} className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>{section.category}</span>
                  </h4>
                  <div className="space-y-3">
                    {section.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className="p-3 bg-gray-50 rounded-lg hover-elevate transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle className="w-3 h-3 text-orange-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 text-sm">{tip.title}</h5>
                            <p className="text-xs text-gray-600 mt-1">{tip.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 전문 지원 & 컨설팅 */}
        <Card>
          <CardAccentLine />
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-orange-600" />
              <span>전문 지원 & 컨설팅</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Phone className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">운영 컨설팅</h4>
                <p className="text-sm text-gray-600 mt-1">체육관 운영 전문가 상담</p>
                <p className="text-sm font-medium text-orange-600 mt-2">1588-9999</p>
                <p className="text-xs text-gray-500 mt-1">평일 09:00 - 18:00</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Mail className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">기술 지원</h4>
                <p className="text-sm text-gray-600 mt-1">시스템 오류 및 기술 문의</p>
                <p className="text-sm font-medium text-orange-600 mt-2">tech@ouhve.app</p>
                <p className="text-xs text-gray-500 mt-1">24시간 접수</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">교육 프로그램</h4>
                <p className="text-sm text-gray-600 mt-1">직원 교육 및 워크샵</p>
                <Button variant="outline" size="sm" className="mt-2 border-green-200 text-green-600 hover-elevate">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  신청하기
                </Button>
              </div>
            </div>
            
            {/* 추가 지원 정보 */}
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">전담 매니저 서비스</h4>
                  <p className="text-sm text-gray-600">월 매출 1,000만원 이상 체육관 대상 전담 매니저 배정</p>
                </div>
                <Button variant="outline" size="sm" className="bg-white">
                  문의하기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}