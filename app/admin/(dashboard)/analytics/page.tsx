import { requireAdminPage } from "@/lib/admin"
import { getActivitySeries, getAnalyticsOverview, getTrafficSources, type Period } from "@/app/actions/analytics"
import { AnalyticsView } from "@/components/admin/analytics/analytics-view"

export const metadata = { title: "Аналитика" }

const PERIODS: Period[] = ["today", "24h", "7d", "30d", "90d", "12m", "custom"]

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  await requireAdminPage("analytics.read")
  const sp = await searchParams
  const period: Period = PERIODS.includes(sp.period as Period) ? (sp.period as Period) : "30d"
  const custom = period === "custom" ? { from: sp.from, to: sp.to } : undefined

  const [overview, series, sources] = await Promise.all([
    getAnalyticsOverview(period, custom),
    getActivitySeries(period, custom),
    getTrafficSources(period, custom),
  ])

  return <AnalyticsView period={period} custom={custom} overview={overview} series={series} sources={sources} />
}
