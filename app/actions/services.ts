"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { audit, fail, requireAdmin, type ActionResult } from "@/lib/admin"

export async function listServices() {
  await requireAdmin("services.read")
  return db.select().from(services).orderBy(asc(services.sortOrder), asc(services.id))
}

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  priceLabel: z.string().trim().max(60).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  active: z.boolean().default(true),
})

export type ServiceInput = z.infer<typeof schema>

export async function upsertService(id: number | null, input: ServiceInput): Promise<ActionResult<{ id: number }>> {
  try {
    const admin = await requireAdmin("services.write")
    const d = schema.parse(input)
    const values = {
      title: d.title,
      slug: d.slug,
      description: d.description || null,
      price: d.price,
      priceLabel: d.priceLabel || null,
      category: d.category || null,
      features: d.features,
      active: d.active,
      updatedAt: new Date(),
    }
    let resultId: number
    if (id) {
      await db.update(services).set(values).where(eq(services.id, id))
      resultId = id
    } else {
      const [row] = await db.insert(services).values(values).returning({ id: services.id })
      resultId = row.id
    }
    await audit(admin, {
      action: id ? "service.update" : "service.create",
      entity: "service",
      entityId: resultId,
      description: `${admin.name} ${id ? "обновил" : "создал"} услугу «${d.title}»`,
    })
    revalidatePath("/admin/services")
    revalidatePath("/")
    return { ok: true, data: { id: resultId } }
  } catch (e) {
    if (e instanceof Error && /unique|duplicate/i.test(e.message)) return { ok: false, error: "Услуга с таким slug уже существует" }
    return fail(e, "Не удалось сохранить услугу")
  }
}

export async function deleteService(id: number): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("services.write")
    const [s] = await db.delete(services).where(eq(services.id, id)).returning({ title: services.title })
    if (s) await audit(admin, { action: "service.delete", entity: "service", entityId: id, description: `${admin.name} удалил услугу «${s.title}»` })
    revalidatePath("/admin/services")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось удалить услугу")
  }
}

export async function toggleService(id: number, active: boolean): Promise<ActionResult> {
  try {
    await requireAdmin("services.write")
    await db.update(services).set({ active, updatedAt: new Date() }).where(eq(services.id, id))
    revalidatePath("/admin/services")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e)
  }
}

export async function reorderServices(ids: number[]): Promise<ActionResult> {
  try {
    await requireAdmin("services.write")
    const clean = z.array(z.number().int().positive()).parse(ids)
    await Promise.all(clean.map((id, i) => db.update(services).set({ sortOrder: i + 1 }).where(eq(services.id, id))))
    revalidatePath("/admin/services")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e)
  }
}
