"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { auditLogs, loginAttempts, session as sessionTable, user as userTable } from "@/lib/db/schema"
import { audit, fail, requireAdmin, type ActionResult } from "@/lib/admin"

export async function listLoginHistory(page = 1, filter: "all" | "success" | "failed" = "all") {
  await requireAdmin("security.read")
  const pageSize = 25
  const where =
    filter === "success" ? eq(loginAttempts.success, true) : filter === "failed" ? eq(loginAttempts.success, false) : undefined
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: loginAttempts.id,
        email: loginAttempts.email,
        success: loginAttempts.success,
        ip: loginAttempts.ip,
        device: loginAttempts.device,
        createdAt: loginAttempts.createdAt,
        userName: userTable.name,
      })
      .from(loginAttempts)
      .leftJoin(userTable, eq(userTable.id, loginAttempts.userId))
      .where(where)
      .orderBy(desc(loginAttempts.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(loginAttempts).where(where),
  ])
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function listAuditLog(query: { q?: string; entity?: string; page?: number } = {}) {
  await requireAdmin("audit.read")
  const page = Math.max(1, query.page ?? 1)
  const pageSize = 30
  const parts = []
  if (query.q) {
    const t = `%${query.q.trim()}%`
    parts.push(or(ilike(auditLogs.description, t), ilike(auditLogs.actorName, t), ilike(auditLogs.action, t)))
  }
  if (query.entity && query.entity !== "all") parts.push(eq(auditLogs.entity, query.entity))
  const where = parts.length ? and(...parts) : undefined
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(auditLogs).where(where),
  ])
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function listMySessions() {
  const admin = await requireAdmin("security.read")
  const rows = await db
    .select({
      id: sessionTable.id,
      createdAt: sessionTable.createdAt,
      updatedAt: sessionTable.updatedAt,
      expiresAt: sessionTable.expiresAt,
      ipAddress: sessionTable.ipAddress,
      userAgent: sessionTable.userAgent,
    })
    .from(sessionTable)
    .where(eq(sessionTable.userId, admin.id))
    .orderBy(desc(sessionTable.updatedAt))
  return rows.map((r) => ({ ...r, current: r.id === admin.sessionId }))
}

export async function revokeSession(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("security.write")
    const clean = z.string().min(1).parse(id)
    if (clean === admin.sessionId) return { ok: false, error: "Текущую сессию нельзя завершить здесь — используйте выход" }
    await db.delete(sessionTable).where(and(eq(sessionTable.id, clean), eq(sessionTable.userId, admin.id)))
    await audit(admin, { action: "security.revoke_session", entity: "session", entityId: clean, description: `${admin.name} завершил сессию` })
    revalidatePath("/admin/security")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось завершить сессию")
  }
}

export async function revokeOtherSessions(): Promise<ActionResult<{ count: number }>> {
  try {
    const admin = await requireAdmin("security.write")
    const deleted = await db
      .delete(sessionTable)
      .where(and(eq(sessionTable.userId, admin.id), ne(sessionTable.id, admin.sessionId)))
      .returning({ id: sessionTable.id })
    await audit(admin, { action: "security.revoke_all", entity: "session", description: `${admin.name} завершил все остальные сессии (${deleted.length})` })
    revalidatePath("/admin/security")
    return { ok: true, data: { count: deleted.length } }
  } catch (e) {
    return fail(e, "Не удалось завершить сессии")
  }
}

export async function getSecuritySummary() {
  const admin = await requireAdmin("security.read")
  const since = new Date(Date.now() - 7 * 86400e3)
  const [[failed], [sessions], [twofa]] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.success, false), sql`${loginAttempts.createdAt} >= ${since}`)),
    db.select({ c: sql<number>`count(*)::int` }).from(sessionTable).where(eq(sessionTable.userId, admin.id)),
    db.select({ c: sql<number>`count(*)::int` }).from(userTable).where(and(ne(userTable.role, "user"), eq(userTable.twoFactorEnabled, true))),
  ])
  return { failedLast7d: failed.c, activeSessions: sessions.c, staffWith2fa: twofa.c, twoFactorEnabled: admin.twoFactorEnabled }
}

export async function recordSecurityAudit(action: string, description: string): Promise<void> {
  const admin = await requireAdmin("security.read")
  await audit(admin, { action, entity: "security", description: `${admin.name} ${description}` })
  revalidatePath("/admin/security")
}
