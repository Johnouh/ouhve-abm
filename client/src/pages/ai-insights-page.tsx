import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, ArrowUp, ArrowDown, Minus, RefreshCw, Zap, Users, User } from "lucide-react";

export default function AiInsightsPage() {
  const {
    data: churnData,
    isLoading: churnLoading,
    refetch: refetchChurn,
  } = useQuery<any>({
    queryKey: ["/api/ai/churn-analysis"],
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const {
    data: revenueInsights,
    isLoading: revenueLoading,
    refetch: refetchRevenue,
  } = useQuery<any>({
    queryKey: ["/api/ai/revenue-insights"],
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="p-3 md:p-6 bg-gray-50 min-h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <Brain className="w-5 h-5 text-purple-500 shrink-0" />
          <h1 className="text-base md:text-lg font-semibold text-gray-900">AI 인사이트</h1>
          <span className="text-xs text-gray-400 ml-1 hidden md:inline">Claude AI 기반 분석</span>
        </div>
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
        {/* 로딩 스켈레톤 */}
        {(churnLoading || revenueLoading) && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-36 bg-gray-200 rounded-xl" />
          </div>
        )}

        {/* 이탈 위험도 섹션 */}
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

        {/* 매출 예측 섹션 */}
        {!revenueLoading && revenueInsights && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500 shrink-0" />
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
                    <Brain className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-700">AI 분석 인사이트</h3>
                  </div>
                  <ul className="space-y-2">
                    {revenueInsights.insights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs flex-shrink-0 flex items-center justify-center font-medium">{i + 1}</span>
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
                    <Zap className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-700">권장 액션</h3>
                  </div>
                  <div className="space-y-2">
                    {revenueInsights.recommendedActions.map((action: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <span className="text-blue-500 font-bold text-sm mt-0.5 flex-shrink-0">→</span>
                        <span className="text-sm text-blue-800">{action}</span>
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

        {/* 에러 / 데이터 없음 */}
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
