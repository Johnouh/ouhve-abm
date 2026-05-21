import { summarizeMemberStatuses, type MemberStatus } from "./member-status-engine";
import { getLockerOverview } from "./locker-overview";
import { countGuardianPushEnabled } from "./guardian-notification";

/**
 * OUHVE ABM — PushPress GAP-8 흡수
 *
 * "Daily Priorities" — Owner Report를 "조회형"에서 "실행형"으로 전환.
 * PushPress 통찰: "Information → Direction" — 데이터를 보여주기만 하면
 * 운영자가 결정 부담을 짊어진다. 시스템이 "오늘 할 것"을 직접 제안.
 *
 * 산출: 오늘 처리 액션 Top 10, 카테고리별 그룹핑, 1-클릭 실행 후보.
 */

export type ActionCategory = "긴급" | "재등록" | "케어" | "운영" | "기회";
export type ActionType =
  | "call_member"     // 회원 연락
  | "review_payment"  // 결제 확인
  | "schedule_consultation" // 상담 일정
  | "check_locker"    // 락커 점검
  | "send_notice";    // 공지/메시지

export interface DailyPriority {
  id: string;             // 고유 ID (e.g. "member:42:churn")
  category: ActionCategory;
  type: ActionType;
  title: string;          // 한 줄 액션
  reason: string;         // 데이터 근거
  recommendedDeadline: string; // "오늘" / "이번 주" / "3일 내"
  targetType: "member" | "locker" | "payment";
  targetId: number | null;
  targetLabel: string;
  priorityScore: number;  // 0(최우선) ~ 100
}

export interface DailyPrioritiesPayload {
  generatedAt: string;
  totalActions: number;
  byCategory: Record<ActionCategory, number>;
  priorities: DailyPriority[];
  empty: boolean;
  emptyReason?: string;
}

const CATEGORY_PRIORITY: Record<ActionCategory, number> = {
  긴급: 0,
  재등록: 20,
  케어: 40,
  운영: 60,
  기회: 80,
};

export async function buildDailyPriorities(franchiseId: number): Promise<DailyPrioritiesPayload> {
  const [memberSummary, lockerOverview] = await Promise.all([
    summarizeMemberStatuses(franchiseId),
    getLockerOverview(franchiseId),
  ]);

  const priorities: DailyPriority[] = [];

  // 1) Member status → action 매핑
  for (const s of memberSummary.topPriority) {
    const action = memberStatusToAction(s);
    if (action) priorities.push(action);
  }

  // 2) 락커 만료 임박 (7일 내)
  for (const l of lockerOverview.expiringSoon) {
    if (l.daysLeft <= 7) {
      priorities.push({
        id: `locker:${l.id}:expiring`,
        category: "재등록",
        type: "review_payment",
        title: `락커 #${l.number} 재계약 권유`,
        reason: `${l.section} · ${l.daysLeft}일 후 만료`,
        recommendedDeadline: l.daysLeft <= 3 ? "오늘" : "이번 주",
        targetType: "locker",
        targetId: l.id,
        targetLabel: `락커 #${l.number}`,
        priorityScore: CATEGORY_PRIORITY["재등록"] - (7 - l.daysLeft),
      });
    }
  }

  // 3) 락커 점유율 70% 미만이면 회수 후보 → "운영" 카테고리
  if (lockerOverview.totalLockers > 0 && lockerOverview.occupancyRate < 0.7 && lockerOverview.recentRecoveries.length > 0) {
    priorities.push({
      id: `locker:rebalance`,
      category: "기회",
      type: "check_locker",
      title: `락커 ${lockerOverview.vacant}개 빈 자리 — 재배정 캠페인 가능`,
      reason: `점유율 ${Math.round(lockerOverview.occupancyRate * 100)}% (최근 회수 ${lockerOverview.recentRecoveries.length}건)`,
      recommendedDeadline: "이번 주",
      targetType: "locker",
      targetId: null,
      targetLabel: "락커 전체",
      priorityScore: CATEGORY_PRIORITY["기회"],
    });
  }

  // 정렬 + Top 10
  priorities.sort((a, b) => a.priorityScore - b.priorityScore);
  const top = priorities.slice(0, 10);

  // 카테고리별 집계
  const byCategory: Record<ActionCategory, number> = { 긴급: 0, 재등록: 0, 케어: 0, 운영: 0, 기회: 0 };
  top.forEach((p) => { byCategory[p.category] += 1; });

  const empty = top.length === 0;
  const guardianCount = await countGuardianPushEnabled(franchiseId);

  return {
    generatedAt: new Date().toISOString(),
    totalActions: top.length,
    byCategory,
    priorities: top,
    empty,
    emptyReason: empty
      ? memberSummary.total === 0
        ? "아직 회원 데이터가 없습니다. 회원 등록부터 시작하세요."
        : guardianCount > 0
          ? "현재 모든 회원이 정상 관리 중입니다."
          : "운영이 안정적입니다. 추가 보호자 등록으로 케어 폭을 넓혀보세요."
      : undefined,
  };
}

function memberStatusToAction(s: MemberStatus): DailyPriority | null {
  switch (s.code) {
    case "미납":
      return {
        id: `member:${s.memberId}:unpaid`,
        category: "긴급",
        type: "review_payment",
        title: `${s.memberName} 미납 확인 + 즉시 연락`,
        reason: s.reason,
        recommendedDeadline: "오늘",
        targetType: "member",
        targetId: s.memberId,
        targetLabel: s.memberName,
        priorityScore: s.priority,
      };
    case "이탈위험":
      return {
        id: `member:${s.memberId}:churn`,
        category: "긴급",
        type: "call_member",
        title: `${s.memberName} 이탈 위험 — 담당 트레이너 직접 연락`,
        reason: s.reason,
        recommendedDeadline: "오늘",
        targetType: "member",
        targetId: s.memberId,
        targetLabel: s.memberName,
        priorityScore: s.priority,
      };
    case "상담미처리":
      return {
        id: `member:${s.memberId}:consultation`,
        category: "긴급",
        type: "schedule_consultation",
        title: `${s.memberName} 상담 후속 — 24시간 내 연락`,
        reason: s.reason,
        recommendedDeadline: "오늘",
        targetType: "member",
        targetId: s.memberId,
        targetLabel: s.memberName,
        priorityScore: s.priority,
      };
    case "재등록가능":
      return {
        id: `member:${s.memberId}:renew`,
        category: "재등록",
        type: "call_member",
        title: `${s.memberName} 재등록 패키지 제안 — 전환 가능성 높음`,
        reason: s.reason,
        recommendedDeadline: "이번 주",
        targetType: "member",
        targetId: s.memberId,
        targetLabel: s.memberName,
        priorityScore: s.priority,
      };
    case "만료임박":
      return {
        id: `member:${s.memberId}:expiry`,
        category: "재등록",
        type: "call_member",
        title: `${s.memberName} 만료 임박 — 재등록 의향 확인`,
        reason: s.reason,
        recommendedDeadline: "이번 주",
        targetType: "member",
        targetId: s.memberId,
        targetLabel: s.memberName,
        priorityScore: s.priority,
      };
    case "출석감소":
    case "관심필요":
      return {
        id: `member:${s.memberId}:care`,
        category: "케어",
        type: "call_member",
        title: `${s.memberName} 개인 메시지 + 케어`,
        reason: s.reason,
        recommendedDeadline: "이번 주",
        targetType: "member",
        targetId: s.memberId,
        targetLabel: s.memberName,
        priorityScore: s.priority,
      };
    case "휴면":
      return {
        id: `member:${s.memberId}:reactivate`,
        category: "기회",
        type: "send_notice",
        title: `${s.memberName} 휴면 재활성화 캠페인`,
        reason: s.reason,
        recommendedDeadline: "이번 달",
        targetType: "member",
        targetId: s.memberId,
        targetLabel: s.memberName,
        priorityScore: s.priority,
      };
    default:
      return null;
  }
}
