import { storage } from "../storage";
import { computeProfileCompletion } from "./business-profile-helper";
import { summarizeMemberStatuses, type MemberStatus, type MemberStatusCode } from "./member-status-engine";

/**
 * OUHVE ABM — Module 8: Owner Report (첫 화면 데이터)
 *
 * 브리프 #15: "기존 CRM형 첫 화면이 아니라, AI 운영 리포트형 첫 화면"
 *
 * 대표가 OUHVE ABM에 들어왔을 때 보아야 할 단 하나의 화면.
 * 회원 목록이 아니라 "오늘 센터에서 대표가 봐야 할 것".
 *
 * 구성:
 *   1. 인사말 + Business Profile 완성도 (덜 채워졌으면 유도)
 *   2. 오늘의 KPI (활성 회원 / 이번주 만료 / 미처리 업무 / 출석률)
 *   3. AI 운영 제안 (상위 5개 — Member Status Engine의 topPriority 변환)
 *   4. 핵심 리스크 카드 (미납 / 이탈위험 / 만료임박 카운트)
 *   5. 다음 추천 액션 (자연어 — 룰 기반 폴백)
 */

export interface OwnerReport {
  generatedAt: string;
  greeting: string;
  profileCompletion: {
    percent: number;
    isComplete: boolean;
    nudge?: string; // 미완성일 때만
  };
  kpis: {
    activeMembers: number;
    expiringThisWeek: number;
    actionableMembers: number; // 정상관리 외 전체
    weeklyAttendanceRate: number; // 0~1
  };
  topActions: TopAction[];
  riskBreakdown: {
    미납: number;
    이탈위험: number;
    만료임박: number;
    상담미처리: number;
    출석감소: number;
    재등록가능: number;
  };
  narrative: string; // 한 문단 — 오늘의 운영 요약 (자연어)
}

interface TopAction {
  priority: number;
  memberId: number;
  memberName: string;
  status: MemberStatusCode;
  reason: string;
  recommendedAction: string;
}

export async function generateOwnerReport(franchiseId: number): Promise<OwnerReport> {
  const [franchise, statusSummary] = await Promise.all([
    storage.getFranchise(franchiseId),
    summarizeMemberStatuses(franchiseId),
  ]);

  const completion = computeProfileCompletion(franchise ?? null);
  const now = new Date();

  // KPI 계산
  const activeMembers = statusSummary.total;
  const actionableMembers = activeMembers - statusSummary.byStatus.정상관리;
  const expiringThisWeek = statusSummary.byStatus.만료임박 + statusSummary.byStatus.재등록가능;

  // 출석률 — 상위 액션의 dataPoints 평균으로 근사 (정확한 값은 별도 사이클)
  const ratesFromActions = statusSummary.topPriority
    .map((s) => s.dataPoints.recentAttendanceRate)
    .filter((r): r is number => r !== undefined);
  const weeklyAttendanceRate = ratesFromActions.length > 0
    ? ratesFromActions.reduce((a, b) => a + b, 0) / ratesFromActions.length
    : 0;

  // 상위 액션 5개
  const topActions: TopAction[] = statusSummary.topPriority.slice(0, 5).map((s: MemberStatus) => ({
    priority: s.priority,
    memberId: s.memberId,
    memberName: s.memberName,
    status: s.code,
    reason: s.reason,
    recommendedAction: s.recommendedAction,
  }));

  // 리스크 분해
  const riskBreakdown = {
    미납: statusSummary.byStatus.미납,
    이탈위험: statusSummary.byStatus.이탈위험,
    만료임박: statusSummary.byStatus.만료임박,
    상담미처리: statusSummary.byStatus.상담미처리,
    출석감소: statusSummary.byStatus.출석감소,
    재등록가능: statusSummary.byStatus.재등록가능,
  };

  // 인사말
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? "오전" : hour < 18 ? "오후" : "저녁";
  const ownerName = franchise?.ownerName ?? "원장님";
  const greeting = `${ownerName}, 좋은 ${timeOfDay}입니다.`;

  // 자연어 내러티브 (룰 기반 — 추후 Module 7에서 LLM으로 강화)
  const narrative = buildNarrative({
    activeMembers,
    actionableMembers,
    topActions,
    riskBreakdown,
    completion,
  });

  return {
    generatedAt: now.toISOString(),
    greeting,
    profileCompletion: {
      percent: completion.percent,
      isComplete: completion.isComplete,
      nudge: completion.isComplete
        ? undefined
        : `센터 프로필을 ${completion.percent}% 채웠습니다. 나머지 ${completion.total - completion.filled}개 항목을 채우면 더 정확한 제안을 받을 수 있습니다.`,
    },
    kpis: {
      activeMembers,
      expiringThisWeek,
      actionableMembers,
      weeklyAttendanceRate,
    },
    topActions,
    riskBreakdown,
    narrative,
  };
}

interface NarrativeInput {
  activeMembers: number;
  actionableMembers: number;
  topActions: TopAction[];
  riskBreakdown: OwnerReport["riskBreakdown"];
  completion: { isComplete: boolean; percent: number };
}

function buildNarrative(input: NarrativeInput): string {
  const parts: string[] = [];

  if (input.activeMembers === 0) {
    return "아직 회원 데이터가 없습니다. 회원을 등록하면 OUHVE AI가 오늘 해야 할 일을 정리해드립니다.";
  }

  if (!input.completion.isComplete) {
    parts.push(`센터 프로필이 아직 ${input.completion.percent}%만 완성되어 AI 제안의 정확도가 제한적입니다.`);
  }

  parts.push(`오늘 활성 회원 ${input.activeMembers}명 중 ${input.actionableMembers}명이 케어 액션 후보로 식별되었습니다.`);

  const urgent: string[] = [];
  if (input.riskBreakdown.미납 > 0) urgent.push(`미납 ${input.riskBreakdown.미납}명`);
  if (input.riskBreakdown.이탈위험 > 0) urgent.push(`이탈 위험 ${input.riskBreakdown.이탈위험}명`);
  if (input.riskBreakdown.상담미처리 > 0) urgent.push(`상담 후 미처리 ${input.riskBreakdown.상담미처리}명`);
  if (urgent.length > 0) {
    parts.push(`가장 시급한 케이스: ${urgent.join(", ")}.`);
  }

  if (input.riskBreakdown.재등록가능 > 0) {
    parts.push(`재등록 가능성이 높은 회원 ${input.riskBreakdown.재등록가능}명에게 오늘 우선 연락하면 매출 누락을 줄일 수 있습니다.`);
  }

  if (input.topActions.length > 0) {
    parts.push(`아래 추천 액션 ${input.topActions.length}건을 오늘 처리하시면 운영 누락 위험을 크게 낮출 수 있습니다.`);
  }

  return parts.join(" ");
}
