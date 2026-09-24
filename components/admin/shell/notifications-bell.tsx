"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Inbox, MessageSquare, UserPlus, CircleCheck } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/db/schema"
import { markAllNotificationsRead, markNotificationRead, pollNotifications } from "@/app/actions/notifications"
import { relativeTime } from "@/lib/admin/format"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const ICONS: Record<string, typeof Bell> = {
  lead: Inbox,
  lead_done: CircleCheck,
  message: MessageSquare,
  user: UserPlus,
}

function playChime() {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = "sine"
    o.frequency.setValueAtTime(880, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.4)
  } catch {
    // Audio is optional.
  }
}

export function NotificationsBell({
  initial,
  initialUnread,
  latestId,
  sound,
  onUnreadChange,
}: {
  initial: Notification[]
  initialUnread: number
  latestId: number
  sound: boolean
  onUnreadChange?: (n: { unread: number; leadsDelta: number; messagesDelta: number }) => void
}) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [unread, setUnread] = useState(initialUnread)
  const [open, setOpen] = useState(false)
  const lastId = useRef(latestId)

  useEffect(() => {
    let active = true
    const tick = async () => {
      try {
        const r = await pollNotifications(lastId.current)
        if (!active) return
        if (r.fresh.length) {
          lastId.current = r.latestId
          setItems((prev) => [...r.fresh, ...prev].slice(0, 50))
          const leadsDelta = r.fresh.filter((n) => n.type === "lead").length
          const messagesDelta = r.fresh.filter((n) => n.type === "message").length
          onUnreadChange?.({ unread: r.unread, leadsDelta, messagesDelta })
          for (const n of r.fresh.slice(0, 3)) {
            toast(n.title, {
              description: n.body ?? undefined,
              action: n.href ? { label: "Открыть", onClick: () => router.push(n.href!) } : undefined,
            })
          }
          if (sound) playChime()
          router.refresh()
        }
        setUnread(r.unread)
      } catch {
        // Ignore transient polling errors.
      }
    }
    const id = setInterval(tick, 15_000)
    const onVisible = () => document.visibilityState === "visible" && tick()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      active = false
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [router, sound, onUnreadChange])

  const readOne = async (n: Notification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnread((u) => Math.max(0, u - 1))
      await markNotificationRead(n.id)
    }
    setOpen(false)
  }

  const readAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
    setUnread(0)
    await markAllNotificationsRead()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label={unread ? `Уведомления, ${unread} непрочитанных` : "Уведомления"}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-2.5">
            <span className="absolute inline-flex size-full rounded-full bg-primary animate-admin-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Уведомления</p>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button variant="ghost" size="xs" onClick={readAll}>
                <CheckCheck data-icon="inline-start" /> Прочитать все
              </Button>
            )}
          </div>
        </div>
        <ul className="admin-scroll max-h-[380px] overflow-y-auto py-1">
          {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Пока тихо</li>}
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell
            const inner = (
              <>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", n.read ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn("truncate text-sm", !n.read && "font-semibold")}>{n.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
                  </span>
                  {n.body && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.body}</span>}
                </span>
                {!n.read && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />}
              </>
            )
            const cls = "flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-muted"
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} className={cls} onClick={() => readOne(n)}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" className={cls} onClick={() => readOne(n)}>
                    {inner}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <div className="border-t border-border p-2">
          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Все уведомления
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
