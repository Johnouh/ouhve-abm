import { db } from "../db";
import { lockers, lockerRecoveries } from "@shared/schema";
import { and, eq, gte, lte, isNotNull, sql } from "drizzle-orm";

/**
 * OUHVE ABM — GAP-14 (AssistFit 흡수): 락커 회수/배정 보드
 *
 * 락커 운영 가시화. AssistFit page-067 + page-080 흡수:
 *   - 점유율 % (락커 매출 누락 방지)
 *   - 만료 임박 락커 N일 이내 (재계약 권유 트리거)
 *   - 빈 락커 카운트 (즉시 배정 가능)
 *   - 최근 회수 이력 (재배정 후보)
 */

export interface LockerOverview {
  totalLockers: number;
  occupied: number;
  vacant: number;
  occupancyRate: number; // 0~1
  bySection: { section: string; total: number; occupied: number; rate: number }[];
  byType: { type: string; total: number; occupied: number }[];
  expiringSoon: { id: number; number: number; section: string; memberId: number | null; endDate: Date | null; daysLeft: number }[];
  recentRecoveries: { id: number; lockerNumber: number; memberName: string | null; recoveryDate: Date; reason: string | null }[];
  expectedMonthlyRevenue: number;
}

const EXPIRY_WARNING_DAYS = 14;

export async function getLockerOverview(franchiseId: number): Promise<LockerOverview> {
  const all = await db.select().from(lockers).where(eq(lockers.franchiseId, franchiseId));

  const total = all.length;
  const occupied = all.filter((l) => l.status === "이용 중" || l.memberId !== null).length;
  const vacant = total - occupied;
  const occupancyRate = total === 0 ? 0 : occupied / total;

  // 섹션별
  const sectionMap = new Map<string, { total: number; occupied: number }>();
  for (const l of all) {
    const key = l.section ?? "기본";
    const cur = sectionMap.get(key) ?? { total: 0, occupied: 0 };
    cur.total += 1;
    if (l.status === "이용 중" || l.memberId !== null) cur.occupied += 1;
    sectionMap.set(key, cur);
  }
  const bySection = Array.from(sectionMap.entries()).map(([section, v]) => ({
    section,
    total: v.total,
    occupied: v.occupied,
    rate: v.total === 0 ? 0 : v.occupied / v.total,
  }));

  // 타입별
  const typeMap = new Map<string, { total: number; occupied: number }>();
  for (const l of all) {
    const key = l.type ?? "일반";
    const cur = typeMap.get(key) ?? { total: 0, occupied: 0 };
    cur.total += 1;
    if (l.status === "이용 중" || l.memberId !== null) cur.occupied += 1;
    typeMap.set(key, cur);
  }
  const byType = Array.from(typeMap.entries()).map(([type, v]) => ({
    type,
    total: v.total,
    occupied: v.occupied,
  }));

  // 만료 임박
  const now = new Date();
  const warnLimit = new Date();
  warnLimit.setDate(warnLimit.getDate() + EXPIRY_WARNING_DAYS);
  const expiringSoon = all
    .filter((l) => l.endDate && new Date(l.endDate) <= warnLimit && new Date(l.endDate) >= now)
    .map((l) => {
      const days = Math.ceil((new Date(l.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: l.id,
        number: l.number,
        section: l.section ?? "기본",
        memberId: l.memberId,
        endDate: l.endDate,
        daysLeft: days,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10);

  // 최근 회수 5건
  const recoveriesRaw = await db
    .select()
    .from(lockerRecoveries)
    .where(eq(lockerRecoveries.franchiseId, franchiseId))
    .orderBy(sql`recovery_date desc`)
    .limit(5);
  const recentRecoveries = recoveriesRaw.map((r) => ({
    id: r.id,
    lockerNumber: r.lockerNumber,
    memberName: r.memberName,
    recoveryDate: r.recoveryDate,
    reason: r.reason,
  }));

  // 예상 월 매출 = 이용 중 락커의 monthlyFee 합
  const expectedMonthlyRevenue = all
    .filter((l) => l.status === "이용 중" || l.memberId !== null)
    .reduce((acc, l) => acc + (l.monthlyFee ?? 0), 0);

  return {
    totalLockers: total,
    occupied,
    vacant,
    occupancyRate,
    bySection,
    byType,
    expiringSoon,
    recentRecoveries,
    expectedMonthlyRevenue,
  };
}
