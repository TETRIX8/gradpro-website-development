"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { asc, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { contentRevisions, contentSections } from "@/lib/db/schema"
import { audit, fail, requireAdmin, type ActionResult } from "@/lib/admin"

const jsonSchema = z.record(z.string(), z.unknown())

export async function listSections() {
  await requireAdmin("content.read")
  return db.select().from(contentSections).orderBy(asc(contentSections.sortOrder))
}

export async function getSection(slug: string) {
  await requireAdmin("content.read")
  const [section] = await db.select().from(contentSections).where(eq(contentSections.slug, slug))
  if (!section) return null
  const revisions = await db
    .select()
    .from(contentRevisions)
    .where(eq(contentRevisions.sectionSlug, slug))
    .orderBy(desc(contentRevisions.createdAt))
    .limit(30)
  return { section, revisions }
}

export async function saveDraft(slug: string, data: Record<string, unknown>, note?: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("content.write")
    const clean = jsonSchema.parse(data)
    const [before] = await db.select({ draft: contentSections.draft, title: contentSections.title }).from(contentSections).where(eq(contentSections.slug, slug))
    if (!before) return { ok: false, error: "Раздел не найден" }
    await db.insert(contentRevisions).values({
      sectionSlug: slug,
      data: before.draft,
      authorId: admin.id,
      authorName: admin.name,
      note: note ?? "Черновик перед сохранением",
    })
    await db
      .update(contentSections)
      .set({ draft: clean, updatedBy: admin.id, updatedAt: new Date() })
      .where(eq(contentSections.slug, slug))
    await audit(admin, { action: "content.save", entity: "content", entityId: slug, description: `${admin.name} сохранил черновик раздела «${before.title}»` })
    revalidatePath("/admin/content")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось сохранить изменения")
  }
}

export async function publishSection(slug: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("content.publish")
    const [s] = await db.select().from(contentSections).where(eq(contentSections.slug, slug))
    if (!s) return { ok: false, error: "Раздел не найден" }
    await db
      .update(contentSections)
      .set({ published: s.draft, publishedAt: new Date(), updatedBy: admin.id, updatedAt: new Date() })
      .where(eq(contentSections.slug, slug))
    await db.insert(contentRevisions).values({ sectionSlug: slug, data: s.draft, authorId: admin.id, authorName: admin.name, note: "Опубликовано" })
    await audit(admin, { action: "content.publish", entity: "content", entityId: slug, description: `${admin.name} опубликовал раздел «${s.title}»` })
    revalidatePath("/admin/content")
    revalidatePath("/")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось опубликовать")
  }
}

export async function restoreRevision(slug: string, revisionId: number): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("content.write")
    const [rev] = await db.select().from(contentRevisions).where(eq(contentRevisions.id, revisionId))
    if (!rev || rev.sectionSlug !== slug) return { ok: false, error: "Версия не найдена" }
    const [cur] = await db.select({ draft: contentSections.draft, title: contentSections.title }).from(contentSections).where(eq(contentSections.slug, slug))
    if (!cur) return { ok: false, error: "Раздел не найден" }
    await db.insert(contentRevisions).values({ sectionSlug: slug, data: cur.draft, authorId: admin.id, authorName: admin.name, note: "Перед откатом" })
    await db.update(contentSections).set({ draft: rev.data, updatedBy: admin.id, updatedAt: new Date() }).where(eq(contentSections.slug, slug))
    await audit(admin, { action: "content.restore", entity: "content", entityId: slug, description: `${admin.name} откатил раздел «${cur.title}» к версии #${revisionId}` })
    revalidatePath("/admin/content")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось восстановить версию")
  }
}

export async function setSectionVisibility(slug: string, visible: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("content.publish")
    await db.update(contentSections).set({ visible, updatedAt: new Date(), updatedBy: admin.id }).where(eq(contentSections.slug, slug))
    await audit(admin, { action: "content.visibility", entity: "content", entityId: slug, description: `${admin.name} ${visible ? "включил" : "скрыл"} раздел «${slug}»` })
    revalidatePath("/admin/content")
    revalidatePath("/")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось изменить видимость")
  }
}

export async function reorderSections(slugs: string[]): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("content.publish")
    const clean = z.array(z.string().min(1)).min(1).parse(slugs)
    await Promise.all(clean.map((slug, i) => db.update(contentSections).set({ sortOrder: i + 1 }).where(eq(contentSections.slug, slug))))
    await audit(admin, { action: "content.reorder", entity: "content", description: `${admin.name} изменил порядок блоков сайта` })
    revalidatePath("/admin/content")
    revalidatePath("/")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось изменить порядок")
  }
}
