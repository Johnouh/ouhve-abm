import { db } from "../db";
import { memberships, members, groupExtensions } from "@shared/schema";
import { and, eq, inArray, gte, desc } from "drizzle-orm";

/**
 * OUHVE ABM — GAP-21 (AssistFit 흡수): 회원 단체 연장
 *
 * 휴장·사고·이벤트 시 다수 회원의 회원권을 일괄 연장.
 * AssistFit page-009 흡수: "단체 보상" 운영자 업무 효율화.
 *
 * 동작:
 *   1. 각 memberId의 가장 최근 활성 membership 조회
 *   2. endDate += days
 *   3. groupExtensions 테이블에 이력 한 줄씩 (감사로그)
 *   4. 처리 결과: { extended, skipped, errors }
 */

export interface BulkExtensionInput {
  franchiseId: number;
  memberIds: number[];
  days: number;
  reason: string;
  notes?: string;
}

export interface BulkExtensionResult {
  extended: { memberId: number; memberName: string; originalEndDate: string; newEndDate: string }[];
  skipped: { memberId: number; reason: string }[];
  totalExtended: number;
  totalSkipped: number;
}

export async function bulkExtendMemberships(input: BulkExtensionInput): Promise<BulkExtensionResult> {
  const { franchiseId, memberIds, days, reason, notes } = input;

  if (memberIds.length === 0) {
    return { extended: [], skipped: [], totalExtended: 0, totalSkipped: 0 };
  }
  if (days <= 0 || days > 365) {
    throw new Error("연장 일수는 1~365일 사이여야 합니다");
  }

  const extended: BulkExtensionResult["extended"] = [];
  const skipped: BulkExtensionResult["skipped"] = [];

  // 회원 정보
  const memberList = await db
    .select({ id: members.id, name: members.name, franchiseId: members.franchiseId })
    .from(members)
    .where(inArray(members.id, memberIds));

  // 프랜차이즈 격리 검증
  const validMemberIds = memberList
    .filter((m) => m.franchiseId === franchiseId)
    .map((m) => m.id);

  for (const memberId of memberIds) {
    const member = memberList.find((m) => m.id === memberId);
    if (!member) {
      skipped.push({ memberId, reason: "회원 없음" });
      continue;
    }
    if (!validMemberIds.includes(memberId)) {
      skipped.push({ memberId, reason: "다른 프랜차이즈 회원" });
      continue;
    }

    // 최신 활성 membership
    const [latest] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.memberId, memberId), eq(memberships.status, "활성")))
      .orderBy(desc(memberships.endDate))
      .limit(1);

    if (!latest) {
      skipped.push({ memberId, reason: "활성 회원권 없음" });
      continue;
    }

    const originalEnd = new Date(latest.endDate);
    const newEnd = new Date(originalEnd);
    newEnd.setDate(newEnd.getDate() + days);

    await db.update(memberships).set({ endDate: newEnd }).where(eq(memberships.id, latest.id));

    // 이력 (감사로그)
    await db.insert(groupExtensions).values({
      memberId,
      memberName: member.name,
      extensionType: "단체연장",
      originalEndDate: originalEnd,
      newEndDate: newEnd,
      extensionDays: days,
      reason,
      notes: notes ?? null,
      franchiseId,
    });

    extended.push({
      memberId,
      memberName: member.name,
      originalEndDate: originalEnd.toISOString(),
      newEndDate: newEnd.toISOString(),
    });
  }

  return {
    extended,
    skipped,
    totalExtended: extended.length,
    totalSkipped: skipped.length,
  };
}
