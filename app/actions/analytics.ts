"use server"

import { and, desc, eq, gte, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { auditLogs, leads, pageViews, user as userTable } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/admin"
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/admin/constants"

export type Period = "24h" | "7d" | "30d" | "90d" | "12m" | "today" | "custom"

export type Range = { from: Date; to: Date; prevFrom: Date; prevTo: Date; bucket: "hour" | "day" | "month" }

export async function resolveRange(period: Period, custom?: { from?: string; to?: string }): Promise<Range> {
  const to = new Date()
  let from: Date
  let bucket: Range["bucket"] = "day"
  switch (period) {
    case "today": {
      from = new Date(to)
      from.setHours(0, 0, 0, 0)
      bucket = "hour"
      break
    }
    case "24h":
      from = new Date(to.getTime() - 24 * 3600e3)
      bucket = "hour"
      break
    case "30d":
      from = new Date(to.getTime() - 30 * 86400e3)
      break
    case "90d":
      from = new Date(to.getTime() - 90 * 86400e3)
      break
    case "12m":
      from = new Date(to.getTime() - 365 * 86400e3)
      bucket = "month"
      break
    case "custom": {
      from = custom?.from ? new Date(custom.from) : new Date(to.getTime() - 7 * 86400e3)
      const customTo = custom?.to ? new Date(custom.to) : to
      customTo.setHours(23, 59, 59, 999)
      const span = customTo.getTime() - from.getTime()
      bucket = span <= 2 * 86400e3 ? "hour" : span > 120 * 86400e3 ? "month" : "day"
      const prevFrom = new Date(from.getTime() - span)
      return { from, to: customTo, prevFrom, prevTo: from, bucket }
    }
    default:
      from = new Date(to.getTime() - 7 * 86400e3)
  }
  const span = to.getTime() - from.getTime()
  return { from, to, prevFrom: new Date(from.getTime() - span), prevTo: from, bucket }
}

function truncExpr(col: unknown, bucket: Range["bucket"]) {
  return sql<string>`to_char(date_trunc(${bucket}, ${col}), 'YYYY-MM-DD"T"HH24:00')`
}

export type SeriesPoint = {
  t: string
  visits: number
  users: number
  leads: number
  conversions: number
  revenue: number
}

export async function getActivitySeries(period: Period, custom?: { from?: string; to?: string }) {
  await requireAdmin("dashboard.read")
  const r = await resolveRange(period, custom)

  const [views, leadRows] = await Promise.all([
    db
      .select({
        t: truncExpr(pageViews.createdAt, r.bucket),
        visits: sql<number>`count(distinct ${pageViews.sessionId})::int`,
        users: sql<number>`count(distinct ${pageViews.visitorId})::int`,
      })
      .from(pageViews)
      .where(and(gte(pageViews.createdAt, r.from), lt(pageViews.createdAt, r.to)))
      .groupBy(sql`1`),
    db
      .select({
        t: truncExpr(leads.createdAt, r.bucket),
        leads: sql<number>`count(*)::int`,
        conversions: sql<number>`count(*) filter (where ${leads.status} = 'done')::int`,
        revenue: sql<number>`coalesce(sum(${leads.value}) filter (where ${leads.status} = 'done'), 0)::int`,
      })
      .from(leads)
      .where(and(gte(leads.createdAt, r.from), lt(leads.createdAt, r.to)))
      .groupBy(sql`1`),
  ])

  const map = new Map<string, SeriesPoint>()
  const step = r.bucket === "hour" ? 3600e3 : r.bucket === "day" ? 86400e3 : 0
  const cursor = new Date(r.from)
  if (r.bucket === "hour") cursor.setMinutes(0, 0, 0)
  else cursor.setHours(0, 0, 0, 0)
  if (r.bucket === "month") cursor.setDate(1)
  while (cursor <= r.to) {
    const key = keyOf(cursor, r.bucket)
    map.set(key, { t: key, visits: 0, users: 0, leads: 0, conversions: 0, revenue: 0 })
    if (step) cursor.setTime(cursor.getTime() + step)
    else cursor.setMonth(cursor.getMonth() + 1)
  }
  for (const v of views) {
    const p = map.get(v.t) ?? { t: v.t, visits: 0, users: 0, leads: 0, conversions: 0, revenue: 0 }
    p.visits = v.visits
    p.users = v.users
    map.set(v.t, p)
  }
  for (const l of leadRows) {
    const p = map.get(l.t) ?? { t: l.t, visits: 0, users: 0, leads: 0, conversions: 0, revenue: 0 }
    p.leads = l.leads
    p.conversions = l.conversions
    p.revenue = l.revenue
    map.set(l.t, p)
  }
  return { bucket: r.bucket, points: [...map.values()].sort((a, b) => a.t.localeCompare(b.t)) }
}

function keyOf(d: Date, bucket: Range["bucket"]) {
  const pad = (n: number) => String(n).padStart(2, "0")
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = bucket === "month" ? "01" : pad(d.getDate())
  const h = bucket === "hour" ? pad(d.getHours()) : "00"
  return `${y}-${m}-${day}T${h}:00`
}

export type Kpi = { current: number; previous: number }

export async function getDashboardKpis(period: Period = "7d") {
  await requireAdmin("dashboard.read")
  const r = await resolveRange(period)

  const countLeads = (from: Date, to: Date, extra?: ReturnType<typeof eq>) =>
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(gte(leads.createdAt, from), lt(leads.createdAt, to), eq(leads.archived, false), ...(extra ? [extra] : [])))
      .then((x) => x[0].c)

  const doneLeads = (from: Date, to: Date) =>
    db
      .select({ c: sql<number>`count(*)::int`, revenue: sql<number>`coalesce(sum(${leads.value}),0)::int` })
      .from(leads)
      .where(and(gte(leads.updatedAt, from), lt(leads.updatedAt, to), eq(leads.status, "done")))
      .then((x) => x[0])

  const visits = (from: Date, to: Date) =>
    db
      .select({
        sessions: sql<number>`count(distinct ${pageViews.sessionId})::int`,
        visitors: sql<number>`count(distinct ${pageViews.visitorId})::int`,
      })
      .from(pageViews)
      .where(and(gte(pageViews.createdAt, from), lt(pageViews.createdAt, to)))
      .then((x) => x[0])

  const users = (from: Date, to: Date) =>
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(userTable)
      .where(and(gte(userTable.createdAt, from), lt(userTable.createdAt, to)))
      .then((x) => x[0].c)

  const [
    newLeadsCur,
    newLeadsPrev,
    doneCur,
    donePrev,
    visitsCur,
    visitsPrev,
    usersCur,
    usersPrev,
    [{ totalUsers }],
  ] = await Promise.all([
    countLeads(r.from, r.to),
    countLeads(r.prevFrom, r.prevTo),
    doneLeads(r.from, r.to),
    doneLeads(r.prevFrom, r.prevTo),
    visits(r.from, r.to),
    visits(r.prevFrom, r.prevTo),
    users(r.from, r.to),
    users(r.prevFrom, r.prevTo),
    db.select({ totalUsers: sql<number>`count(*)::int` }).from(userTable),
  ])

  const conv = (l: number, v: number) => (v === 0 ? 0 : (l / v) * 100)

  return {
    newLeads: { current: newLeadsCur, previous: newLeadsPrev } as Kpi,
    users: { current: totalUsers, previous: totalUsers - usersCur + usersPrev } as Kpi,
    revenue: { current: doneCur.revenue, previous: donePrev.revenue } as Kpi,
    conversion: {
      current: conv(newLeadsCur, visitsCur.sessions),
      previous: conv(newLeadsPrev, visitsPrev.sessions),
    } as Kpi,
    visits: { current: visitsCur.sessions, previous: visitsPrev.sessions } as Kpi,
    processed: { current: doneCur.c, previous: donePrev.c } as Kpi,
  }
}

export async function getTrafficSources(period: Period = "7d", custom?: { from?: string; to?: string }) {
  await requireAdmin("dashboard.read")
  const r = await resolveRange(period, custom)
  const rows = await db
    .select({ source: pageViews.source, c: sql<number>`count(distinct ${pageViews.sessionId})::int` })
    .from(pageViews)
    .where(and(gte(pageViews.createdAt, r.from), lt(pageViews.createdAt, r.to)))
    .groupBy(pageViews.source)
  const byKey = Object.fromEntries(rows.map((x) => [x.source, x.c]))
  return LEAD_SOURCES.map((s) => ({ source: s, value: byKey[s] ?? 0 }))
}

export async function getLeadStatusBreakdown() {
  await requireAdmin("dashboard.read")
  const rows = await db
    .select({ status: leads.status, c: sql<number>`count(*)::int` })
    .from(leads)
    .where(eq(leads.archived, false))
    .groupBy(leads.status)
  const byKey = Object.fromEntries(rows.map((x) => [x.status, x.c]))
  return LEAD_STATUSES.map((s) => ({ status: s, value: byKey[s] ?? 0 }))
}

export async function getRecentLeads(limit = 6) {
  await requireAdmin("leads.read")
  return db
    .select({
      id: leads.id,
      name: leads.name,
      service: leads.service,
      status: leads.status,
      source: leads.source,
      createdAt: leads.createdAt,
      value: leads.value,
    })
    .from(leads)
    .where(eq(leads.archived, false))
    .orderBy(desc(leads.createdAt))
    .limit(limit)
}

export async function getRecentActivity(limit = 8) {
  await requireAdmin("dashboard.read")
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit)
}

export async function getAnalyticsOverview(period: Period, custom?: { from?: string; to?: string }) {
  await requireAdmin("analytics.read")
  const r = await resolveRange(period, custom)

  const stats = (from: Date, to: Date) =>
    db
      .select({
        views: sql<number>`count(*)::int`,
        sessions: sql<number>`count(distinct ${pageViews.sessionId})::int`,
        visitors: sql<number>`count(distinct ${pageViews.visitorId})::int`,
        avgDuration: sql<number>`coalesce(avg(${pageViews.duration}),0)::float`,
      })
      .from(pageViews)
      .where(and(gte(pageViews.createdAt, from), lt(pageViews.createdAt, to)))
      .then((x) => x[0])

  const bounce = (from: Date, to: Date) =>
    db
      .select({
        bounced: sql<number>`count(*) filter (where c = 1)::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(
        db
          .select({ sid: pageViews.sessionId, c: sql<number>`count(*)`.as("c") })
          .from(pageViews)
          .where(and(gte(pageViews.createdAt, from), lt(pageViews.createdAt, to)))
          .groupBy(pageViews.sessionId)
          .as("s"),
      )
      .then((x) => x[0])

  const leadStats = (from: Date, to: Date) =>
    db
      .select({
        c: sql<number>`count(*)::int`,
        done: sql<number>`count(*) filter (where ${leads.status}='done')::int`,
        revenue: sql<number>`coalesce(sum(${leads.value}) filter (where ${leads.status}='done'),0)::int`,
      })
      .from(leads)
      .where(and(gte(leads.createdAt, from), lt(leads.createdAt, to)))
      .then((x) => x[0])

  const [cur, prev, bCur, bPrev, lCur, lPrev, topPages, devices] = await Promise.all([
    stats(r.from, r.to),
    stats(r.prevFrom, r.prevTo),
    bounce(r.from, r.to),
    bounce(r.prevFrom, r.prevTo),
    leadStats(r.from, r.to),
    leadStats(r.prevFrom, r.prevTo),
    db
      .select({ path: pageViews.path, views: sql<number>`count(*)::int`, avg: sql<number>`coalesce(avg(${pageViews.duration}),0)::float` })
      .from(pageViews)
      .where(and(gte(pageViews.createdAt, r.from), lt(pageViews.createdAt, r.to)))
      .groupBy(pageViews.path)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
    db
      .select({ device: pageViews.device, c: sql<number>`count(distinct ${pageViews.sessionId})::int` })
      .from(pageViews)
      .where(and(gte(pageViews.createdAt, r.from), lt(pageViews.createdAt, r.to)))
      .groupBy(pageViews.device),
  ])

  const rate = (b: { bounced: number; total: number }) => (b.total ? (b.bounced / b.total) * 100 : 0)
  const conv = (l: number, s: number) => (s ? (l / s) * 100 : 0)

  return {
    range: { from: r.from.toISOString(), to: r.to.toISOString() },
    visits: { current: cur.sessions, previous: prev.sessions },
    uniques: { current: cur.visitors, previous: prev.visitors },
    pageviews: { current: cur.views, previous: prev.views },
    avgDuration: { current: cur.avgDuration, previous: prev.avgDuration },
    bounceRate: { current: rate(bCur), previous: rate(bPrev) },
    leads: { current: lCur.c, previous: lPrev.c },
    conversion: { current: conv(lCur.c, cur.sessions), previous: conv(lPrev.c, prev.sessions) },
    revenue: { current: lCur.revenue, previous: lPrev.revenue },
    topPages,
    devices: devices.map((d) => ({ device: d.device ?? "desktop", value: d.c })),
  }
}
