import type { LeadRow } from "@/app/actions/leads"
import { LEAD_SOURCE_LABELS, LEAD_STATUS_META, type LeadSource, type LeadStatus } from "@/lib/admin/constants"

const COLUMNS: { key: string; header: string; get: (l: LeadRow) => string | number }[] = [
  { key: "id", header: "ID", get: (l) => l.id },
  { key: "createdAt", header: "Дата", get: (l) => new Date(l.createdAt).toLocaleString("ru-RU") },
  { key: "name", header: "Имя", get: (l) => l.name },
  { key: "phone", header: "Телефон", get: (l) => l.phone ?? "" },
  { key: "email", header: "Email", get: (l) => l.email ?? "" },
  { key: "service", header: "Услуга", get: (l) => l.service ?? "" },
  { key: "status", header: "Статус", get: (l) => LEAD_STATUS_META[l.status as LeadStatus]?.label ?? l.status },
  { key: "source", header: "Источник", get: (l) => LEAD_SOURCE_LABELS[l.source as LeadSource] ?? l.source },
  { key: "assignee", header: "Ответственный", get: (l) => l.assigneeName ?? "" },
  { key: "value", header: "Сумма, ₽", get: (l) => l.value },
  { key: "message", header: "Сообщение", get: (l) => l.message ?? "" },
]

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp() {
  return new Date().toISOString().slice(0, 10)
}

export function exportLeadsCsv(rows: LeadRow[]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "")
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [COLUMNS.map((c) => c.header).join(";"), ...rows.map((r) => COLUMNS.map((c) => esc(c.get(r))).join(";"))]
  download(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), `leads-${stamp()}.csv`)
}

export async function exportLeadsXlsx(rows: LeadRow[]) {
  const ExcelJS = (await import("exceljs")).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Заявки", { views: [{ state: "frozen", ySplit: 1 }] })
  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.key === "message" ? 50 : c.key === "email" ? 28 : 16 }))
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF3E0" } }
  for (const r of rows) ws.addRow(Object.fromEntries(COLUMNS.map((c) => [c.key, c.get(r)])))
  ws.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + COLUMNS.length)}1` }
  const buf = await wb.xlsx.writeBuffer()
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `leads-${stamp()}.xlsx`)
}
