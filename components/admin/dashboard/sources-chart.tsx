"use client"

import { Cell, Pie, PieChart, Label } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { LEAD_SOURCE_LABELS, SOURCE_COLORS, type LeadSource } from "@/lib/admin/constants"
import { EmptyState } from "@/components/admin/ui"
import { Globe } from "lucide-react"

export function SourcesChart({ data, title = "Источники трафика", subtitle = "Сессии по каналам" }: { data: { source: string; value: number }[]; title?: string; subtitle?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const config = Object.fromEntries(
    data.map((d) => [d.source, { label: LEAD_SOURCE_LABELS[d.source as LeadSource] ?? d.source, color: SOURCE_COLORS[d.source as LeadSource] ?? "#a1a1aa" }]),
  ) satisfies ChartConfig
  const nonZero = data.filter((d) => d.value > 0)

  return (
    <div className="admin-card flex h-full flex-col p-5">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      {total === 0 ? (
        <EmptyState icon={<Globe />} title="Пока нет данных" description="Как только на сайт придут посетители, здесь появится распределение по источникам." className="py-10" />
      ) : (
        <>
          <ChartContainer config={config} className="mx-auto mt-2 aspect-square max-h-[220px] w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="source" />} />
              <Pie data={nonZero} dataKey="value" nameKey="source" innerRadius={62} outerRadius={90} paddingAngle={3} strokeWidth={0} cornerRadius={6}>
                {nonZero.map((d) => (
                  <Cell key={d.source} fill={SOURCE_COLORS[d.source as LeadSource] ?? "#a1a1aa"} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox)) return null
                    const { cx, cy } = viewBox as { cx: number; cy: number }
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy - 6} className="fill-foreground font-display text-2xl font-bold">
                          {total.toLocaleString("ru-RU")}
                        </tspan>
                        <tspan x={cx} y={cy + 16} className="fill-muted-foreground text-[11px]">
                          сессий
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
            {data.map((d) => (
              <li key={d.source} className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full" style={{ background: SOURCE_COLORS[d.source as LeadSource] }} aria-hidden />
                <span className="flex-1 truncate text-muted-foreground">{LEAD_SOURCE_LABELS[d.source as LeadSource] ?? d.source}</span>
                <span className="font-semibold tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
