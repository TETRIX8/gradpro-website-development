'use server'

import { headers } from 'next/headers'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { leads, type Lead } from '@/lib/db/schema'

export type LeadInput = {
  name: string
  email: string
  company: string
  projectType: string
  budget: string
  message: string
  fileUrl: string | null
}

export type LeadErrors = Partial<Record<keyof LeadInput, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function submitLead(input: LeadInput) {
  const errors: LeadErrors = {}
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const message = input.message.trim()

  if (name.length < 2 || name.length > 80) errors.name = 'Введите имя (2–80 символов)'
  if (!EMAIL_RE.test(email)) errors.email = 'Введите корректный email'
  if (message.length < 10) errors.message = 'Расскажите чуть подробнее (минимум 10 символов)'
  if (message.length > 3000) errors.message = 'Сообщение слишком длинное'
  if (!input.projectType) errors.projectType = 'Выберите тип проекта'
  if (!input.budget) errors.budget = 'Выберите бюджет'
  if (input.fileUrl && !/^https?:\/\//.test(input.fileUrl)) errors.fileUrl = 'Некорректная ссылка на файл'

  if (Object.keys(errors).length) return { ok: false as const, errors }

  await db.insert(leads).values({
    name,
    email,
    company: input.company.trim() || null,
    projectType: input.projectType,
    budget: input.budget,
    message,
    fileUrl: input.fileUrl,
  })

  return { ok: true as const }
}

export async function listLeads(): Promise<Lead[]> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(100)
}
