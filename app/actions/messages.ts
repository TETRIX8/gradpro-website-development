"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { asc, desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { messages } from "@/lib/db/schema"
import { audit, fail, requireAdmin, type ActionResult } from "@/lib/admin"

export type Thread = {
  leadId: number | null
  senderName: string
  senderEmail: string | null
  subject: string | null
  lastBody: string
  lastAt: Date
  unread: number
  total: number
}

export async function listThreads() {
  await requireAdmin("messages.read")
  const rows = await db
    .select({
      leadId: messages.leadId,
      senderName: sql<string>`max(${messages.senderName}) filter (where ${messages.direction} = 'in')`,
      senderEmail: sql<string | null>`max(${messages.senderEmail})`,
      subject: sql<string | null>`max(${messages.subject})`,
      lastBody: sql<string>`(array_agg(${messages.body} order by ${messages.createdAt} desc))[1]`,
      lastAt: sql<Date>`max(${messages.createdAt})`,
      unread: sql<number>`count(*) filter (where ${messages.read} = false and ${messages.direction} = 'in')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(messages)
    .groupBy(messages.leadId)
    .orderBy(desc(sql`max(${messages.createdAt})`))
    .limit(100)
  return rows.map((r) => ({ ...r, senderName: r.senderName ?? "Клиент", lastAt: new Date(r.lastAt) })) as Thread[]
}

export async function getThread(leadId: number) {
  await requireAdmin("messages.read")
  const rows = await db.select().from(messages).where(eq(messages.leadId, leadId)).orderBy(asc(messages.createdAt))
  await db.update(messages).set({ read: true }).where(eq(messages.leadId, leadId))
  return rows
}

export async function replyToThread(leadId: number, body: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("messages.write")
    const text = z.string().trim().min(1).max(5000).parse(body)
    await db.insert(messages).values({
      leadId,
      senderName: admin.name,
      senderEmail: admin.email,
      body: text,
      direction: "out",
      read: true,
      authorId: admin.id,
    })
    await audit(admin, { action: "message.reply", entity: "message", entityId: leadId, description: `${admin.name} ответил клиенту по заявке #${leadId}` })
    revalidatePath("/admin/messages")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось отправить сообщение")
  }
}

export async function unreadMessagesCount() {
  await requireAdmin("messages.read")
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(messages)
    .where(sql`${messages.read} = false and ${messages.direction} = 'in'`)
  return c
}
