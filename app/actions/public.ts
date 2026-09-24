"use server"

import { z } from "zod"
import { cookies, headers } from "next/headers"
import { db } from "@/lib/db"
import { leadEvents, leads, messages, notifications } from "@/lib/db/schema"
import { normalizeSource } from "@/lib/admin/constants"

export type LeadInput = {
  name: string
  email: string
  phone?: string
  company: string
  projectType: string
  budget: string
  message: string
  fileUrl: string | null
}

export type LeadErrors = Partial<Record<keyof LeadInput, string>>

const schema = z.object({
  name: z.string().trim().min(2, "Введите имя").max(120, "Слишком длинное имя"),
  email: z.string().trim().email("Некорректный email").max(200),
  phone: z
    .string()
    .trim()
    .max(40, "Слишком длинный номер")
    .optional()
    .or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  projectType: z.string().trim().min(1, "Выберите тип проекта").max(80),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Расскажите чуть подробнее").max(5000),
  fileUrl: z.string().url().nullable().optional(),
})

const BUDGET_VALUE: Record<string, number> = {
  "до 1 млн ₽": 700_000,
  "1–3 млн ₽": 2_000_000,
  "3–7 млн ₽": 5_000_000,
  "7+ млн ₽": 8_000_000,
}

export async function submitLead(
  input: LeadInput,
): Promise<{ ok: true; id: number } | { ok: false; errors: LeadErrors }> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    const errors: LeadErrors = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof LeadInput
      if (key && !errors[key]) errors[key] = issue.message
    }
    return { ok: false, errors }
  }
  const data = parsed.data
  const [cookieStore, h] = await Promise.all([cookies(), headers()])
  const source = normalizeSource(cookieStore.get("gp_src")?.value ?? h.get("referer"))

  const [row] = await db
    .insert(leads)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      service: data.projectType,
      message: data.message,
      source,
      value: BUDGET_VALUE[data.budget ?? ""] ?? 0,
      metadata: {
        company: data.company || null,
        budget: data.budget || null,
        fileUrl: data.fileUrl ?? null,
        landing: cookieStore.get("gp_landing")?.value ?? null,
      },
    })
    .returning({ id: leads.id })

  await Promise.all([
    db.insert(leadEvents).values({ leadId: row.id, type: "created", actorName: data.name, payload: { source } }),
    db.insert(notifications).values({
      type: "lead",
      title: "Новая заявка",
      body: `${data.name} · ${data.projectType}`,
      href: `/admin/leads?open=${row.id}`,
    }),
    db.insert(messages).values({
      leadId: row.id,
      senderName: data.name,
      senderEmail: data.email,
      subject: `Заявка #${row.id}: ${data.projectType}`,
      body: data.message,
      direction: "in",
    }),
  ])

  return { ok: true, id: row.id }
}
