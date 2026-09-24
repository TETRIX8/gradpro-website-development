"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, FileText, Inbox, Plus, Settings, Users, Activity, type LucideIcon } from "lucide-react"
import type { AuditLog } from "@/lib/db/schema"
import { LEAD_STATUS_META, LEAD_SOURCE_LABELS, type LeadStatus, type LeadSource } from "@/lib/admin/constants"
import { fmtMoney, initials, relativeTime } from "@/lib/admin/format"
import type { Permission } from "@/lib/admin/rbac"
import { Chip, EASE, EmptyState } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

type RecentLead = { id: number; name: string; service: string | null; status: string; source: string; createdAt: Date; value: number }

export function RecentLeads({ rows }: { rows: RecentLead[] }) {
  return (
    <div className="admin-card flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <h2 className="font-display text-base font-semibold">Последние заявки</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Свежие обращения с сайта</p>
        </div>
        <Link href="/admin/leads" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Все заявки <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Inbox />} title="Заявок пока нет" description="Новые обращения с формы на сайте появятся здесь автоматически." className="py-10" />
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((l, i) => {
            const meta = LEAD_STATUS_META[l.status as LeadStatus] ?? LEAD_STATUS_META.new
            return (
              <motion.li
                key={l.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: EASE as unknown as number[] }}
              >
                <Link href={`/admin/leads?open=${l.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/60">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-xs font-bold text-muted-foreground">{initials(l.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{l.name}</span>
                      <span className="hidden text-[11px] text-muted-foreground sm:inline">#{l.id}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {l.service ?? "Без услуги"} · {LEAD_SOURCE_LABELS[l.source as LeadSource] ?? l.source}
                    </span>
                  </span>
                  <span className="hidden text-right md:block">
                    {l.value > 0 && <span className="block text-sm font-semibold tabular-nums">{fmtMoney(l.value)}</span>}
                    <span className="block text-[11px] text-muted-foreground">{relativeTime(l.createdAt)}</span>
                  </span>
                  <Chip className={meta.badge} dot={meta.dot}>
                    {meta.label}
                  </Chip>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const ENTITY_ICON: Record<string, LucideIcon> = {
  lead: Inbox,
  user: Users,
  content: FileText,
  settings: Settings,
}

export function ActivityFeed({ rows }: { rows: AuditLog[] }) {
  return (
    <div className="admin-card flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <h2 className="font-display text-base font-semibold">Лента активности</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Действия команды в панели</p>
        </div>
        <Link href="/admin/audit" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Журнал <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Activity />} title="Пока пусто" description="Здесь появятся действия администраторов и менеджеров." className="py-10" />
      ) : (
        <ol className="relative mt-4 flex flex-col px-5 pb-5">
          <span className="absolute left-[2.15rem] top-6 bottom-8 w-px bg-border" aria-hidden />
          {rows.map((a, i) => {
            const Icon = ENTITY_ICON[a.entity] ?? Activity
            return (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: EASE as unknown as number[] }}
                className="relative flex gap-3 py-2.5"
              >
                <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-card ring-1 ring-border">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug text-pretty">{a.description}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{relativeTime(a.createdAt)}</span>
                </span>
              </motion.li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export function QuickActions({ permissions }: { permissions: Permission[] }) {
  const items: { href: string; label: string; hint: string; icon: LucideIcon; permission: Permission; tone: string }[] = [
    { href: "/admin/leads?new=1", label: "Новая заявка", hint: "Добавить вручную", icon: Plus, permission: "leads.write", tone: "bg-primary/15 text-primary" },
    { href: "/admin/users?new=1", label: "Пользователь", hint: "Пригласить сотрудника", icon: Users, permission: "users.write", tone: "bg-accent/15 text-accent" },
    { href: "/admin/content", label: "Контент", hint: "Редактировать сайт", icon: FileText, permission: "content.write", tone: "bg-electric/15 text-electric" },
    { href: "/admin/settings", label: "Настройки", hint: "Сайт и интеграции", icon: Settings, permission: "settings.read", tone: "bg-emerald-500/15 text-emerald-500" },
  ]
  const visible = items.filter((i) => permissions.includes(i.permission))
  if (!visible.length) return null
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {visible.map((a, i) => (
        <motion.div key={a.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}>
          <Link href={a.href} className="admin-card group flex items-center gap-3 p-4 transition hover:border-primary/40">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl transition group-hover:scale-105", a.tone)}>
              <a.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{a.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{a.hint}</span>
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

export function StatusBreakdown({ data }: { data: { status: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="admin-card p-5">
      <h2 className="font-display text-base font-semibold">Воронка заявок</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Распределение по статусам</p>
      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {data.map((d) =>
          d.value ? (
            <motion.span
              key={d.status}
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / total) * 100}%` }}
              transition={{ duration: 0.9, ease: EASE as unknown as number[] }}
              style={{ background: LEAD_STATUS_META[d.status as LeadStatus]?.chart }}
              className="h-full"
            />
          ) : null,
        )}
      </div>
      <ul className="mt-4 flex flex-col gap-2.5">
        {data.map((d) => {
          const meta = LEAD_STATUS_META[d.status as LeadStatus]
          return (
            <li key={d.status} className="flex items-center gap-2 text-sm">
              <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
              <span className="flex-1 text-muted-foreground">{meta.label}</span>
              <span className="font-semibold tabular-nums">{d.value}</span>
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
