import { requireAdminPage } from "@/lib/admin"
import { fmtLongDate } from "@/lib/admin/format"
import {
  getActivitySeries,
  getDashboardKpis,
  getLeadStatusBreakdown,
  getRecentActivity,
  getRecentLeads,
  getTrafficSources,
} from "@/app/actions/analytics"
import { KpiCard } from "@/components/admin/dashboard/kpi-card"
import { ActivityChart } from "@/components/admin/dashboard/activity-chart"
import { SourcesChart } from "@/components/admin/dashboard/sources-chart"
import { ActivityFeed, QuickActions, RecentLeads, StatusBreakdown } from "@/components/admin/dashboard/widgets"
import { PageHeader } from "@/components/admin/ui"
import { ForbiddenNotice } from "@/components/admin/forbidden-notice"

export const metadata = { title: "Дашборд" }

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ forbidden?: string }> }) {
  const admin = await requireAdminPage("dashboard.read")
  const sp = await searchParams
  const canLeads = admin.permissions.includes("leads.read")

  const [kpis, series, sources, statuses, recent, activity] = await Promise.all([
    getDashboardKpis("7d"),
    getActivitySeries("7d"),
    getTrafficSources("7d"),
    getLeadStatusBreakdown(),
    canLeads ? getRecentLeads(6) : Promise.resolve([]),
    getRecentActivity(8),
  ])

  const spark = (key: "visits" | "leads" | "conversions" | "revenue") => series.points.map((p) => p[key])
  const hour = new Date().getHours()
  const greeting = hour < 6 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер"

  return (
    <div className="flex flex-col gap-6">
      {sp.forbidden && <ForbiddenNotice />}
      <PageHeader
        eyebrow={fmtLongDate()}
        title={`${greeting}, ${admin.name.split(" ")[0]}`}
        description="Ключевые показатели за последние 7 дней в сравнении с предыдущей неделей."
      />

      <section aria-label="Ключевые метрики" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Новые заявки" value={kpis.newLeads.current} previous={kpis.newLeads.previous} icon="inbox" tone="primary" index={0} spark={spark("leads")} />
        <KpiCard label="Визиты" value={kpis.visits.current} previous={kpis.visits.previous} icon="eye" tone="electric" index={1} spark={spark("visits")} />
        <KpiCard label="Конверсия" value={kpis.conversion.current} previous={kpis.conversion.previous} format="percent" icon="percent" tone="accent" index={2} />
        <KpiCard label="Обработано" value={kpis.processed.current} previous={kpis.processed.previous} icon="check" tone="emerald" index={3} spark={spark("conversions")} />
        <KpiCard label="Доход" value={kpis.revenue.current} previous={kpis.revenue.previous} format="money" icon="wallet" tone="primary" index={4} spark={spark("revenue")} />
        <KpiCard label="Пользователи" value={kpis.users.current} previous={kpis.users.previous} icon="users" tone="accent" index={5} />
      </section>

      <QuickActions permissions={admin.permissions} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChart initial={series} />
        </div>
        <SourcesChart data={sources} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">{canLeads ? <RecentLeads rows={recent} /> : <ActivityFeed rows={activity} />}</div>
        <div className="flex flex-col gap-4">
          <StatusBreakdown data={statuses} />
          {canLeads && <ActivityFeed rows={activity.slice(0, 5)} />}
        </div>
      </section>
    </div>
  )
}
