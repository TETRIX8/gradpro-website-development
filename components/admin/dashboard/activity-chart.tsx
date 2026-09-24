"use client"

import { useMemo, useState, useTransition } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { SegmentedTabs, Skeleton } from "@/components/admin/ui"
import { getActivitySeries, type Period, type SeriesPoint } from "@/app/actions/analytics"

const config = {
  visits: { label: "Визиты", color: "var(--electric)" },
  leads: { label: "Заявки", color: "var(--primary)" },
  conversions: { label: "Завершено", color: "var(--accent)" },
} satisfies ChartConfig

const PERIODS: { value: Period; label: string }[] = [
  { value: "24h", label: "24ч" },
  { value: "7d", label: "7д" },
  { value: "30d", label: "30д" },
  { value: "12m", label: "Год" },
]

function fmtTick(t: string, bucket: string) {
  const d = new Date(t)
  if (bucket === "hour") return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  if (bucket === "month") return d.toLocaleDateString("ru-RU", { month: "short" })
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })
}

export function ActivityChart({ initial, initialPeriod = "7d" }: { initial: { bucket: string; points: SeriesPoint[] }; initialPeriod?: Period }) {
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [data, setData] = useState(initial)
  const [pending, start] = useTransition()

  const change = (p: Period) => {
    setPeriod(p)
    start(async () => {
      const next = await getActivitySeries(p)
      setData(next)
    })
  }

  const totals = useMemo(
    () =>
      data.points.reduce(
        (acc, p) => ({ visits: acc.visits + p.visits, leads: acc.leads + p.leads, conversions: acc.conversions + p.conversions }),
        { visits: 0, leads: 0, conversions: 0 },
      ),
    [data],
  )

  return (
    <div className="admin-card flex h-full flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">Активность</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Визиты, заявки и завершённые сделки</p>
        </div>
        <SegmentedTabs value={period} onChange={change} options={PERIODS} />
      </div>

      <div className="mt-4 flex flex-wrap gap-5">
        {(Object.keys(config) as (keyof typeof config)[]).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: config[k].color }} aria-hidden />
            <span className="text-xs text-muted-foreground">{config[k].label}</span>
            <span className="text-sm font-semibold tabular-nums">{totals[k].toLocaleString("ru-RU")}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-4 flex-1 min-h-[260px]">
        {pending && <Skeleton className="absolute inset-0 z-10 opacity-70" />}
        <ChartContainer config={config} className="h-[260px] w-full">
          <AreaChart data={data.points} margin={{ left: -12, right: 8, top: 8 }}>
            <defs>
              {(Object.keys(config) as (keyof typeof config)[]).map((k) => (
                <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config[k].color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={config[k].color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(t) => fmtTick(t, data.bucket)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={<ChartTooltipContent labelFormatter={(v) => fmtTick(String(v), data.bucket)} indicator="line" />}
            />
            <Area dataKey="visits" type="monotone" stroke="var(--color-visits)" fill="url(#fill-visits)" strokeWidth={2} />
            <Area dataKey="leads" type="monotone" stroke="var(--color-leads)" fill="url(#fill-leads)" strokeWidth={2} />
            <Area dataKey="conversions" type="monotone" stroke="var(--color-conversions)" fill="url(#fill-conversions)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
