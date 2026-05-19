import type { Franchise } from "@shared/schema";

/**
 * OUHVE ABM — Module 1: Business Profile 완성도 계산
 *
 * AI Operation Assistant(Module 7)가 의미 있는 추천을 하려면
 * 최소한의 운영자 컨텍스트가 필요하다. 이 함수는 그 충분성을 점검한다.
 *
 * Returns:
 *   - filled: 채워진 필드 수
 *   - total: 전체 추적 필드 수 (현재 7)
 *   - percent: 0~100
 *   - missingFields: 비어있는 필드 키 목록 (UI에서 다음 입력 유도)
 *   - isComplete: 모든 필드가 충족되었는가
 */

const REQUIRED_FIELDS = [
  "wellnessCategory",
  "region",
  "operatingHours",
  "mainPrograms",
  "primaryAudience",
  "philosophy",
  "topConcern",
] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number];

export interface ProfileCompletion {
  filled: number;
  total: number;
  percent: number;
  missingFields: RequiredField[];
  isComplete: boolean;
}

export function computeProfileCompletion(franchise: Franchise | undefined | null): ProfileCompletion {
  const total = REQUIRED_FIELDS.length;
  if (!franchise) {
    return { filled: 0, total, percent: 0, missingFields: [...REQUIRED_FIELDS], isComplete: false };
  }
  const missingFields: RequiredField[] = [];
  let filled = 0;
  for (const key of REQUIRED_FIELDS) {
    const value = (franchise as any)[key];
    if (isFieldFilled(value)) {
      filled += 1;
    } else {
      missingFields.push(key);
    }
  }
  const percent = Math.round((filled / total) * 100);
  return { filled, total, percent, missingFields, isComplete: filled === total };
}

function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}
