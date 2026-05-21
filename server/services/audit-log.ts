import { db } from "../db";
import { auditLogs, type AuditLog } from "@shared/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import type { Request } from "express";

/**
 * OUHVE ABM — Cycle 16 (AssistFit GAP-29)
 * 감사로그 — 핵심 엔티티 변경 이력 기록 + 조회.
 */

export type EntityType =
  | "member"
  | "membership"
  | "payment"
  | "locker"
  | "consultation"
  | "franchise"
  | "staff"
  | "product";

export type AuditAction = "create" | "update" | "delete" | "restore";

interface AuditInput {
  req?: Request;
  franchiseId: number;
  entityType: EntityType;
  entityId: number;
  action: AuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
}

function diffFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string[] {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const fields: string[] = [];
  keys.forEach((k) => {
    if (k === "updatedAt" || k === "createdAt") return;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) fields.push(k);
  });
  return fields;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  const fields = diffFields(input.before, input.after);
  if (input.action === "update" && fields.length === 0) return;

  const user = (input.req as any)?.user;
  const ip = (input.req?.ip as string | undefined)
    ?? (input.req?.headers["x-forwarded-for"] as string | undefined)
    ?? null;

  await db.insert(auditLogs).values({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    changesJson: {
      before: input.before ?? null,
      after: input.after ?? null,
      fields,
    } as any,
    performedBy: user?.username ?? null,
    performedByRole: user?.role ?? null,
    ipAddress: ip,
    reason: input.reason ?? null,
    franchiseId: input.franchiseId,
  });
}

export interface AuditQuery {
  franchiseId: number;
  entityType?: EntityType;
  entityId?: number;
  performedBy?: string;
  action?: AuditAction;
  sinceDays?: number;
  limit?: number;
}

export async function queryAuditLogs(q: AuditQuery): Promise<AuditLog[]> {
  const conditions = [eq(auditLogs.franchiseId, q.franchiseId)];
  if (q.entityType) conditions.push(eq(auditLogs.entityType, q.entityType));
  if (q.entityId) conditions.push(eq(auditLogs.entityId, q.entityId));
  if (q.performedBy) conditions.push(eq(auditLogs.performedBy, q.performedBy));
  if (q.action) conditions.push(eq(auditLogs.action, q.action));
  if (q.sinceDays && q.sinceDays > 0) {
    const since = new Date();
    since.setDate(since.getDate() - q.sinceDays);
    conditions.push(gte(auditLogs.createdAt, since));
  }
  const limit = Math.min(Math.max(q.limit ?? 50, 1), 500);
  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export interface AuditSummary {
  total: number;
  byEntity: Record<string, number>;
  byAction: Record<string, number>;
  byUser: { user: string; count: number }[];
  recent: AuditLog[];
}

export async function summarizeAudit(franchiseId: number, days = 7): Promise<AuditSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.franchiseId, franchiseId), gte(auditLogs.createdAt, since)))
    .orderBy(desc(auditLogs.createdAt));

  const byEntity: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  const byUserMap = new Map<string, number>();
  for (const r of rows) {
    byEntity[r.entityType] = (byEntity[r.entityType] ?? 0) + 1;
    byAction[r.action] = (byAction[r.action] ?? 0) + 1;
    if (r.performedBy) byUserMap.set(r.performedBy, (byUserMap.get(r.performedBy) ?? 0) + 1);
  }
  const byUser = Array.from(byUserMap.entries())
    .map(([user, count]) => ({ user, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total: rows.length,
    byEntity,
    byAction,
    byUser,
    recent: rows.slice(0, 30),
  };
}
