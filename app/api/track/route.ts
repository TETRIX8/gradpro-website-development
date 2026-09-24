import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { pageViews } from "@/lib/db/schema"
import { normalizeSource } from "@/lib/admin/constants"
import { deviceType } from "@/lib/admin/device"

const schema = z.object({
  path: z.string().max(500),
  visitorId: z.string().min(8).max(64),
  sessionId: z.string().min(8).max(64),
  referrer: z.string().max(1000).optional().nullable(),
  utmSource: z.string().max(100).optional().nullable(),
  duration: z.number().int().min(0).max(86_400).optional(),
  viewId: z.number().int().positive().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
  const d = parsed.data

  if (d.path.startsWith("/admin")) return NextResponse.json({ ok: true, skipped: true })

  // Heartbeat: extend duration of an existing view.
  if (d.viewId && d.duration != null) {
    await db
      .update(pageViews)
      .set({ duration: d.duration })
      .where(and(eq(pageViews.id, d.viewId), eq(pageViews.visitorId, d.visitorId)))
    return NextResponse.json({ ok: true })
  }

  const source = normalizeSource(d.utmSource || d.referrer)
  const [row] = await db
    .insert(pageViews)
    .values({
      path: d.path,
      visitorId: d.visitorId,
      sessionId: d.sessionId,
      source,
      referrer: d.referrer ?? null,
      device: deviceType(req.headers.get("user-agent")),
    })
    .returning({ id: pageViews.id })

  const res = NextResponse.json({ ok: true, id: row.id })
  const existing = req.cookies.get("gp_src")?.value
  if (!existing || (existing === "direct" && source !== "direct")) {
    res.cookies.set("gp_src", source, { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax" })
  }
  if (!req.cookies.get("gp_landing")) {
    res.cookies.set("gp_landing", d.path, { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax" })
  }
  return res
}
