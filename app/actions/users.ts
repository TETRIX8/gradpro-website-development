"use server"

import { z } from "zod"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { auditLogs, loginAttempts, session as sessionTable, user as userTable } from "@/lib/db/schema"
import { audit, fail, requireAdmin, type ActionResult } from "@/lib/admin"
import { ROLES, ROLE_LABELS, type Role } from "@/lib/admin/rbac"

export type UserRow = {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  banned: boolean
  banReason: string | null
  twoFactorEnabled: boolean
  lastLoginAt: Date | null
  createdAt: Date
}

export async function listUsers(query: { q?: string; role?: string; status?: "active" | "banned" | "all"; page?: number } = {}) {
  await requireAdmin("users.read")
  const page = Math.max(1, query.page ?? 1)
  const pageSize = 20
  const parts = []
  if (query.q) {
    const t = `%${query.q.trim()}%`
    parts.push(or(ilike(userTable.name, t), ilike(userTable.email, t)))
  }
  if (query.role && query.role !== "all") parts.push(eq(userTable.role, query.role))
  if (query.status === "active") parts.push(eq(userTable.banned, false))
  if (query.status === "banned") parts.push(eq(userTable.banned, true))
  const where = parts.length ? and(...parts) : undefined

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
        role: userTable.role,
        banned: userTable.banned,
        banReason: userTable.banReason,
        twoFactorEnabled: userTable.twoFactorEnabled,
        lastLoginAt: userTable.lastLoginAt,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(where)
      .orderBy(desc(userTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(userTable).where(where),
  ])
  return { rows: rows as UserRow[], total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
  role: z.enum(ROLES),
})

export async function createUser(input: z.infer<typeof createSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin("users.write")
    const data = createSchema.parse(input)
    if (data.role === "admin" && admin.role !== "admin") return { ok: false, error: "Только администратор может создавать администраторов" }
    const res = await auth.api.createUser({
      headers: await headers(),
      body: { name: data.name, email: data.email, password: data.password, role: data.role as "admin" | "user" },
    })
    await db.update(userTable).set({ role: data.role }).where(eq(userTable.id, res.user.id))
    await audit(admin, {
      action: "user.create",
      entity: "user",
      entityId: res.user.id,
      description: `${admin.name} создал пользователя ${data.name} (${ROLE_LABELS[data.role]})`,
    })
    revalidatePath("/admin/users")
    return { ok: true, data: { id: res.user.id } }
  } catch (e) {
    if (e instanceof Error && /exist/i.test(e.message)) return { ok: false, error: "Пользователь с таким email уже существует" }
    return fail(e, "Не удалось создать пользователя")
  }
}

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
})

export async function updateUser(id: string, input: z.infer<typeof updateSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("users.write")
    const data = updateSchema.parse(input)
    await db.update(userTable).set({ ...data, updatedAt: new Date() }).where(eq(userTable.id, id))
    await audit(admin, { action: "user.update", entity: "user", entityId: id, description: `${admin.name} изменил данные пользователя ${data.name}` })
    revalidatePath("/admin/users")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось обновить пользователя")
  }
}

export async function setUserRole(id: string, role: Role): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("users.write")
    const next = z.enum(ROLES).parse(role)
    if (admin.role !== "admin") return { ok: false, error: "Только администратор может менять роли" }
    if (id === admin.id && next !== "admin") return { ok: false, error: "Нельзя понизить собственную роль" }
    const [target] = await db.select({ name: userTable.name }).from(userTable).where(eq(userTable.id, id))
    if (!target) return { ok: false, error: "Пользователь не найден" }
    await db.update(userTable).set({ role: next, updatedAt: new Date() }).where(eq(userTable.id, id))
    await audit(admin, { action: "user.role", entity: "user", entityId: id, description: `${admin.name} назначил ${target.name} роль «${ROLE_LABELS[next]}»` })
    revalidatePath("/admin/users")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось изменить роль")
  }
}

export async function setUserBanned(id: string, banned: boolean, reason?: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("users.write")
    if (id === admin.id) return { ok: false, error: "Нельзя заблокировать себя" }
    const [target] = await db.select({ name: userTable.name, role: userTable.role }).from(userTable).where(eq(userTable.id, id))
    if (!target) return { ok: false, error: "Пользователь не найден" }
    if (target.role === "admin" && admin.role !== "admin") return { ok: false, error: "Недостаточно прав" }
    await db
      .update(userTable)
      .set({ banned, banReason: banned ? (reason?.trim() || "Заблокирован администратором") : null, banExpires: null, updatedAt: new Date() })
      .where(eq(userTable.id, id))
    if (banned) await db.delete(sessionTable).where(eq(sessionTable.userId, id))
    await audit(admin, {
      action: banned ? "user.ban" : "user.unban",
      entity: "user",
      entityId: id,
      description: `${admin.name} ${banned ? "заблокировал" : "разблокировал"} пользователя ${target.name}`,
    })
    revalidatePath("/admin/users")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось изменить статус пользователя")
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("users.write")
    if (id === admin.id) return { ok: false, error: "Нельзя удалить собственный аккаунт" }
    const [target] = await db.select({ name: userTable.name, role: userTable.role }).from(userTable).where(eq(userTable.id, id))
    if (!target) return { ok: false, error: "Пользователь не найден" }
    if (target.role === "admin" && admin.role !== "admin") return { ok: false, error: "Недостаточно прав" }
    await db.delete(userTable).where(eq(userTable.id, id))
    await audit(admin, { action: "user.delete", entity: "user", entityId: id, description: `${admin.name} удалил пользователя ${target.name}` })
    revalidatePath("/admin/users")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось удалить пользователя")
  }
}

export async function getUserActivity(id: string) {
  await requireAdmin("users.read")
  const [logins, actions, sessions] = await Promise.all([
    db.select().from(loginAttempts).where(eq(loginAttempts.userId, id)).orderBy(desc(loginAttempts.createdAt)).limit(15),
    db.select().from(auditLogs).where(eq(auditLogs.actorId, id)).orderBy(desc(auditLogs.createdAt)).limit(15),
    db
      .select({ id: sessionTable.id, createdAt: sessionTable.createdAt, expiresAt: sessionTable.expiresAt, ipAddress: sessionTable.ipAddress, userAgent: sessionTable.userAgent })
      .from(sessionTable)
      .where(eq(sessionTable.userId, id))
      .orderBy(desc(sessionTable.createdAt)),
  ])
  return { logins, actions, sessions }
}

export async function countStaff() {
  await requireAdmin("users.read")
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(userTable).where(ne(userTable.role, "user"))
  return c
}
