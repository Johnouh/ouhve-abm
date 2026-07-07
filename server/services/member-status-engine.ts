import { db } from "../db";
import { members, memberships, attendance, consultations } from "@shared/schema";
import { and, eq, gte, lte, desc, sql, isNull, or, inArray } from "drizzle-orm";

/**
 * OUHVE ABM — Module 2 + Module 7 결합
 *
 * Derived Member Status Engine
 *
 * 회원 상태는 정적 status 컬럼이 아니다. 다른 테이블(attendance, memberships,
 * consultations)의 최신 상태를 룰 기반으로 매번 평가해서 산출한다.
 *
 * 룰 (브리프 9):
 *   - 최근 14일 출석 없음             → 출석 감소
 *   - 만료일 14일 이내                → 만료 임박
 *   - 상담 후 3일 이상 후속 업무 없음 → 상담 미처리
 *   - 미납 3일 이상                  → 미납 관리 필요
 *   - 출석률 높고 만료 임박           → 재등록 가능성 높음
 *   - 최근 30일 출석 없음 + 만료 임박 → 이탈 위험
 *   - 휴면(stale, 60일+ 무출석)
 *   - 그 외                          → 정상 관리
 *
 * AI Operation Assistant(Module 7)는 이 엔진의 결과를 자연어로 변환해 추천한다.
 */

export type MemberStatusCode =
  | "정상관리"
  | "관심필요"
  | "출석감소"
  | "만료임박"
  | "재등록가능"
  | "이탈위험"
  | "상담미처리"
  | "미납"
  | "휴면";

export interface MemberStatus {
  memberId: number;
  memberName: string;
  code: MemberStatusCode;
  priority: number;        // 0(최우선) ~ 100 — 대시보드 정렬용
  reason: string;          // 한 문장 사유 (AI Assistant가 그대로 사용)
  recommendedAction: string; // 다음 액션 추천
  dataPoints: {
    daysSinceLastVisit?: number;
    daysUntilExpiry?: number;
    recentAttendanceRate?: number; // 0~1
    daysSinceConsultation?: number;
  };
}

interface StatusSummary {
  total: number;
  byStatus: Record<MemberStatusCode, number>;
  topPriority: MemberStatus[]; // 우선순위 상위 10명
}

// ===== Thresholds =====
const ATTENDANCE_DROP_DAYS = 14;       // 최근 14일 무출석 → 출석 감소
const STALE_DAYS = 60;                  // 60일 이상 무출석 → 휴면
const EXPIRY_WARNING_DAYS = 14;         // 만료 14일 이내 → 만료 임박
const CHURN_RISK_DAYS_NO_VISIT = 30;    // 이탈 위험 출석 기준
const CONSULTATION_FOLLOWUP_DAYS = 3;   // 상담 후 3일 이상 → 상담 미처리
const HIGH_ATTENDANCE_RATE = 0.6;       // 출석률 60% 이상 → 재등록 가능

const PRIORITY: Record<MemberStatusCode, number> = {
  미납: 5,
  이탈위험: 10,
  상담미처리: 15,
  만료임박: 20,
  재등록가능: 25,
  출석감소: 30,
  관심필요: 40,
  휴면: 50,
  정상관리: 90,
};

/**
 * 단일 회원의 상태를 평가한다.
 * member, latest membership, recent attendance, latest consultation을 입력으로 받는다.
 */
export function evaluateMemberStatus(input: {
  memberId: number;
  memberName: string;
  latestMembershipEndDate: Date | null;
  membershipPaymentStatus: "paid" | "unpaid" | "unknown";
  daysSinceUnpaid: number | null;
  lastAttendanceDate: Date | null;
  recentAttendanceRate: number | null;
  lastConsultationDate: Date | null;
  hasConsultationFollowup: boolean;
}): MemberStatus {
  const now = new Date();
  const daysSinceLastVisit = input.lastAttendanceDate
    ? daysBetween(input.lastAttendanceDate, now)
    : null;
  const daysUntilExpiry = input.latestMembershipEndDate
    ? daysBetween(now, input.latestMembershipEndDate)
    : null;
  const daysSinceConsultation = input.lastConsultationDate
    ? daysBetween(input.lastConsultationDate, now)
    : null;

  const dataPoints = {
    daysSinceLastVisit: daysSinceLastVisit ?? undefined,
    daysUntilExpiry: daysUntilExpiry ?? undefined,
    recentAttendanceRate: input.recentAttendanceRate ?? undefined,
    daysSinceConsultation: daysSinceConsultation ?? undefined,
  };

  // 우선순위 순서대로 평가 (먼저 매치되는 룰이 이김)

  // 1. 미납 — 가장 시급 (현금 흐름 문제)
  if (input.membershipPaymentStatus === "unpaid" && (input.daysSinceUnpaid ?? 0) >= 3) {
    return build("미납", `미납 ${input.daysSinceUnpaid}일 경과`,
      "오늘 미납 안내 연락 (SMS 우선)", dataPoints, input);
  }

  // 2. 이탈 위험 — 만료 임박 + 30일 이상 무출석
  if (
    daysUntilExpiry !== null && daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry >= 0 &&
    daysSinceLastVisit !== null && daysSinceLastVisit >= CHURN_RISK_DAYS_NO_VISIT
  ) {
    return build("이탈위험",
      `만료 ${daysUntilExpiry}일 전 + ${daysSinceLastVisit}일 무출석`,
      "담당 트레이너 직접 연락, 1:1 케어 제안", dataPoints, input);
  }

  // 3. 상담 미처리 — 상담 후 3일 이상 후속 없음
  if (
    daysSinceConsultation !== null &&
    daysSinceConsultation >= CONSULTATION_FOLLOWUP_DAYS &&
    !input.hasConsultationFollowup
  ) {
    return build("상담미처리",
      `상담 ${daysSinceConsultation}일 경과, 후속 업무 없음`,
      "상담 메모 확인 후 24h 내 연락", dataPoints, input);
  }

  // 4. 재등록 가능 — 만료 임박 + 출석률 높음 (긍정 시그널)
  if (
    daysUntilExpiry !== null && daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry >= 0 &&
    (input.recentAttendanceRate ?? 0) >= HIGH_ATTENDANCE_RATE
  ) {
    return build("재등록가능",
      `만료 ${daysUntilExpiry}일 전, 출석률 ${Math.round((input.recentAttendanceRate ?? 0) * 100)}%`,
      "재등록 패키지 제안 — 전환 가능성 높음", dataPoints, input);
  }

  // 5. 만료 임박 — 출석률 무관
  if (daysUntilExpiry !== null && daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry >= 0) {
    return build("만료임박",
      `만료 ${daysUntilExpiry}일 전`,
      "재등록 의향 확인 연락", dataPoints, input);
  }

  // 6. 휴면 — 60일+ 무출석
  if (daysSinceLastVisit !== null && daysSinceLastVisit >= STALE_DAYS) {
    return build("휴면",
      `${daysSinceLastVisit}일 무출석`,
      "휴면 회원 재활성화 캠페인 후보", dataPoints, input);
  }

  // 7. 출석 감소 — 최근 14일 무출석
  if (daysSinceLastVisit !== null && daysSinceLastVisit >= ATTENDANCE_DROP_DAYS) {
    return build("출석감소",
      `${daysSinceLastVisit}일 무출석`,
      "담당 트레이너 개인 메시지 발송", dataPoints, input);
  }

  // 8. 관심 필요 — 출석률 낮음 (30% 미만)
  if (input.recentAttendanceRate !== null && input.recentAttendanceRate < 0.3) {
    return build("관심필요",
      `최근 출석률 ${Math.round(input.recentAttendanceRate * 100)}%`,
      "운동 목표 재확인 + 격려 메시지", dataPoints, input);
  }

  // 9. 정상 관리
  return build("정상관리", "출석/결제/상담 모두 정상", "현재 케어 유지", dataPoints, input);
}

function build(
  code: MemberStatusCode,
  reason: string,
  action: string,
  dataPoints: MemberStatus["dataPoints"],
  input: { memberId: number; memberName: string }
): MemberStatus {
  return {
    memberId: input.memberId,
    memberName: input.memberName,
    code,
    priority: PRIORITY[code],
    reason,
    recommendedAction: action,
    dataPoints,
  };
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ============================================================
// 프랜차이즈 전체 회원의 상태를 한번에 평가 — DB 조회 + 룰 적용
// ============================================================

/**
 * 프랜차이즈 내 전체 회원의 derived status를 계산하고 요약을 반환한다.
 * 대시보드/AI Assistant가 호출.
 */
export async function summarizeMemberStatuses(franchiseId: number): Promise<StatusSummary> {
  // 1. 회원 목록
  const memberList = await db.select().from(members).where(eq(members.franchiseId, franchiseId));

  // 2. 각 회원의 최신 membership
  const membershipMap = new Map<number, { endDate: Date }>();
  if (memberList.length > 0) {
    const memberIds = memberList.map((m) => m.id);
    const allMemberships = await db.select().from(memberships)
      .where(inArray(memberships.memberId, memberIds))
      .orderBy(desc(memberships.endDate));
    for (const ms of allMemberships) {
      if (!membershipMap.has(ms.memberId)) {
        membershipMap.set(ms.memberId, { endDate: ms.endDate });
      }
    }
  }

  // 3. 각 회원의 최근 60일 출석 집계
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const attendanceMap = new Map<number, { lastDate: Date; count: number }>();
  if (memberList.length > 0) {
    const memberIds = memberList.map((m) => m.id);
    const recent = await db.select({
      memberId: attendance.memberId,
      date: attendance.date,
    })
      .from(attendance)
      .where(and(
        inArray(attendance.memberId, memberIds),
        gte(attendance.date, sixtyDaysAgo),
      ))
      .orderBy(desc(attendance.date));
    for (const row of recent) {
      const existing = attendanceMap.get(row.memberId);
      if (!existing) {
        attendanceMap.set(row.memberId, { lastDate: row.date, count: 1 });
      } else {
        existing.count += 1;
      }
    }
  }

  // 4. 각 회원의 최근 상담 (이름 매칭으로 단순화 — 향후 memberId FK 추가 권장)
  const consultationMap = new Map<string, Date>();
  const recentConsultations = await db.select({
    customerName: consultations.customerName,
    consultationDate: consultations.consultationDate,
  })
    .from(consultations)
    .where(eq(consultations.franchiseId, franchiseId))
    .orderBy(desc(consultations.consultationDate));
  for (const c of recentConsultations) {
    if (!consultationMap.has(c.customerName)) {
      consultationMap.set(c.customerName, c.consultationDate);
    }
  }

  // 5. 룰 적용
  const statuses: MemberStatus[] = memberList.map((m) => {
    const membership = membershipMap.get(m.id);
    const att = attendanceMap.get(m.id);
    // 출석률: 60일 중 실제 출석일 / 기대 출석일(주 2회 가정 = 17회)
    const recentAttendanceRate = att ? Math.min(att.count / 17, 1) : 0;

    return evaluateMemberStatus({
      memberId: m.id,
      memberName: m.name,
      latestMembershipEndDate: membership?.endDate ?? null,
      membershipPaymentStatus: "unknown",  // payments 연동은 추후 사이클
      daysSinceUnpaid: null,
      lastAttendanceDate: att?.lastDate ?? m.lastVisit ?? null,
      recentAttendanceRate: att ? recentAttendanceRate : null,
      lastConsultationDate: consultationMap.get(m.name) ?? null,
      hasConsultationFollowup: false, // task 연동 추후 사이클
    });
  });

  // 6. 집계
  const byStatus: Record<MemberStatusCode, number> = {
    정상관리: 0, 관심필요: 0, 출석감소: 0, 만료임박: 0,
    재등록가능: 0, 이탈위험: 0, 상담미처리: 0, 미납: 0, 휴면: 0,
  };
  for (const s of statuses) byStatus[s.code] += 1;

  const topPriority = [...statuses]
    .filter((s) => s.code !== "정상관리")
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 10);

  return {
    total: statuses.length,
    byStatus,
    topPriority,
  };
}
