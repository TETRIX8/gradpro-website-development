"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"
import { audit, fail, requireAdmin, type ActionResult } from "@/lib/admin"
import { ALL_PERMISSIONS } from "@/lib/admin/rbac"

const SETTINGS_KEYS = ["general", "seo", "notifications", "integrations", "roles"] as const
export type SettingsKey = (typeof SETTINGS_KEYS)[number]

const KEY_LABELS: Record<SettingsKey, string> = {
  general: "Общие настройки",
  seo: "SEO",
  notifications: "Уведомления",
  integrations: "Интеграции",
  roles: "Роли и права",
}

const url = z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), "Некорректный адрес")

const schemas: Record<SettingsKey, z.ZodTypeAny> = {
  general: z.object({
    siteName: z.string().trim().min(1).max(80),
    logoUrl: url,
    faviconUrl: url,
    email: z.string().trim().email().max(200).or(z.literal("")),
    phone: z.string().trim().max(40),
    address: z.string().trim().max(300),
    socials: z.object({
      telegram: z.string().trim().max(200),
      vk: z.string().trim().max(200),
      whatsapp: z.string().trim().max(200),
      instagram: z.string().trim().max(200),
    }),
  }),
  seo: z.object({
    title: z.string().trim().max(120),
    description: z.string().trim().max(320),
    gaId: z.string().trim().max(40),
    ymId: z.string().trim().max(40),
  }),
  notifications: z.object({
    emailOnNewLead: z.boolean(),
    soundOnNewLead: z.boolean(),
    digest: z.enum(["off", "daily", "weekly"]),
  }),
  integrations: z.object({
    telegramBotToken: z.string().trim().max(200),
    telegramChatId: z.string().trim().max(100),
    webhookUrl: url,
  }),
  roles: z.object({
    manager: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])),
    editor: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])),
  }),
}

export async function getAllSettings() {
  await requireAdmin("settings.read")
  const rows = await db.select().from(siteSettings)
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<SettingsKey, Record<string, unknown>>
}

export async function saveSettings(key: SettingsKey, value: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin(key === "roles" ? "security.write" : "settings.write")
    if (!SETTINGS_KEYS.includes(key)) return { ok: false, error: "Неизвестный раздел настроек" }
    if (key === "roles" && admin.role !== "admin") return { ok: false, error: "Только администратор может менять права" }
    const clean = schemas[key].parse(value) as Record<string, unknown>
    await db
      .insert(siteSettings)
      .values({ key, value: clean, updatedBy: admin.id, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: clean, updatedBy: admin.id, updatedAt: new Date() } })
    await audit(admin, { action: `settings.${key}`, entity: "settings", entityId: key, description: `${admin.name} обновил раздел «${KEY_LABELS[key]}»` })
    revalidatePath("/admin/settings")
    revalidatePath("/")
    return { ok: true, data: undefined }
  } catch (e) {
    return fail(e, "Не удалось сохранить настройки")
  }
}

export async function getPublicSettings() {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "general"))
  return rows[0]?.value ?? null
}
