import { db } from "../db";
import { members } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { smsProvider } from "./sms-service";

/**
 * OUHVE ABM — GAP-13 (AssistFit 흡수)
 *
 * 보호자 출석 알림. 키즈/청소년 회원이 센터에 도착했을 때
 * 등록된 보호자에게 자동 통지.
 *
 * 트리거: server/routes.ts의 attendance create 핸들러에서 호출.
 * 채널: 현재는 SMS stub provider. M10(회원앱) 도입 시 푸시 우선 + SMS fallback 전환 예정.
 */

export interface GuardianNoticeResult {
  sent: boolean;
  reason?: string;
  channel?: "sms" | "push";
}

export async function notifyGuardianOnCheckIn(memberId: number): Promise<GuardianNoticeResult> {
  const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);

  if (!m) return { sent: false, reason: "member not found" };
  if (!m.attendancePushEnabled) return { sent: false, reason: "push disabled" };
  if (!m.guardianPhone) return { sent: false, reason: "no guardian phone" };

  const checkInLabel = new Date().toLocaleString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const message = `[OUHVE] ${m.name} 회원이 ${checkInLabel}에 센터에 도착했습니다.`;

  try {
    const result = await smsProvider.sendSms(m.guardianPhone, message);
    if (!result.success) {
      return { sent: false, reason: result.errorMessage ?? "send failed", channel: "sms" };
    }
    return { sent: true, channel: "sms" };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "send failed" };
  }
}

export async function countGuardianPushEnabled(franchiseId: number): Promise<number> {
  const rows = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.franchiseId, franchiseId), eq(members.attendancePushEnabled, true)));
  return rows.length;
}
