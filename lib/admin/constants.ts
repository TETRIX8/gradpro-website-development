export const LEAD_STATUSES = ["new", "in_progress", "contacted", "done", "rejected"] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; dot: string; badge: string; chart: string }
> = {
  new: {
    label: "Новая",
    dot: "bg-amber-400",
    badge: "bg-amber-400/12 text-amber-600 dark:text-amber-300 ring-amber-400/30",
    chart: "#f5b83d",
  },
  in_progress: {
    label: "В работе",
    dot: "bg-sky-400",
    badge: "bg-sky-400/12 text-sky-600 dark:text-sky-300 ring-sky-400/30",
    chart: "#38bdf8",
  },
  contacted: {
    label: "Связались",
    dot: "bg-violet-400",
    badge: "bg-violet-400/12 text-violet-600 dark:text-violet-300 ring-violet-400/30",
    chart: "#a78bfa",
  },
  done: {
    label: "Завершена",
    dot: "bg-emerald-400",
    badge: "bg-emerald-400/12 text-emerald-600 dark:text-emerald-300 ring-emerald-400/30",
    chart: "#34d399",
  },
  rejected: {
    label: "Отклонена",
    dot: "bg-rose-400",
    badge: "bg-rose-400/12 text-rose-600 dark:text-rose-300 ring-rose-400/30",
    chart: "#fb7185",
  },
}

export const LEAD_SOURCES = ["google", "yandex", "telegram", "vk", "direct", "other"] as const
export type LeadSource = (typeof LEAD_SOURCES)[number]

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  google: "Google",
  yandex: "Yandex",
  telegram: "Telegram",
  vk: "VK",
  direct: "Direct",
  other: "Другое",
}

export const SOURCE_COLORS: Record<LeadSource, string> = {
  google: "#60a5fa",
  yandex: "#f87171",
  telegram: "#38bdf8",
  vk: "#818cf8",
  direct: "#34d399",
  other: "#a1a1aa",
}

export const SERVICE_OPTIONS = [
  "Дипломная работа",
  "Курсовая работа",
  "Магистерская диссертация",
  "Реферат / эссе",
  "Отчёт по практике",
  "Презентация",
  "Повышение уникальности",
  "Другое",
] as const

export function normalizeSource(raw: string | null | undefined): LeadSource {
  const v = (raw ?? "").toLowerCase()
  if (v.includes("google")) return "google"
  if (v.includes("yandex") || v.includes("ya.ru")) return "yandex"
  if (v.includes("t.me") || v.includes("telegram") || v === "tg") return "telegram"
  if (v.includes("vk.com") || v === "vk") return "vk"
  if (!v || v === "direct") return "direct"
  return "other"
}
