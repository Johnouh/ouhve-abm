import { db } from "../db";
import { consultations } from "@shared/schema";
import { and, eq, gte, desc } from "drizzle-orm";

/**
 * OUHVE ABM — PushPress GAP-3 흡수
 *
 * Live Sales Pipeline — 예비회원(상담) 칸반 시각화.
 * 신규 리드 → 상담 예약 → 체험 → 가입 임박 → 등록완료 / 이탈.
 *
 * 데이터 출처: consultations 테이블 (마이그 없이 매핑만으로 stage 추론).
 * 추후 Cycle에서 명시적 pipelineStage 컬럼 도입 가능.
 */

export type PipelineStage = "신규리드" | "상담예약" | "체험중" | "가입임박" | "등록완료" | "이탈";

const STAGE_ORDER: PipelineStage[] = ["신규리드", "상담예약", "체험중", "가입임박", "등록완료", "이탈"];

export interface PipelineCard {
  id: number;
  customerName: string;
  phone: string;
  consultationDate: string;
  followUpDate: string | null;
  daysInStage: number;
  isHot: boolean; // 7일 내 액션 필요
  consultationType: string;
  result: string | null;
  notes: string | null;
}

export interface PipelineStageGroup {
  stage: PipelineStage;
  count: number;
  cards: PipelineCard[];
}

export interface SalesPipelinePayload {
  generatedAt: string;
  total: number;
  stages: PipelineStageGroup[];
  conversionRate: number; // 등록완료 / (등록완료+이탈+가입임박)
  hotLeadsCount: number;
}

function deriveStage(c: { result: string | null; status: string; consultationType: string; followUpDate: Date | null }): PipelineStage {
  const result = (c.result ?? "").trim();
  const status = (c.status ?? "").trim();
  const type = (c.consultationType ?? "").trim();

  if (status === "취소" || /이탈|취소|거절/.test(result)) return "이탈";
  if (status === "완료" && /등록완료|가입|등록/.test(result)) return "등록완료";
  if (/가입검토|가입예정|고민|결정/.test(result)) return "가입임박";
  if (/체험/.test(result) || /체험/.test(type)) return "체험중";
  if (c.followUpDate && c.followUpDate > new Date()) return "상담예약";
  return "신규리드";
}

export async function buildSalesPipeline(franchiseId: number): Promise<SalesPipelinePayload> {
  const rows = await db
    .select()
    .from(consultations)
    .where(eq(consultations.franchiseId, franchiseId))
    .orderBy(desc(consultations.consultationDate));

  const now = new Date();
  const all: { stage: PipelineStage; card: PipelineCard }[] = rows.map((c) => {
    const stage = deriveStage(c);
    const stageStartDate = c.followUpDate ?? c.consultationDate;
    const daysInStage = Math.floor((now.getTime() - new Date(stageStartDate).getTime()) / 86400000);
    const isHot = (stage === "가입임박" && daysInStage >= 2) ||
                  (stage === "체험중" && daysInStage >= 3) ||
                  (stage === "상담예약" && c.followUpDate && new Date(c.followUpDate).getTime() - now.getTime() <= 86400000);
    return {
      stage,
      card: {
        id: c.id,
        customerName: c.customerName,
        phone: c.phone,
        consultationDate: c.consultationDate.toISOString(),
        followUpDate: c.followUpDate?.toISOString() ?? null,
        daysInStage: Math.max(0, daysInStage),
        isHot: !!isHot,
        consultationType: c.consultationType,
        result: c.result,
        notes: c.notes,
      },
    };
  });

  // 각 stage별 그룹핑
  const stages: PipelineStageGroup[] = STAGE_ORDER.map((stage) => {
    const cards = all
      .filter((x) => x.stage === stage)
      .map((x) => x.card)
      .sort((a, b) => Number(b.isHot) - Number(a.isHot) || a.daysInStage - b.daysInStage)
      .slice(0, 20); // 무한 카드 방지
    return { stage, count: cards.length, cards };
  });

  const won = stages.find((s) => s.stage === "등록완료")?.count ?? 0;
  const lost = stages.find((s) => s.stage === "이탈")?.count ?? 0;
  const closing = stages.find((s) => s.stage === "가입임박")?.count ?? 0;
  const denom = won + lost + closing;
  const conversionRate = denom === 0 ? 0 : Math.round((won / denom) * 100);

  const hotLeadsCount = stages.reduce((acc, s) => acc + s.cards.filter((c) => c.isHot).length, 0);

  return {
    generatedAt: now.toISOString(),
    total: rows.length,
    stages,
    conversionRate,
    hotLeadsCount,
  };
}
