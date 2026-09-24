"use client"

import { useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { Monitor, Smartphone, Tablet, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { getAnalyticsOverview, getActivitySeries, Period } from "@/app/actions/analytics"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { KpiCard } from "@/components/admin/dashboard/kpi-card"
import { ActivityChart } from "@/components/admin/dashboard/activity-chart"
import { SourcesChart } from "@/components/admin/dashboard/sources-chart"
import { Card, EmptyState, PageHeader, SegmentedTabs, TextInput } from "@/components/admin/ui"
import { fmtDuration, fmtNumber, pctChange } from "@/lib/admin/format"

type Overview = Awaited<ReturnType<typeof getAnalyticsOverview>>
type Series = Awaited<ReturnType<typeof getActivitySeries>>

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "Квартал" },
  { value: "12m", label: "Год" },
  { value: "custom", label: "Период" },
]

const DEVICE_META: Record<string, { label: string; icon: typeof Monitor; color: string }> = {
  desktop: { label: "Компьютер", icon: Monitor, color: "var(--primary)" },
  mobile: { label: "Телефон", icon: Smartphone, color: "var(--accent)" },
  tablet: { label: "Планшет", icon: Tablet, color: "var(--chart-3, #7c9cff)" },
}

export function AnalyticsView({
  period,
  custom,
  overview,
  series,
  sources,
}: {
  period: Period
  custom?: { from?: string; to?: string }
  overview: Overview
  series: Series
  sources: { source: string; value: number }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, start] = useTransition()

  const go = (p: Period, c?: { from?: string; to?: string }) => {
    const params = new URLSearchParams({ period: p })
    if (p === "custom") {
      if (c?.from) params.set("from", c.from)
      if (c?.to) params.set("to", c.to)
    }
    start(() => router.push(`${pathname}?${params}`))
  }

  const pagesConfig: ChartConfig = { views: { label: "Просмотры", color: "var(--primary)" } }
  const totalDevices = overview.devices.reduce((a, d) => a + d.value, 0)

  return (
    <div className={cn("flex flex-col gap-6", pending && "opacity-70 transition-opacity")}>
      <PageHeader
        eyebrow="Данные"
        title="Аналитика"
        description="Трафик, поведение посетителей и эффективность воронки за выбранный период."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedTabs value={period} onChange={(p) => go(p, custom)} options={PERIODS} />
            {period === "custom" && (
              <div className="flex items-center gap-1.5">
                <TextInput type="date" className="h-9 w-auto py-1 text-xs" value={custom?.from ?? ""} onChange={(e) => go("custom", { ...custom, from: e.target.value })} aria-label="Начало периода" />
                <span className="text-xs text-muted-foreground">—</span>
                <TextInput type="date" className="h-9 w-auto py-1 text-xs" value={custom?.to ?? ""} onChange={(e) => go("custom", { ...custom, to: e.target.value })} aria-label="Конец периода" />
              </div>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Визиты" value={overview.visits.current} previous={overview.visits.previous} icon="eye" tone="primary" index={0} />
        <KpiCard label="Уникальные посетители" value={overview.uniques.current} previous={overview.uniques.previous} icon="users" tone="electric" index={1} />
        <KpiCard label="Просмотры страниц" value={overview.pageviews.current} previous={overview.pageviews.previous} icon="eye" tone="accent" index={2} />
        <KpiCard label="Заявки" value={overview.leads.current} previous={overview.leads.previous} icon="inbox" tone="emerald" index={3} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Конверсия в заявку" value={`${overview.conversion.current.toFixed(1)}%`} change={pctChange(overview.conversion.current, overview.conversion.previous)} />
        <MiniStat label="Показатель отказов" value={`${overview.bounceRate.current.toFixed(1)}%`} change={pctChange(overview.bounceRate.current, overview.bounceRate.previous)} invert />
        <MiniStat label="Среднее время на сайте" value={fmtDuration(overview.avgDuration.current)} change={pctChange(overview.avgDuration.current, overview.avgDuration.previous)} />
        <MiniStat label="Доход (закрытые сделки)" value={`${fmtNumber(overview.revenue.current)} ₽`} change={pctChange(overview.revenue.current, overview.revenue.previous)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <ActivityChart initial={series} initialPeriod={period} />
        </Card>
        <SourcesChart data={sources} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Популярные страницы</h2>
              <p className="text-xs text-muted-foreground">Просмотры и среднее время на странице</p>
            </div>
            <TrendingUp className="size-4 text-muted-foreground" />
          </div>
          {overview.topPages.length === 0 ? (
            <EmptyState title="Нет данных" description="Просмотры страниц появятся, как только на сайт зайдут посетители." className="py-10" />
          ) : (
            <>
              <ChartContainer config={pagesConfig} className="h-[220px] w-full">
                <BarChart data={overview.topPages} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="path" width={140} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <ChartTooltip cursor={{ fill: "var(--foreground)", opacity: 0.04 }} content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="views" radius={6} fill="var(--color-views)">
                    {overview.topPages.map((_, i) => (
                      <Cell key={i} fillOpacity={1 - i * 0.08} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <ul className="mt-2 divide-y divide-border/60 text-sm">
                {overview.topPages.map((p) => (
                  <li key={p.path} className="flex items-center justify-between gap-4 py-2">
                    <span className="truncate font-mono text-xs">{p.path}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmtNumber(p.views)} · {fmtDuration(p.avg)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Устройства</h2>
          <p className="mb-5 text-xs text-muted-foreground">Доля сессий по типу устройства</p>
          {totalDevices === 0 ? (
            <EmptyState title="Нет данных" className="py-10" />
          ) : (
            <ul className="flex flex-col gap-4">
              {overview.devices
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((d) => {
                  const meta = DEVICE_META[d.device] ?? DEVICE_META.desktop
                  const Icon = meta.icon
                  const pct = (d.value / totalDevices) * 100
                  return (
                    <li key={d.device}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="size-4 text-muted-foreground" /> {meta.label}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {fmtNumber(d.value)} · {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                    </li>
                  )
                })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function MiniStat({ label, value, change, invert }: { label: string; value: string; change: number; invert?: boolean }) {
  const good = invert ? change < 0 : change > 0
  const neutral = Math.abs(change) < 0.05
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="font-display text-xl font-bold tabular-nums">{value}</span>
        <span className={cn("text-xs font-medium tabular-nums", neutral ? "text-muted-foreground" : good ? "text-emerald-500" : "text-destructive")}>
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </div>
    </Card>
  )
}
