"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { leadEvents, leads, notifications, user as userTable, type Lead, type LeadEvent } from "@/lib/db/schema"
import { audit, fail, requireAdmin, type ActionResult } from "@/lib/admin"
import { LEAD_STATUSES, LEAD_STATUS_META, normalizeSource, type LeadStatus } from "@/lib/admin/constants"

const statusSchema = z.enum(LEAD_STATUSES)

export type LeadRow = Lead & { assigneeName: string | null }

export type LeadsQuery = {
  q?: string
  status?: LeadStatus | "all"
  service?: string
  source?: string
  assignee?: string
  from?: string
  to?: string
  archived?: boolean
  sort?: "createdAt" | "updatedAt" | "name" | "status" | "value"
  dir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

function buildWhere(q: LeadsQuery): SQL | undefined {
  const parts: SQL[] = [eq(leads.archived, Boolean(q.archived))]
  if (q.q) {
    const term = `%${q.q.trim()}%`
    const asId = Number(q.q.trim())
    const search = or(
      ilike(leads.name, term),
      ilike(leads.phone, term),
      ilike(leads.email, term),
      ilike(leads.message, term),
      ...(Number.isInteger(asId) ? [eq(leads.id, asId)] : []),
    )
    if (search) parts.push(search)
  }
  if (q.status && q.status !== "all") parts.push(eq(leads.status, q.status))
  if (q.service) parts.push(eq(leads.service, q.service))
  if (q.source) parts.push(eq(leads.source, q.source))
  if (q.assignee === "none") parts.push(sql`${leads.assigneeId} IS NULL`)
  else if (q.assignee) parts.push(eq(leads.assigneeId, q.assignee))
  if (q.from) parts.push(gte(leads.createdAt, new Date(q.from)))
  if (q.to) {
    const to = new Date(q.to)
    to.setHours(23, 59, 59, 999)
    parts.push(lte(leads.createdAt, to))
  }
  return and(...parts)
}

export async function listLeads(query: LeadsQuery = {}) {
  await requireAdmin("leads.read")
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.min(100, Math.max(5, query.pageSize ?? 20))
  const where = buildWhere(query)
  const sortCol = {
    createdAt: leads.createdAt,
    updatedAt: leads.updatedAt,
    name: leads.name,
    status: leads.status,
    value: leads.value,
  }[query.sort ?? "createdAt"]
  const order = query.dir === "asc" ? asc(sortCol) : desc(sortCol)

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        lead: leads,
        assigneeName: userTable.name,
      })
      .from(leads)
      .leftJoin(userTable, eq(userTable.id, leads.assigneeId))
      .where(where)
      .orderBy(order, desc(leads.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(leads).where(where),
  ])

  return {
    rows: rows.map((r) => ({ ...r.lead, assigneeName: r.assigneeName })) as LeadRow[],
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getLeadDetail(id: number) {
  await requireAdmin("leads.read")
  const [row] = await db
    .select({ lead: leads, assigneeName: userTable.name })
    .from(leads)
    .leftJoin(userTable, eq(userTable.id, leads.assigneeId))
    .where(eq(leads.id, id))
  if (!row) return null
  const events = await db
    .select()
    .from(leadEvents)
    .where(eq(leadEvents.leadId, id))
    .orderBy(desc(leadEvents.createdAt))
  return { ...row.lead, assigneeName: row.assigneeName, events } as LeadRow & { events: LeadEvent[] }
}

export async function listAssignees() {
  await requireAdmin("leads.read")
  return db
    .select({ id: userTable.id, name: userTable.name, role: userTable.role })
    .from(userTable)
    .where(inArray(userTable.role, ["admin", "manager"]))
    .orderBy(asc(userTable.name))
}

export async function listLeadFacets() {
  await requireAdmin("leads.read")
  const [servicesRows, sourcesRows] = await Promise.all([
    db
      .selectDistinct({ v: leads.service })
      .from(leads)
      .where(sql`${leads.service} IS NOT NULL AND ${leads.service} <> ''`),
    db.selectDistinct({ v: leads.source }).from(leads),
  ])
  return {
    services: servicesRows.map((r) => r.v as string).sort(),
    sources: sourcesRows.map((r) => r.v).sort(),
  }
}

async function logEvent(
  leadId: number,
  type: string,
  actor: { id: string; name: string },
  payload?: Record<string, unknown>,
) {
  await db.insert(leadEvents).values({
    leadId,
    type,
    actorId: actor.id,
    actorName: actor.name,
    payload,
  })
}

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  service: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
  value: z.coerce.number().int().min(0).max(100_000_000).default(0),
})

export async function updateLead(id: number, input: z.infer<typeof updateSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("leads.write")
    const data = updateSchema.parse(input)
    const [before] = await db.select().from(leads).where(eq(leads.id, id))
    if (!before) return { ok: false, error: "Заявка не найдена" }
    await db
      .update(leads)
      .set({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        service: data.service || null,
        source: data.source ? normalizeSource(data.source) : before.source,
        message: data.message || null,
        value: data.value,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
    await logEvent(id, "edited", admin)
    await audit(admin, {
      action: "lead.update",
      entity: "lead",
      entityId: id,
      description: `${admin.name} отредактировал заявку #${id}`,
    })
    revalidatePath("/admin/leads")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось сохранить заявку")
  }
}

export async function setLeadStatus(id: number, status: LeadStatus): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("leads.write")
    const next = statusSchema.parse(status)
    const [before] = await db.select({ status: leads.status, assigneeId: leads.assigneeId }).from(leads).where(eq(leads.id, id))
    if (!before) return { ok: false, error: "Заявка не найдена" }
    if (before.status === next) return { ok: true, data: undefined }
    await db
      .update(leads)
      .set({
        status: next,
        assigneeId: before.assigneeId ?? (next === "in_progress" ? admin.id : before.assigneeId),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
    await logEvent(id, "status", admin, { from: before.status, to: next })
    await audit(admin, {
      action: "lead.status",
      entity: "lead",
      entityId: id,
      description: `${admin.name} изменил статус заявки #${id}: ${LEAD_STATUS_META[before.status as LeadStatus]?.label ?? before.status} → ${LEAD_STATUS_META[next].label}`,
    })
    if (next === "done") {
      await db.insert(notifications).values({
        type: "lead_done",
        title: "Заявка завершена",
        body: `Заявка #${id} успешно завершена`,
        href: `/admin/leads?open=${id}`,
      })
    }
    revalidatePath("/admin/leads")
    revalidatePath("/admin")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось изменить статус")
  }
}

export async function bulkSetStatus(ids: number[], status: LeadStatus): Promise<ActionResult<{ count: number }>> {
  try {
    const admin = await requireAdmin("leads.write")
    const next = statusSchema.parse(status)
    const clean = z.array(z.number().int().positive()).min(1).max(500).parse(ids)
    await db.update(leads).set({ status: next, updatedAt: new Date() }).where(inArray(leads.id, clean))
    await db.insert(leadEvents).values(
      clean.map((leadId) => ({
        leadId,
        type: "status",
        actorId: admin.id,
        actorName: admin.name,
        payload: { to: next, bulk: true },
      })),
    )
    await audit(admin, {
      action: "lead.bulk_status",
      entity: "lead",
      description: `${admin.name} массово изменил статус ${clean.length} заявок на «${LEAD_STATUS_META[next].label}»`,
      metadata: { ids: clean },
    })
    revalidatePath("/admin/leads")
    return { ok: true, data: { count: clean.length } }
  } catch (e) {
    return fail(e, "Не удалось изменить статусы")
  }
}

export async function assignLead(id: number, assigneeId: string | null): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("leads.write")
    let name: string | null = null
    if (assigneeId) {
      const [u] = await db.select({ name: userTable.name, role: userTable.role }).from(userTable).where(eq(userTable.id, assigneeId))
      if (!u || (u.role !== "admin" && u.role !== "manager")) return { ok: false, error: "Ответственный не найден" }
      name = u.name
    }
    await db.update(leads).set({ assigneeId, updatedAt: new Date() }).where(eq(leads.id, id))
    await logEvent(id, "assigned", admin, { assigneeName: name })
    await audit(admin, {
      action: "lead.assign",
      entity: "lead",
      entityId: id,
      description: name ? `${admin.name} назначил ${name} ответственным за заявку #${id}` : `${admin.name} снял ответственного с заявки #${id}`,
    })
    revalidatePath("/admin/leads")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось назначить ответственного")
  }
}

export async function addLeadComment(id: number, text: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("leads.write")
    const body = z.string().trim().min(1).max(3000).parse(text)
    await logEvent(id, "comment", admin, { text: body })
    await db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, id))
    revalidatePath("/admin/leads")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось добавить комментарий")
  }
}

export async function archiveLeads(ids: number[], archived = true): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("leads.write")
    const clean = z.array(z.number().int().positive()).min(1).max(500).parse(ids)
    await db.update(leads).set({ archived, updatedAt: new Date() }).where(inArray(leads.id, clean))
    await audit(admin, {
      action: archived ? "lead.archive" : "lead.unarchive",
      entity: "lead",
      description: `${admin.name} ${archived ? "архивировал" : "восстановил"} ${clean.length} заявок`,
      metadata: { ids: clean },
    })
    revalidatePath("/admin/leads")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось изменить архив")
  }
}

export async function deleteLeads(ids: number[]): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("leads.delete")
    const clean = z.array(z.number().int().positive()).min(1).max(500).parse(ids)
    await db.delete(leadEvents).where(inArray(leadEvents.leadId, clean))
    await db.delete(leads).where(inArray(leads.id, clean))
    await audit(admin, {
      action: "lead.delete",
      entity: "lead",
      description: `${admin.name} удалил ${clean.length} заявок (#${clean.join(", #")})`,
      metadata: { ids: clean },
    })
    revalidatePath("/admin/leads")
    revalidatePath("/admin")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось удалить заявки")
  }
}

const createSchema = updateSchema.extend({ status: statusSchema.default("new") })

export async function createLead(input: z.infer<typeof createSchema>): Promise<ActionResult<{ id: number }>> {
  try {
    const admin = await requireAdmin("leads.write")
    const data = createSchema.parse(input)
    const [row] = await db
      .insert(leads)
      .values({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        service: data.service || null,
        source: normalizeSource(data.source || "other"),
        message: data.message || null,
        value: data.value,
        status: data.status,
        assigneeId: admin.id,
      })
      .returning({ id: leads.id })
    await logEvent(row.id, "created", admin, { manual: true })
    await audit(admin, {
      action: "lead.create",
      entity: "lead",
      entityId: row.id,
      description: `${admin.name} создал заявку #${row.id} вручную`,
    })
    revalidatePath("/admin/leads")
    return { ok: true, data: { id: row.id } }
  } catch (e) {
    return fail(e, "Не удалось создать заявку")
  }
}

/** Export matching leads (all pages) for CSV/XLSX generation on the client. */
export async function exportLeads(query: LeadsQuery = {}) {
  const admin = await requireAdmin("leads.read")
  const rows = await db
    .select({ lead: leads, assigneeName: userTable.name })
    .from(leads)
    .leftJoin(userTable, eq(userTable.id, leads.assigneeId))
    .where(buildWhere(query))
    .orderBy(desc(leads.createdAt))
    .limit(5000)
  await audit(admin, {
    action: "lead.export",
    entity: "lead",
    description: `${admin.name} экспортировал ${rows.length} заявок`,
  })
  return rows.map((r) => ({ ...r.lead, assigneeName: r.assigneeName })) as LeadRow[]
}
