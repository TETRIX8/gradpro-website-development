'use server'

import { revalidatePath } from 'next/cache'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, type Project } from '@/lib/db/schema'
import { requireAdmin as requireStaff } from '@/lib/admin'

async function requireAdmin() {
  const admin = await requireStaff('content.write')
  return admin.id
}

export type ProjectInput = {
  title: string
  slug: string
  tagline: string
  description: string
  category: string
  year: number
  technologies: string[]
  coverUrl: string
  gallery: string[]
  videoUrl: string | null
  accent: string
  published: boolean
  featured: boolean
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function validate(input: ProjectInput) {
  const errors: Partial<Record<keyof ProjectInput, string>> = {}
  if (!input.title.trim() || input.title.length > 80) errors.title = 'Введите название (до 80 символов)'
  if (!SLUG_RE.test(input.slug)) errors.slug = 'Slug: только латиница, цифры и дефисы'
  if (input.year < 2000 || input.year > 2100) errors.year = 'Некорректный год'
  if (!input.coverUrl) errors.coverUrl = 'Загрузите обложку'
  if (input.videoUrl && !/^https?:\/\//.test(input.videoUrl)) errors.videoUrl = 'Ссылка должна начинаться с http(s)://'
  if (!['lime', 'violet', 'blue'].includes(input.accent)) errors.accent = 'Неверный акцент'
  return errors
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/projects/[slug]', 'page')
  revalidatePath('/admin/projects')
}

export async function listAllProjects(): Promise<Project[]> {
  await requireAdmin()
  return db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id))
}

export async function createProject(input: ProjectInput) {
  const userId = await requireAdmin()
  const errors = validate(input)
  if (Object.keys(errors).length) return { ok: false as const, errors }

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${projects.sortOrder}), -1)` })
    .from(projects)

  try {
    const [row] = await db
      .insert(projects)
      .values({ ...input, userId, sortOrder: Number(max) + 1, updatedAt: new Date() })
      .returning()
    revalidateAll()
    return { ok: true as const, project: row }
  } catch (e) {
    const msg = e instanceof Error && /unique/i.test(e.message) ? 'Такой slug уже существует' : 'Не удалось сохранить проект'
    return { ok: false as const, errors: { slug: msg } }
  }
}

export async function updateProject(id: number, input: ProjectInput) {
  await requireAdmin()
  const errors = validate(input)
  if (Object.keys(errors).length) return { ok: false as const, errors }
  try {
    const [row] = await db
      .update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()
    revalidateAll()
    return { ok: true as const, project: row }
  } catch (e) {
    const msg = e instanceof Error && /unique/i.test(e.message) ? 'Такой slug уже существует' : 'Не удалось сохранить проект'
    return { ok: false as const, errors: { slug: msg } }
  }
}

export async function deleteProject(id: number) {
  await requireAdmin()
  await db.delete(projects).where(eq(projects.id, id))
  revalidateAll()
  return { ok: true as const }
}

export async function togglePublished(id: number, published: boolean) {
  await requireAdmin()
  await db.update(projects).set({ published, updatedAt: new Date() }).where(eq(projects.id, id))
  revalidateAll()
  return { ok: true as const }
}

export async function toggleFeatured(id: number, featured: boolean) {
  await requireAdmin()
  await db.update(projects).set({ featured, updatedAt: new Date() }).where(eq(projects.id, id))
  revalidateAll()
  return { ok: true as const }
}

export async function reorderProjects(orderedIds: number[]) {
  await requireAdmin()
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(projects).set({ sortOrder: i }).where(eq(projects.id, orderedIds[i]))
    }
  })
  revalidateAll()
  return { ok: true as const }
}
