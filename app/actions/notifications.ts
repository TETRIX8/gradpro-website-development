"use server"

import { revalidatePath } from "next/cache"
import { desc, eq, gt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { fail, requireAdmin, type ActionResult } from "@/lib/admin"

export async function listNotifications(limit = 50) {
  await requireAdmin("notifications.read")
  const [rows, [{ unread }]] = await Promise.all([
    db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit),
    db.select({ unread: sql<number>`count(*) filter (where ${notifications.read} = false)::int` }).from(notifications),
  ])
  return { rows, unread }
}

/** Polled by the shell for realtime badges/toasts. */
export async function pollNotifications(sinceId: number) {
  await requireAdmin("notifications.read")
  const [fresh, [{ unread }]] = await Promise.all([
    db.select().from(notifications).where(gt(notifications.id, sinceId)).orderBy(desc(notifications.id)).limit(10),
    db.select({ unread: sql<number>`count(*) filter (where ${notifications.read} = false)::int` }).from(notifications),
  ])
  const [latest] = await db.select({ id: notifications.id }).from(notifications).orderBy(desc(notifications.id)).limit(1)
  return { fresh, unread, latestId: latest?.id ?? 0 }
}

export async function markNotificationRead(id: number): Promise<ActionResult> {
  try {
    await requireAdmin("notifications.read")
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id))
    revalidatePath("/admin/notifications")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e)
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    await requireAdmin("notifications.read")
    await db.update(notifications).set({ read: true }).where(eq(notifications.read, false))
    revalidatePath("/admin/notifications")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e)
  }
}

export async function clearNotifications(): Promise<ActionResult> {
  try {
    await requireAdmin("notifications.read")
    await db.delete(notifications).where(eq(notifications.read, true))
    revalidatePath("/admin/notifications")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e)
  }
}
