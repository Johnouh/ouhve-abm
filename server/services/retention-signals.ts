import { summarizeMemberStatuses } from "./member-status-engine";
import { db } from "../db";
import { members, attendance, memberships } from "@shared/schema";
import { and, eq, gte, sql, desc } from "drizzle-orm";

/**
 * OUHVE ABM — PushPress GAP-7 흡수
 *
 * Retention Signals — At-Risk 7일 전 경고.
 * PushPress 통찰: 단순 "이탈 위험" 라벨 너머 행동 시그널 강도까지 점수화.
 *
 * 시그널 종류 (점수 0~100):
 *  - attendance_drop_rate: 최근 7일 출석률 대비 이전 21일 출석률 하락폭
 *  - days_to_expiry: 만료 임박도 (14일 내 → 가중치 증가)
 *  - consecutive_skips: 연속 무출석 일수
 *  - last_consultation_gap: 최근 상담 후 경과일
 *
 * 산출: 회원별 risk score + 신호 breakdown + 7일 내 행동 예측.
 */

export interface RetentionSignal {
  memberId: number;
  memberName: string;
  riskScore: number; // 0(안전) ~ 100(즉시 이탈 위험)
  signals: {
    attendanceDropRate: number;       // 0~100 (높을수록 위험)
    daysToExpiry: number | null;      // 만료까지 일수
    consecutiveSkipDays: number;      // 연속 무출석
    consultationGapDays: number | null; // 마지막 상담 후 경과
  };
  trend: "improving" | "stable" | "worsening";
  predictedAction: string; // 한 줄 예측
  recommendedIntervention: string; // 한 줄 권고
}

export interface RetentionSignalsPayload {
  generatedAt: string;
  totalAnalyzed: number;
  atRisk: number; // 50점 이상
  critical: number; // 80점 이상
  topSignals: RetentionSignal[];
  cohortAvgRisk: number;
}

const SIGNAL_WEIGHTS = {
  attendanceDrop: 0.40,
  expiry: 0.25,
  consecutiveSkip: 0.25,
  consultationGap: 0.10,
};

export async function buildRetentionSignals(franchiseId: number): Promise<RetentionSignalsPayload> {
  const memberList = await db.select().from(members).where(eq(members.franchiseId, franchiseId));
  const now = new Date();

  // 최근 28일 출석 데이터
  const since28 = new Date();
  since28.setDate(since28.getDate() - 28);

  const allAttendance = memberList.length > 0
    ? await db
        .select({ memberId: attendance.memberId, checkInTime: attendance.checkInTime })
        .from(attendance)
        .where(
          and(
            eq(attendance.franchiseId, franchiseId),
            gte(attendance.checkInTime, since28),
          ),
        )
    : [];

  // 회원별 출석 맵
  const attendanceMap = new Map<number, Date[]>();
  for (const a of allAttendance) {
    const arr = attendanceMap.get(a.memberId) ?? [];
    arr.push(a.checkInTime);
    attendanceMap.set(a.memberId, arr);
  }

  // 최신 활성 membership 만료일
  const membershipMap = new Map<number, Date>();
  if (memberList.length > 0) {
    const memberIds = memberList.map((m) => m.id);
    const ms = await db
      .select({ memberId: memberships.memberId, endDate: memberships.endDate })
      .from(memberships)
      .where(sql`${memberships.memberId} = ANY(${memberIds})`)
      .orderBy(desc(memberships.endDate));
    for (const m of ms) {
      if (!membershipMap.has(m.memberId)) {
        membershipMap.set(m.memberId, m.endDate);
      }
    }
  }

  const signals: RetentionSignal[] = memberList.map((m) => {
    const atts = (attendanceMap.get(m.id) ?? []).map((d) => new Date(d).getTime());
    const last7Cutoff = now.getTime() - 7 * 86400000;
    const prev21Start = now.getTime() - 28 * 86400000;
    const prev21End = last7Cutoff;

    const last7 = atts.filter((t) => t >= last7Cutoff).length;
    const prev21 = atts.filter((t) => t >= prev21Start && t < prev21End).length;

    // 출석 하락률
    const last7Rate = last7 / 7;
    const prev21Rate = prev21 / 21;
    const dropMagnitude = prev21Rate > 0 ? Math.max(0, (prev21Rate - last7Rate) / prev21Rate) : 0;
    const attendanceDropRate = Math.round(dropMagnitude * 100);

    // 만료까지 일수
    const expiry = membershipMap.get(m.id);
    const daysToExpiry = expiry ? Math.ceil((new Date(expiry).getTime() - now.getTime()) / 86400000) : null;
    const expiryScore = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30
      ? Math.round((1 - daysToExpiry / 30) * 100)
      : 0;

    // 연속 무출석
    let consecutiveSkipDays = 0;
    if (atts.length === 0) {
      consecutiveSkipDays = 28; // cap
    } else {
      const lastVisit = Math.max(...atts);
      consecutiveSkipDays = Math.floor((now.getTime() - lastVisit) / 86400000);
    }
    const skipScore = Math.min(consecutiveSkipDays * 5, 100); // 20일 → 100점

    // 상담 갭 (lastVisit 컬럼 사용)
    const consultationGapDays = m.lastVisit
      ? Math.floor((now.getTime() - new Date(m.lastVisit).getTime()) / 86400000)
      : null;
    const consultationScore = consultationGapDays === null || consultationGapDays > 60
      ? 50 : Math.min(consultationGapDays, 50);

    const riskScore = Math.round(
      attendanceDropRate * SIGNAL_WEIGHTS.attendanceDrop +
      expiryScore * SIGNAL_WEIGHTS.expiry +
      skipScore * SIGNAL_WEIGHTS.consecutiveSkip +
      consultationScore * SIGNAL_WEIGHTS.consultationGap
    );

    // 트렌드 — 최근 7일 vs 이전 21일
    const trend: RetentionSignal["trend"] =
      last7Rate > prev21Rate * 1.1 ? "improving" :
      last7Rate < prev21Rate * 0.7 ? "worsening" :
      "stable";

    const predictedAction = predictAction(riskScore, consecutiveSkipDays, daysToExpiry);
    const recommendedIntervention = recommendIntervention(riskScore, daysToExpiry, consecutiveSkipDays);

    return {
      memberId: m.id,
      memberName: m.name,
      riskScore,
      signals: { attendanceDropRate, daysToExpiry, consecutiveSkipDays, consultationGapDays },
      trend,
      predictedAction,
      recommendedIntervention,
    };
  });

  signals.sort((a, b) => b.riskScore - a.riskScore);

  const atRisk = signals.filter((s) => s.riskScore >= 50).length;
  const critical = signals.filter((s) => s.riskScore >= 80).length;
  const cohortAvgRisk = signals.length === 0
    ? 0
    : Math.round(signals.reduce((acc, s) => acc + s.riskScore, 0) / signals.length);

  return {
    generatedAt: now.toISOString(),
    totalAnalyzed: signals.length,
    atRisk,
    critical,
    topSignals: signals.slice(0, 10).filter((s) => s.riskScore >= 30),
    cohortAvgRisk,
  };
}

function predictAction(riskScore: number, skipDays: number, daysToExpiry: number | null): string {
  if (riskScore >= 80) {
    if (daysToExpiry !== null && daysToExpiry <= 14) return "7일 내 미재등록 + 이탈 가능성 매우 높음";
    return "지속 무출석 + 만료 후 미재등록 가능성";
  }
  if (riskScore >= 50) {
    if (skipDays >= 14) return "출석 회복 없으면 3주 내 휴면 전환 예상";
    return "출석 패턴 둔화 — 적극 케어 필요";
  }
  if (riskScore >= 30) return "관심 신호 감지 — 정기 메시지로 유지";
  return "안정적";
}

function recommendIntervention(riskScore: number, daysToExpiry: number | null, skipDays: number): string {
  if (riskScore >= 80) return "오늘 담당자 직접 통화 + 1:1 케어 프로그램 제안";
  if (riskScore >= 50) {
    if (daysToExpiry !== null && daysToExpiry <= 21) return "재등록 패키지 사전 제안 + 출석 인센티브";
    return "담당 트레이너 개인 메시지 + 운동 목표 재확인";
  }
  if (riskScore >= 30) return "그룹 메시지에 포함 + 다음 주 출석 모니터링";
  return "현재 케어 유지";
}
