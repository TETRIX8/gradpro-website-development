"use client"

import { motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedNumber, EASE } from "@/components/admin/ui"
import { pctChange } from "@/lib/admin/format"

export function KpiCard({
  label,
  value,
  previous,
  format,
  icon: Icon,
  tone = "primary",
  index = 0,
  spark,
  invert,
}: {
  label: string
  value: number
  previous: number
  format?: (n: number) => string
  icon: LucideIcon
  tone?: "primary" | "accent" | "electric" | "emerald"
  index?: number
  spark?: number[]
  invert?: boolean
}) {
  const change = pctChange(value, previous)
  const good = invert ? change <= 0 : change >= 0
  const tones = {
    primary: "bg-primary/15 text-primary",
    accent: "bg-accent/15 text-accent",
    electric: "bg-electric/15 text-electric",
    emerald: "bg-emerald-500/15 text-emerald-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: EASE }}
      className="admin-card relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">
            <AnimatedNumber value={value} format={format} />
          </p>
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            change === 0
              ? "bg-muted text-muted-foreground"
              : good
                ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/12 text-rose-600 dark:text-rose-400",
          )}
        >
          {change === 0 ? <Minus className="size-3" /> : change > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-[11px] text-muted-foreground">к прошлому периоду</span>
      </div>
      {spark && spark.length > 1 && <Sparkline data={spark} className="absolute inset-x-0 bottom-0 h-10 opacity-60" tone={tone} />}
    </motion.div>
  )
}

function Sparkline({ data, className, tone }: { data: number[]; className?: string; tone: string }) {
  const max = Math.max(...data, 1)
  const w = 100
  const h = 30
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - (v / max) * (h - 4) - 2] as const)
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ")
  const area = `${path} L${w},${h} L0,${h} Z`
  const color = tone === "accent" ? "var(--accent)" : tone === "electric" ? "var(--electric)" : tone === "emerald" ? "#10b981" : "var(--primary)"
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sg-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${tone})`} />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  )
}
