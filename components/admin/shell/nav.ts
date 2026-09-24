import {
  BarChart3,
  Bell,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { Permission } from "@/lib/admin/rbac"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  permission: Permission
  badge?: "leads" | "messages" | "notifications"
  group: "main" | "site" | "system"
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, permission: "dashboard.read", group: "main" },
  { href: "/admin/leads", label: "Заявки", icon: Inbox, permission: "leads.read", badge: "leads", group: "main" },
  { href: "/admin/messages", label: "Сообщения", icon: MessageSquare, permission: "messages.read", badge: "messages", group: "main" },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3, permission: "analytics.read", group: "main" },
  { href: "/admin/users", label: "Пользователи", icon: Users, permission: "users.read", group: "main" },
  { href: "/admin/content", label: "Контент сайта", icon: FileText, permission: "content.read", group: "site" },
  { href: "/admin/projects", label: "Проекты", icon: FolderKanban, permission: "content.read", group: "site" },
  { href: "/admin/services", label: "Услуги", icon: Package, permission: "services.read", group: "site" },
  { href: "/admin/notifications", label: "Уведомления", icon: Bell, permission: "notifications.read", badge: "notifications", group: "system" },
  { href: "/admin/security", label: "Безопасность", icon: ShieldCheck, permission: "security.read", group: "system" },
  { href: "/admin/audit", label: "Журнал действий", icon: ScrollText, permission: "audit.read", group: "system" },
  { href: "/admin/settings", label: "Настройки", icon: Settings, permission: "settings.read", group: "system" },
]

export const NAV_GROUP_LABELS: Record<NavItem["group"], string> = {
  main: "Работа",
  site: "Сайт",
  system: "Система",
}
