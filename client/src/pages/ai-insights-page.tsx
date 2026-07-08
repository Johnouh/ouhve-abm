import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Brain, AlertTriangle, ArrowUp, ArrowDown, Minus, RefreshCw, Zap, Users, User,
  History, FileText, Building2, Filter, CalendarPlus, ScrollText,
} from "lucide-react";
import OuhveActivityPage from "./ouhve-activity-page";
import OwnerReportPage from "./owner-report-page";
import BusinessProfilePage from "./business-profile-page";
import SalesPipelinePage from "./sales-pipeline-page";
import BulkExtendPage from "./bulk-extend-page";
import AuditLogPage from "./audit-log-page";

// AI 인사이트 = Ouhve AI가 센터 데이터를 분석해 "무엇을 어떻게 처리했는지"를 한 페이지에서 탭으로 본다.
const TABS = [
  { key: "activity", label: "AI 작업 내역", icon: History, desc: "AI가 처리한 작업", render: () => <OuhveActivityPage /> },
  { key: "report", label: "운영 리포트", icon: FileText, desc: "오늘 봐야 할 것", render: () => <OwnerReportPage /> },
  { key: "insights", label: "이탈·매출 분석", icon: AlertTriangle, desc: "위험·예측", render: () => <LegacyInsights /> },
  { key: "profile", label: "센터 프로필", icon: Building2, desc: "AI 컨텍스트", render: () => <BusinessProfilePage /> },
  { key: "pipeline", label: "예비회원", icon: Filter, desc: "상담 칸반", render: () => <SalesPipelinePage /> },
  { key: "bulk", label: "단체 연장", icon: CalendarPlus, desc: "휴장/이벤트 보상", render: () => <BulkExtendPage /> },
  { key: "audit", label: "감사 로그", icon: ScrollText, desc: "변경 이력 추적", render: () => <AuditLogPage /> },
] as const;

export default function AiInsightsPage() {
  return (
    <div className="bg-gray-50 min-h-full">
      {/* 헤더 */}
      <div className="px-3 md:px-6 pt-3 md:pt-6">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-semibold text-gray-900 leading-tight">AI 인사이트</h1>
            <p className="text-[11px] md:text-xs text-gray-500 truncate">
              Ouhve AI가 센터 데이터를 분석해 처리한 작업과 인사이트를 한곳에서 확인하세요
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        {/* 탭 바 — 모바일 가로 스크롤 */}
        <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur border-b border-gray-200 mt-3 px-3 md:px-6 overflow-x-auto">
          <TabsList className="h-auto bg-transparent p-0 gap-1 justify-start">
            {TABS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-2.5 py-2.5 text-gray-500 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TABS.map(({ key, render }) => (
          <TabsContent key={key} value={key} className="mt-0">
            {render()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ── 기존 이탈/매출 인사이트 (오렌지 통일) ────────────────────────────────
function LegacyInsights() {
  const { data: churnData, isLoading: churnLoading, refetch: refetchChurn } =
    useQuery<any>({ queryKey: ["/api/ai/churn-analysis"], staleTime: 60 * 60 * 1000, retry: 1 });
  const { data: revenueInsights, isLoading: revenueLoading, refetch: refetchRevenue } =
    useQuery<any>({ queryKey: ["/api/ai/revenue-insights"], staleTime: 60 * 60 * 1000, retry: 1 });

  return (
    <div className="p-3 md:p-6">
      <div className="flex items-center justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchChurn(); refetchRevenue(); }}
          className="text-gray-600 border-gray-300 px-3 h-8"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          새로고침
        </Button>
      </div>

      <div className="space-y-6">
        {(churnLoading || revenueLoading) && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
            </div>
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        )}

        {/* 이탈 위험도 */}
        {!churnLoading && churnData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <h2 className="text-base font-semibold text-gray-900">이탈 위험 분석</h2>
              <span className="text-xs text-gray-400 ml-1">총 {churnData.summary?.total ?? 0}명 분석</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Card className="border-red-200 bg-red-50">
                <CardAccentLine />
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 tabular-nums">{churnData.summary?.high ?? 0}명</div>
                    <div className="text-xs text-red-500 font-medium">고위험</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardAccentLine />
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Minus className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600 tabular-nums">{churnData.summary?.medium ?? 0}명</div>
                    <div className="text-xs text-amber-500 font-medium">중위험</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-emerald-50">
                <CardAccentLine />
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600 tabular-nums">{churnData.summary?.low ?? 0}명</div>
                    <div className="text-xs text-emerald-500 font-medium">저위험</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {((churnData.highRiskMembers?.length ?? 0) > 0 || (churnData.mediumRiskMembers?.length ?? 0) > 0) ? (
              <Card className="bg-white">
                <CardAccentLine />
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">주의 필요 회원</h3>
                  <div className="space-y-2">
                    {[...(churnData.highRiskMembers || []), ...(churnData.mediumRiskMembers || [])]
                      .slice(0, 10)
                      .map((member: any) => (
                        <div key={member.memberId} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 hover-elevate transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 hidden sm:flex">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900">{member.memberName}</div>
                              <div className="text-xs text-gray-500">
                                {member.daysSinceLastVisit >= 999 ? "방문 기록 없음" : `${member.daysSinceLastVisit}일 전 방문`}
                                {member.membershipDaysLeft > 0 && ` · 회원권 ${member.membershipDaysLeft}일 남음`}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2 md:ml-3">
                            <Badge variant="outline" className={`text-xs ${member.riskLevel === "high" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                              {member.riskLevel === "high" ? "고위험" : "중위험"}
                            </Badge>
                            <div className="text-xs text-gray-400 text-right max-w-[140px] md:max-w-[200px]">
                              {member.reasons?.slice(0, 2).join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white">
                <CardAccentLine />
                <CardContent className="p-8 text-center text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p className="font-medium text-emerald-600">이탈 위험 회원이 없습니다</p>
                  <p className="text-sm mt-1">모든 활성 회원이 정기적으로 방문 중입니다.</p>
                </CardContent>
              </Card>
            )}

            <div className="text-xs text-gray-400 text-right">
              마지막 분석: {churnData.generatedAt ? new Date(churnData.generatedAt).toLocaleString("ko-KR") : "-"}
            </div>
          </div>
        )}

        {/* 매출 예측 */}
        {!revenueLoading && revenueInsights && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary shrink-0" />
              <h2 className="text-base font-semibold text-gray-900">매출 예측 & 인사이트</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Card className="bg-white">
                <CardAccentLine />
                <CardContent className="p-4">
                  <div className="text-xs text-gray-500 mb-1">다음 달 예상 매출</div>
                  <div className="text-2xl font-bold text-gray-900 tabular-nums">
                    {(revenueInsights.predictedNextMonthRevenue || 0).toLocaleString()}원
                  </div>
                  <div className={`flex items-center gap-1 mt-1.5 text-sm font-medium tabular-nums ${revenueInsights.predictedGrowthRate > 0 ? "text-emerald-600" : revenueInsights.predictedGrowthRate < 0 ? "text-red-500" : "text-gray-500"}`}>
                    {revenueInsights.predictedGrowthRate > 0 ? <ArrowUp className="w-4 h-4 shrink-0" /> : revenueInsights.predictedGrowthRate < 0 ? <ArrowDown className="w-4 h-4 shrink-0" /> : <Minus className="w-4 h-4 shrink-0" />}
                    {revenueInsights.predictedGrowthRate > 0 ? "+" : ""}{revenueInsights.predictedGrowthRate ?? 0}% 전월 대비
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardAccentLine />
                <CardContent className="p-4">
                  <div className="text-xs text-gray-500 mb-2">카테고리별 트렌드</div>
                  <div className="space-y-2">
                    {(revenueInsights.categoryTrends || []).map((t: any) => (
                      <div key={t.category} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{t.category}</span>
                        <div className={`flex items-center gap-1 font-medium tabular-nums ${t.trend === "up" ? "text-emerald-600" : t.trend === "down" ? "text-red-500" : "text-gray-500"}`}>
                          {t.trend === "up" ? <ArrowUp className="w-3.5 h-3.5 shrink-0" /> : t.trend === "down" ? <ArrowDown className="w-3.5 h-3.5 shrink-0" /> : <Minus className="w-3.5 h-3.5 shrink-0" />}
                          {t.changePercent > 0 ? "+" : ""}{t.changePercent}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {(revenueInsights.insights?.length ?? 0) > 0 && (
              <Card className="bg-white">
                <CardAccentLine />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-gray-700">AI 분석 인사이트</h3>
                  </div>
                  <ul className="space-y-2">
                    {revenueInsights.insights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex-shrink-0 flex items-center justify-center font-medium">{i + 1}</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {(revenueInsights.recommendedActions?.length ?? 0) > 0 && (
              <Card className="bg-white">
                <CardAccentLine />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-gray-700">권장 액션</h3>
                  </div>
                  <div className="space-y-2">
                    {revenueInsights.recommendedActions.map((action: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
                        <span className="text-primary font-bold text-sm mt-0.5 flex-shrink-0">→</span>
                        <span className="text-sm text-orange-800">{action}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-xs text-gray-400 text-right">
              마지막 분석: {revenueInsights.generatedAt ? new Date(revenueInsights.generatedAt).toLocaleString("ko-KR") : "-"}
            </div>
          </div>
        )}

        {!churnLoading && !revenueLoading && !churnData && !revenueInsights && (
          <Card className="bg-white">
            <CardAccentLine />
            <CardContent className="p-8 text-center text-gray-500">
              <Brain className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">AI 분석을 불러올 수 없습니다</p>
              <p className="text-sm mt-1">잠시 후 새로고침을 시도해주세요.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
