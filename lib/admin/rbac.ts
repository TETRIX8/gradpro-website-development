export const ROLES = ["admin", "manager", "editor", "user"] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  editor: "Редактор",
  user: "Пользователь",
}

export type Permission =
  | "dashboard.read"
  | "leads.read"
  | "leads.write"
  | "leads.delete"
  | "users.read"
  | "users.write"
  | "content.read"
  | "content.write"
  | "content.publish"
  | "services.read"
  | "services.write"
  | "analytics.read"
  | "messages.read"
  | "messages.write"
  | "notifications.read"
  | "settings.read"
  | "settings.write"
  | "security.read"
  | "security.write"
  | "audit.read"

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard.read",
  "leads.read",
  "leads.write",
  "leads.delete",
  "users.read",
  "users.write",
  "content.read",
  "content.write",
  "content.publish",
  "services.read",
  "services.write",
  "analytics.read",
  "messages.read",
  "messages.write",
  "notifications.read",
  "settings.read",
  "settings.write",
  "security.read",
  "security.write",
  "audit.read",
]

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.read": "Просмотр дашборда",
  "leads.read": "Просмотр заявок",
  "leads.write": "Обработка заявок",
  "leads.delete": "Удаление заявок",
  "users.read": "Просмотр пользователей",
  "users.write": "Управление пользователями",
  "content.read": "Просмотр контента",
  "content.write": "Редактирование контента",
  "content.publish": "Публикация контента",
  "services.read": "Просмотр услуг",
  "services.write": "Управление услугами",
  "analytics.read": "Аналитика",
  "messages.read": "Просмотр сообщений",
  "messages.write": "Ответы на сообщения",
  "notifications.read": "Уведомления",
  "settings.read": "Просмотр настроек",
  "settings.write": "Изменение настроек",
  "security.read": "Просмотр безопасности",
  "security.write": "Управление безопасностью",
  "audit.read": "Журнал действий",
}

export const DEFAULT_ROLE_PERMISSIONS: Record<Exclude<Role, "admin" | "user">, Permission[]> = {
  manager: [
    "dashboard.read",
    "leads.read",
    "leads.write",
    "messages.read",
    "messages.write",
    "notifications.read",
    "analytics.read",
    "services.read",
  ],
  editor: [
    "dashboard.read",
    "content.read",
    "content.write",
    "content.publish",
    "services.read",
    "services.write",
    "notifications.read",
  ],
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value)
}

export function isStaffRole(role: string) {
  return role === "admin" || role === "manager" || role === "editor"
}

export function permissionsForRole(
  role: string,
  overrides?: Partial<Record<string, string[]>> | null,
): Permission[] {
  if (role === "admin") return ALL_PERMISSIONS
  if (role === "user") return []
  const custom = overrides?.[role]
  if (Array.isArray(custom)) {
    return custom.filter((p): p is Permission => (ALL_PERMISSIONS as string[]).includes(p))
  }
  return DEFAULT_ROLE_PERMISSIONS[role as "manager" | "editor"] ?? []
}
