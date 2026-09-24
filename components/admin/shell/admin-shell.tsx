"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronsRight, LogOut, Menu, Moon, Search, Settings, ShieldCheck, Sun, UserRound } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import type { AdminUser } from "@/lib/admin"
import { ROLE_LABELS } from "@/lib/admin/rbac"
import { initials } from "@/lib/admin/format"
import type { Notification } from "@/lib/db/schema"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Sidebar, type Badges } from "./sidebar"
import { NotificationsBell } from "./notifications-bell"
import { CommandPalette } from "./command-palette"
import { AdminThemeProvider, useAdminTheme, type AdminTheme } from "./theme"

type ShellProps = {
  user: AdminUser
  theme: AdminTheme
  collapsedInitial: boolean
  badges: Badges
  notifications: { rows: Notification[]; unread: number; latestId: number }
  soundEnabled: boolean
  children: React.ReactNode
}

export function AdminShell(props: ShellProps) {
  return (
    <AdminThemeProvider initial={props.theme}>
      <ShellInner {...props} />
    </AdminThemeProvider>
  )
}

function ShellInner({ user, collapsedInitial, badges: initialBadges, notifications, soundEnabled, children }: ShellProps) {
  const router = useRouter()
  const { theme, toggle } = useAdminTheme()
  const [collapsed, setCollapsed] = useState(collapsedInitial)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [badges, setBadges] = useState(initialBadges)

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `admin-sidebar=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`
  }

  const onUnreadChange = useCallback((n: { unread: number; leadsDelta: number; messagesDelta: number }) => {
    setBadges((b) => ({
      notifications: n.unread,
      leads: b.leads + n.leadsDelta,
      messages: b.messages + n.messagesDelta,
    }))
  }, [])

  const signOut = async () => {
    await authClient.signOut()
    toast.success("Вы вышли из аккаунта")
    router.push("/admin/sign-in")
    router.refresh()
  }

  return (
    <div data-admin-root className="flex min-h-svh bg-background text-foreground">
      <div
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 transition-[width] duration-300 ease-out-expo lg:block",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <Sidebar permissions={user.permissions} badges={badges} collapsed={collapsed} onToggle={toggleCollapsed} />
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="absolute -right-3 top-[22px] grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:text-foreground"
            aria-label="Развернуть меню"
          >
            <ChevronsRight className="size-3.5" />
          </button>
        )}
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Меню</SheetTitle>
          <Sidebar permissions={user.permissions} badges={badges} collapsed={false} mobile onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Открыть меню"
          >
            <Menu className="size-5" />
          </button>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 flex-1 max-w-md items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 text-sm text-muted-foreground transition hover:bg-muted"
          >
            <Search className="size-4" />
            <span className="flex-1 truncate text-left">Поиск и быстрые действия</span>
            <kbd className="hidden rounded-md border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                onClick={toggle}
                className="grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
              >
                {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </TooltipTrigger>
              <TooltipContent>{theme === "dark" ? "Светлая тема" : "Тёмная тема"}</TooltipContent>
            </Tooltip>

            <NotificationsBell
              initial={notifications.rows}
              initialUnread={notifications.unread}
              latestId={notifications.latestId}
              sound={soundEnabled}
              onUnreadChange={onUnreadChange}
            />

            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-muted">
                <Avatar className="size-8">
                  {user.image && <AvatarImage src={user.image} alt="" />}
                  <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-left md:block">
                  <span className="block max-w-[140px] truncate text-sm font-medium leading-tight">{user.name}</span>
                  <span className="block text-[11px] leading-tight text-muted-foreground">{ROLE_LABELS[user.role]}</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/admin/security" />}>
                  <ShieldCheck /> Безопасность и 2FA
                </DropdownMenuItem>
                {user.permissions.includes("settings.read") && (
                  <DropdownMenuItem render={<Link href="/admin/settings" />}>
                    <Settings /> Настройки
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem render={<Link href="/admin/users" />}>
                  <UserRound /> Пользователи
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={signOut}>
                  <LogOut /> Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} permissions={user.permissions} onSignOut={signOut} />
    </div>
  )
}
