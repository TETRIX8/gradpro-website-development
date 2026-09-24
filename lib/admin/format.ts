const ruDateTime = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})
const ruDate = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
const ruLongDate = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})
const ruNumber = new Intl.NumberFormat("ru-RU")
const ruMoney = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
})

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—"
  return ruDateTime.format(new Date(d))
}
export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—"
  return ruDate.format(new Date(d))
}
export function fmtLongDate(d: Date = new Date()) {
  const s = ruLongDate.format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export function fmtNumber(n: number) {
  return ruNumber.format(n)
}
export function fmtMoney(n: number) {
  return ruMoney.format(n)
}
export function fmtPercent(n: number, digits = 1) {
  return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`
}
export function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m} мин ${s} с` : `${s} с`
}

export function relativeTime(d: Date | string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000
  if (diff < 60) return "только что"
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  if (diff < 86400 * 2) return "вчера"
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн назад`
  return fmtDate(d)
}

export function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}
