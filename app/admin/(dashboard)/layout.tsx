import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { leads, messages, notifications, siteSettings } from "@/lib/db/schema"
import { requireAdminPage } from "@/lib/admin"
import { AdminShell } from "@/components/admin/shell/admin-shell"

export const metadata = {
  title: { default: "Админ-панель — Gradpro", template: "%s — Gradpro Admin" },
  description: "Центр управления сайтом Gradpro",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [admin, cookieStore] = await Promise.all([requireAdminPage(), cookies()])
  const theme = cookieStore.get("admin-theme")?.value === "light" ? "light" : "dark"
  const collapsed = cookieStore.get("admin-sidebar")?.value === "collapsed"

  const [[leadBadge], [msgBadge], notifRows, [notifAgg], [notifSettings]] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.status, "new"), eq(leads.archived, false))),
    db.select({ c: sql<number>`count(*)::int` }).from(messages).where(and(eq(messages.read, false), eq(messages.direction, "in"))),
    db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(20),
    db
      .select({
        unread: sql<number>`count(*) filter (where ${notifications.read} = false)::int`,
        latest: sql<number>`coalesce(max(${notifications.id}), 0)::int`,
      })
      .from(notifications),
    db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, "notifications")),
  ])

  const soundEnabled = (notifSettings?.value as { soundOnNewLead?: boolean } | undefined)?.soundOnNewLead !== false

  return (
    <>
      {theme === "dark" && (
        // Applies the theme class before hydration so the panel never flashes light.
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'" }} />
      )}
      <AdminShell
      user={admin}
      theme={theme}
      collapsedInitial={collapsed}
      badges={{ leads: leadBadge.c, messages: msgBadge.c, notifications: notifAgg.unread }}
      notifications={{ rows: notifRows, unread: notifAgg.unread, latestId: notifAgg.latest }}
      soundEnabled={soundEnabled}
    >
        {children}
      </AdminShell>
    </>
  )
}
