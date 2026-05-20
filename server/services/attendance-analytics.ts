import { db } from "../db";
import { attendance, members } from "@shared/schema";
import { and, eq, gte, sql, desc } from "drizzle-orm";

/**
 * OUHVE ABM — Module 8 보강 (GAP-19 from AssistFit absorption)
 *
 * 시간대별 출석 통계 — 운영 시간/인력 배치 최적화의 데이터 베이스.
 * AssistFit page-082 패턴: 시간대 히트맵 + 피크 구간 식별.
 *
 * 산출:
 *   - 시간대별 출석 수 (0~23시, 30일 누적)
 *   - 요일별 출석 수 (월~일)
 *   - 피크 시간대 Top 3
 *   - 가장 한산한 시간대 Top 3
 */

export interface AttendanceAnalytics {
  periodDays: number;
  totalCheckIns: number;
  uniqueMembers: number;
  hourlyDistribution: { hour: number; count: number; pct: number }[];
  weekdayDistribution: { weekday: number; weekdayLabel: string; count: number; pct: number }[];
  peakHours: { hour: number; count: number; label: string }[];
  quietHours: { hour: number; count: number; label: string }[];
  avgPerDay: number;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export async function computeAttendanceAnalytics(
  franchiseId: number,
  periodDays = 30,
): Promise<AttendanceAnalytics> {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const rows = await db
    .select({
      checkInTime: attendance.checkInTime,
      memberId: attendance.memberId,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.franchiseId, franchiseId),
        gte(attendance.checkInTime, since),
      ),
    );

  const hourly = new Array(24).fill(0);
  const weekday = new Array(7).fill(0);
  const memberSet = new Set<number>();

  for (const r of rows) {
    const d = new Date(r.checkInTime);
    hourly[d.getHours()] += 1;
    weekday[d.getDay()] += 1;
    memberSet.add(r.memberId);
  }

  const total = rows.length;
  const safePct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

  const hourlyDistribution = hourly.map((count, hour) => ({
    hour,
    count,
    pct: safePct(count),
  }));

  const weekdayDistribution = weekday.map((count, weekday) => ({
    weekday,
    weekdayLabel: WEEKDAY_LABELS[weekday],
    count,
    pct: safePct(count),
  }));

  // 피크 / 한산 Top 3 (0 카운트 시간대는 quiet에서 제외 — 휴장 시간일 수 있음)
  const ranked = [...hourlyDistribution]
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count);

  const peakHours = ranked.slice(0, 3).map((h) => ({
    hour: h.hour,
    count: h.count,
    label: formatHourRange(h.hour),
  }));

  const quietHours = ranked
    .slice(-3)
    .reverse()
    .map((h) => ({
      hour: h.hour,
      count: h.count,
      label: formatHourRange(h.hour),
    }));

  return {
    periodDays,
    totalCheckIns: total,
    uniqueMembers: memberSet.size,
    hourlyDistribution,
    weekdayDistribution,
    peakHours,
    quietHours,
    avgPerDay: total === 0 ? 0 : Math.round((total / periodDays) * 10) / 10,
  };
}

function formatHourRange(h: number): string {
  const next = (h + 1) % 24;
  return `${String(h).padStart(2, "0")}~${String(next).padStart(2, "0")}시`;
}
