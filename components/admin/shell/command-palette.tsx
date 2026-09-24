"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Moon, Sun, Search, LogOut, ExternalLink } from "lucide-react"
import type { Permission } from "@/lib/admin/rbac"
import { NAV_ITEMS } from "./nav"
import { useAdminTheme } from "./theme"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette({
  open,
  onOpenChange,
  permissions,
  onSignOut,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  permissions: Permission[]
  onSignOut: () => void
}) {
  const router = useRouter()
  const { theme, toggle } = useAdminTheme()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Быстрые действия" description="Поиск по разделам и командам">
      <CommandInput placeholder="Куда перейти? Введите название раздела…" />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        <CommandGroup heading="Разделы">
          {NAV_ITEMS.filter((i) => permissions.includes(i.permission)).map((i) => (
            <CommandItem key={i.href} value={i.label} onSelect={() => go(i.href)}>
              <i.icon />
              {i.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Действия">
          {permissions.includes("leads.read") && (
            <CommandItem value="Найти заявку" onSelect={() => go("/admin/leads?focus=search")}>
              <Search /> Найти заявку
              <CommandShortcut>/</CommandShortcut>
            </CommandItem>
          )}
          <CommandItem value="Переключить тему" onSelect={() => { toggle(); onOpenChange(false) }}>
            {theme === "dark" ? <Sun /> : <Moon />}
            {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          </CommandItem>
          <CommandItem value="Открыть сайт" onSelect={() => { window.open("/", "_blank"); onOpenChange(false) }}>
            <ExternalLink /> Открыть сайт
          </CommandItem>
          <CommandItem value="Выйти" onSelect={onSignOut}>
            <LogOut /> Выйти из аккаунта
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
