// 🤖 AI 서비스 - Claude API 기반 분석 (AI Service - Claude API-based analytics)
// 회원 이탈 예측 + 매출 예측 인사이트 제공 (Member churn prediction + revenue insight)

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ──────────────────────────────────────────────────
// 타입 정의 (Type definitions)
// ──────────────────────────────────────────────────

export interface MemberChurnMetrics {
  memberId: number;
  memberName: string;
  daysSinceLastVisit: number;
  membershipDaysLeft: number;
  ptSessionsLeft: number;
  visitFrequency30d: number;
  hasActiveMembership: boolean;
}

export interface ChurnRiskItem {
  memberId: number;
  memberName: string;
  riskLevel: "high" | "medium" | "low";
  riskScore: number;
  reasons: string[];
  daysSinceLastVisit: number;
  membershipDaysLeft: number;
}

export interface ChurnAnalysisResult {
  summary: { high: number; medium: number; low: number; total: number };
  highRiskMembers: ChurnRiskItem[];
  mediumRiskMembers: ChurnRiskItem[];
  generatedAt: string;
}

export interface RevenueInsightResult {
  predictedNextMonthRevenue: number;
  predictedGrowthRate: number;
  insights: string[];
  recommendedActions: string[];
  categoryTrends: { category: string; trend: "up" | "down" | "stable"; changePercent: number }[];
  generatedAt: string;
}

// ──────────────────────────────────────────────────
// 서버 메모리 캐시 (In-memory cache - 1시간 TTL)
// ──────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ──────────────────────────────────────────────────
// 회원 이탈 위험도 분석 (Member churn risk analysis)
// ──────────────────────────────────────────────────

export async function analyzeChurnRisk(
  franchiseId: number,
  franchiseData: {
    members: any[];
    attendanceList: any[];
    memberships: any[];
    personalTrainings: any[];
  }
): Promise<ChurnAnalysisResult> {
  const cacheKey = `churn-${franchiseId}`;
  const cached = getCached<ChurnAnalysisResult>(cacheKey);
  if (cached) return cached;

  const { members, attendanceList, memberships, personalTrainings } = franchiseData;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 각 회원의 이탈 지표 사전 계산 (Pre-calculate churn metrics per member)
  const metricsPerMember: MemberChurnMetrics[] = members
    .filter(m => m.status === "활성 회원" || m.status === "active")
    .map(member => {
      // 마지막 출석일 계산
      const memberAttendances = attendanceList
        .filter(a => a.memberId === member.id)
        .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
      const lastVisit = memberAttendances[0]
        ? new Date(memberAttendances[0].checkInTime)
        : member.lastVisit
        ? new Date(member.lastVisit)
        : null;
      const daysSinceLastVisit = lastVisit
        ? Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // 최근 30일 방문 횟수
      const visitFrequency30d = attendanceList.filter(
        a => a.memberId === member.id && new Date(a.checkInTime) >= thirtyDaysAgo
      ).length;

      // 활성 회원권 잔여일
      const activeMembership = memberships
        .filter(m => m.memberId === member.id && m.status === "활성")
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
      const membershipDaysLeft = activeMembership
        ? Math.max(0, Math.floor((new Date(activeMembership.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      // 잔여 PT 세션
      const activePt = personalTrainings.find(
        pt => pt.memberId === member.id && pt.status === "활성" && pt.remainingSessions > 0
      );
      const ptSessionsLeft = activePt ? activePt.remainingSessions : 0;

      return {
        memberId: member.id,
        memberName: member.name,
        daysSinceLastVisit,
        membershipDaysLeft,
        ptSessionsLeft,
        visitFrequency30d,
        hasActiveMembership: !!activeMembership,
      };
    });

  if (metricsPerMember.length === 0) {
    const result: ChurnAnalysisResult = {
      summary: { high: 0, medium: 0, low: 0, total: 0 },
      highRiskMembers: [],
      mediumRiskMembers: [],
      generatedAt: now.toISOString(),
    };
    setCached(cacheKey, result);
    return result;
  }

  // Claude에게 분석 요청 (Request analysis from Claude)
  const prompt = `당신은 헬스장 회원 이탈 분석 전문가입니다. 아래 회원 데이터를 분석하여 이탈 위험도를 평가하세요.

회원 지표 데이터:
${JSON.stringify(metricsPerMember, null, 2)}

각 회원에 대해 다음 기준으로 위험도를 평가하세요:
- HIGH (고위험): 마지막 방문 14일 초과 + (회원권 만료 7일 이내 또는 PT 세션 없음)
- MEDIUM (중위험): 마지막 방문 7-14일 + 최근 30일 방문 3회 미만
- LOW (저위험): 정기적으로 방문 중

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "members": [
    {
      "memberId": 숫자,
      "riskLevel": "high" | "medium" | "low",
      "riskScore": 0-100 사이 숫자,
      "reasons": ["이유1", "이유2"]
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "{}";
    const parsed = JSON.parse(responseText);

    const enrichedMembers: ChurnRiskItem[] = (parsed.members || []).map((item: any) => {
      const metrics = metricsPerMember.find(m => m.memberId === item.memberId);
      return {
        memberId: item.memberId,
        memberName: metrics?.memberName || `회원 ${item.memberId}`,
        riskLevel: item.riskLevel,
        riskScore: item.riskScore,
        reasons: item.reasons || [],
        daysSinceLastVisit: metrics?.daysSinceLastVisit ?? 0,
        membershipDaysLeft: metrics?.membershipDaysLeft ?? 0,
      };
    });

    const result: ChurnAnalysisResult = {
      summary: {
        high: enrichedMembers.filter(m => m.riskLevel === "high").length,
        medium: enrichedMembers.filter(m => m.riskLevel === "medium").length,
        low: enrichedMembers.filter(m => m.riskLevel === "low").length,
        total: enrichedMembers.length,
      },
      highRiskMembers: enrichedMembers
        .filter(m => m.riskLevel === "high")
        .sort((a, b) => b.riskScore - a.riskScore),
      mediumRiskMembers: enrichedMembers
        .filter(m => m.riskLevel === "medium")
        .sort((a, b) => b.riskScore - a.riskScore),
      generatedAt: now.toISOString(),
    };

    setCached(cacheKey, result);
    return result;
  } catch (err) {
    // Claude 호출 실패 시 규칙 기반 폴백 (Rule-based fallback when Claude fails)
    return buildRuleBasedChurnResult(metricsPerMember, now);
  }
}

// 규칙 기반 이탈 분석 폴백 (Rule-based churn analysis fallback)
function buildRuleBasedChurnResult(
  metrics: MemberChurnMetrics[],
  now: Date
): ChurnAnalysisResult {
  const items: ChurnRiskItem[] = metrics.map(m => {
    const reasons: string[] = [];
    let score = 0;

    if (m.daysSinceLastVisit > 30) { score += 50; reasons.push(`${m.daysSinceLastVisit}일째 미방문`); }
    else if (m.daysSinceLastVisit > 14) { score += 30; reasons.push(`최근 ${m.daysSinceLastVisit}일간 미방문`); }

    if (!m.hasActiveMembership) { score += 30; reasons.push("활성 회원권 없음"); }
    else if (m.membershipDaysLeft <= 7) { score += 20; reasons.push(`회원권 ${m.membershipDaysLeft}일 후 만료`); }

    if (m.visitFrequency30d < 2) { score += 15; reasons.push("최근 30일 방문 2회 미만"); }

    const riskLevel: "high" | "medium" | "low" =
      score >= 50 ? "high" : score >= 25 ? "medium" : "low";

    return { memberId: m.memberId, memberName: m.memberName, riskLevel, riskScore: Math.min(score, 100), reasons, daysSinceLastVisit: m.daysSinceLastVisit, membershipDaysLeft: m.membershipDaysLeft };
  });

  return {
    summary: {
      high: items.filter(i => i.riskLevel === "high").length,
      medium: items.filter(i => i.riskLevel === "medium").length,
      low: items.filter(i => i.riskLevel === "low").length,
      total: items.length,
    },
    highRiskMembers: items.filter(i => i.riskLevel === "high").sort((a, b) => b.riskScore - a.riskScore),
    mediumRiskMembers: items.filter(i => i.riskLevel === "medium").sort((a, b) => b.riskScore - a.riskScore),
    generatedAt: now.toISOString(),
  };
}

// ──────────────────────────────────────────────────
// 매출 예측 & 인사이트 (Revenue prediction & insights)
// ──────────────────────────────────────────────────

export async function analyzeRevenueInsights(
  franchiseId: number,
  franchiseData: {
    payments: any[];
    members: any[];
    products: any[];
  }
): Promise<RevenueInsightResult> {
  const cacheKey = `revenue-${franchiseId}`;
  const cached = getCached<RevenueInsightResult>(cacheKey);
  if (cached) return cached;

  const { payments, members, products } = franchiseData;
  const now = new Date();

  // 최근 6개월 월별 매출 집계 (Aggregate monthly revenue for last 6 months)
  const monthlyRevenue: { month: string; total: number; membership: number; pt: number; locker: number; other: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthPayments = payments.filter(p => {
      const pd = new Date(p.paymentDate);
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && p.status === "완료";
    });

    const getCategory = (p: any): string => {
      if (p.productId) {
        const prod = products.find((pr: any) => pr.id === p.productId);
        if (prod?.category) return prod.category;
      }
      const desc = p.description || "";
      if (desc.includes("락커")) return "락커";
      if (desc.includes("레슨") || desc.includes("PT")) return "개인PT";
      if (desc.includes("회원권") || desc.includes("회원")) return "회원권";
      return "기타";
    };

    monthlyRevenue.push({
      month: monthLabel,
      total: monthPayments.reduce((s, p) => s + p.amount, 0),
      membership: monthPayments.filter(p => getCategory(p) === "회원권").reduce((s, p) => s + p.amount, 0),
      pt: monthPayments.filter(p => getCategory(p) === "개인PT").reduce((s, p) => s + p.amount, 0),
      locker: monthPayments.filter(p => getCategory(p) === "락커").reduce((s, p) => s + p.amount, 0),
      other: monthPayments.filter(p => !["회원권", "개인PT", "락커"].includes(getCategory(p))).reduce((s, p) => s + p.amount, 0),
    });
  }

  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.total || 0;
  const prevMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.total || 0;
  const activeMembers = members.filter(m => m.status === "활성 회원" || m.status === "active").length;

  const prompt = `당신은 헬스장 매출 분석 전문가입니다. 아래 데이터를 분석하여 다음 달 매출을 예측하고 인사이트를 제공하세요.

최근 6개월 월별 매출 데이터:
${JSON.stringify(monthlyRevenue, null, 2)}

현황:
- 현재 활성 회원 수: ${activeMembers}명
- 이번 달 매출: ${currentMonthRevenue.toLocaleString()}원
- 전월 매출: ${prevMonthRevenue.toLocaleString()}원

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이, 원 단위 숫자):
{
  "predictedNextMonthRevenue": 숫자,
  "predictedGrowthRate": 퍼센트(-100~100),
  "insights": ["인사이트1", "인사이트2", "인사이트3"],
  "recommendedActions": ["추천액션1", "추천액션2"],
  "categoryTrends": [
    {"category": "회원권", "trend": "up"|"down"|"stable", "changePercent": 숫자},
    {"category": "개인PT", "trend": "up"|"down"|"stable", "changePercent": 숫자},
    {"category": "락커", "trend": "up"|"down"|"stable", "changePercent": 숫자}
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "{}";
    const parsed = JSON.parse(responseText);

    const result: RevenueInsightResult = {
      predictedNextMonthRevenue: parsed.predictedNextMonthRevenue || 0,
      predictedGrowthRate: parsed.predictedGrowthRate || 0,
      insights: parsed.insights || [],
      recommendedActions: parsed.recommendedActions || [],
      categoryTrends: parsed.categoryTrends || [],
      generatedAt: now.toISOString(),
    };

    setCached(cacheKey, result);
    return result;
  } catch (err) {
    // 폴백: 단순 계산 기반 예측 (Fallback: simple calculation-based prediction)
    const avgRevenue = monthlyRevenue.reduce((s, m) => s + m.total, 0) / monthlyRevenue.length;
    const growth = prevMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 0;

    const result: RevenueInsightResult = {
      predictedNextMonthRevenue: Math.round(avgRevenue),
      predictedGrowthRate: growth,
      insights: [
        `최근 6개월 평균 월 매출: ${Math.round(avgRevenue).toLocaleString()}원`,
        `전월 대비 ${growth >= 0 ? "+" : ""}${growth}% 변화`,
        `활성 회원 ${activeMembers}명 기반 분석`,
      ],
      recommendedActions: [
        "만료 예정 회원에게 갱신 알림 발송",
        "비활성 회원 재방문 프로모션 진행",
      ],
      categoryTrends: [
        { category: "회원권", trend: "stable", changePercent: 0 },
        { category: "개인PT", trend: "stable", changePercent: 0 },
        { category: "락커", trend: "stable", changePercent: 0 },
      ],
      generatedAt: now.toISOString(),
    };

    setCached(cacheKey, result);
    return result;
  }
}
