"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronsLeft, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Permission } from "@/lib/admin/rbac"
import { NAV_GROUP_LABELS, NAV_ITEMS, type NavItem } from "./nav"

export type Badges = { leads: number; messages: number; notifications: number }

export function Sidebar({
  permissions,
  badges,
  collapsed,
  onToggle,
  onNavigate,
  mobile,
}: {
  permissions: Permission[]
  badges: Badges
  collapsed: boolean
  onToggle?: () => void
  onNavigate?: () => void
  mobile?: boolean
}) {
  const pathname = usePathname()
  const visible = NAV_ITEMS.filter((i) => permissions.includes(i.permission))
  const groups = (["main", "site", "system"] as const).map((g) => ({ g, items: visible.filter((i) => i.group === g) }))

  const isActive = (item: NavItem) => (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        mobile ? "w-full" : "border-r border-sidebar-border",
      )}
      aria-label="Основная навигация"
    >
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && !mobile ? "justify-center" : "justify-between")}>
        <Link href="/admin" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="grid size-8 place-items-center rounded-xl bg-primary font-display text-xs font-bold text-primary-foreground">
            G
          </span>
          {(!collapsed || mobile) && (
            <span className="font-display text-sm font-bold tracking-[0.18em]">
              GRAD<span className="text-primary">PRO</span>
            </span>
          )}
        </Link>
        {!mobile && !collapsed && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Свернуть меню"
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}
      </div>

      <nav className="admin-scroll flex-1 overflow-y-auto px-3 py-4">
        {groups.map(({ g, items }) =>
          items.length ? (
            <div key={g} className="mb-5">
              {(!collapsed || mobile) && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {NAV_GROUP_LABELS[g]}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = isActive(item)
                  const count = item.badge ? badges[item.badge] : 0
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={collapsed && !mobile ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          collapsed && !mobile && "justify-center px-0",
                          active ? "text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId={mobile ? "nav-active-mobile" : "nav-active"}
                            className="absolute inset-0 rounded-xl bg-sidebar-accent"
                            transition={{ type: "spring", stiffness: 400, damping: 34 }}
                          />
                        )}
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" aria-hidden />
                        )}
                        <item.icon className={cn("relative size-[18px] shrink-0", active && "text-primary")} />
                        {(!collapsed || mobile) && <span className="relative flex-1 truncate">{item.label}</span>}
                        {count > 0 && (
                          <span
                            className={cn(
                              "relative grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold tabular-nums text-primary-foreground",
                              collapsed && !mobile && "absolute right-1.5 top-1.5 min-w-4 h-4 px-1",
                            )}
                          >
                            {count > 99 ? "99+" : count}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null,
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          target="_blank"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
            collapsed && !mobile && "justify-center px-0",
          )}
          title="Открыть сайт"
        >
          <ExternalLink className="size-[18px]" />
          {(!collapsed || mobile) && <span>Открыть сайт</span>}
        </Link>
      </div>
    </aside>
  )
}
