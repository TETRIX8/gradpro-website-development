import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, type Project } from '@/lib/db/schema'

export async function getPublishedProjects(): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(eq(projects.published, true))
    .orderBy(asc(projects.sortOrder), asc(projects.id))
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1)
  return rows[0] ?? null
}

/** Returns published neighbours for prev/next navigation. */
export async function getProjectNeighbours(slug: string) {
  const all = await getPublishedProjects()
  const idx = all.findIndex((p) => p.slug === slug)
  if (idx === -1) return { prev: null, next: null }
  const prev = all[(idx - 1 + all.length) % all.length] ?? null
  const next = all[(idx + 1) % all.length] ?? null
  return { prev: prev?.slug === slug ? null : prev, next: next?.slug === slug ? null : next }
}
