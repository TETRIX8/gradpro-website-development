"use client"

import { useMemo, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Filter,
  Inbox,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { LeadRow, LeadsQuery } from "@/app/actions/leads"
import { archiveLeads, bulkSetStatus, deleteLeads, exportLeads } from "@/app/actions/leads"
import { LEAD_SOURCE_LABELS, LEAD_STATUSES, LEAD_STATUS_META, normalizeSource, type LeadStatus } from "@/lib/admin/constants"
import { fmtDateTime, fmtMoney, relativeTime } from "@/lib/admin/format"
import {
  Btn,
  Card,
  CheckBox,
  Chip,
  ConfirmDialog,
  EASE,
  EmptyState,
  NativeSelect,
  PageHeader,
  Pagination,
  TextInput,
} from "@/components/admin/ui"
import { LeadDrawer } from "./lead-drawer"
import { CreateLeadModal } from "./create-lead-modal"

type Assignee = { id: string; name: string; role: string }
type Facets = { services: string[]; sources: string[] }
type Data = { rows: LeadRow[]; total: number; page: number; pageSize: number; pages: number }

export function LeadsTable({
  data,
  query,
  facets,
  assignees,
  canWrite,
  canDelete,
}: {
  data: Data
  query: LeadsQuery
  facets: Facets
  assignees: Assignee[]
  canWrite: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, start] = useTransition()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [openId, setOpenId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(Boolean(query.service || query.source || query.assignee || query.from || query.to))
  const [q, setQ] = useState(query.q ?? "")

  const setParams = (patch: Record<string, string | number | undefined | null>, resetPage = true) => {
    const params = new URLSearchParams()
    const merged: Record<string, unknown> = { ...query, ...patch }
    if (resetPage && !("page" in patch)) merged.page = 1
    for (const [k, v] of Object.entries(merged)) {
      if (v === undefined || v === null || v === "" || v === "all" || v === false) continue
      if (k === "pageSize") continue
      if (k === "archived") {
        params.set(k, "1")
        continue
      }
      params.set(k, String(v))
    }
    start(() => router.push(`${pathname}?${params.toString()}`))
  }

  const toggleSort = (col: NonNullable<LeadsQuery["sort"]>) => {
    if (query.sort === col) setParams({ dir: query.dir === "asc" ? "desc" : "asc" }, false)
    else setParams({ sort: col, dir: "desc" }, false)
  }

  const allOnPage = data.rows.length > 0 && data.rows.every((r) => selected.has(r.id))
  const someOnPage = data.rows.some((r) => selected.has(r.id))
  const toggleAll = () => {
    const next = new Set(selected)
    if (allOnPage) data.rows.forEach((r) => next.delete(r.id))
    else data.rows.forEach((r) => next.add(r.id))
    setSelected(next)
  }
  const toggleOne = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const ids = useMemo(() => Array.from(selected), [selected])

  const runBulk = async (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    const res = await fn()
    if (res.ok) {
      toast.success(success)
      setSelected(new Set())
      router.refresh()
    } else toast.error(res.error ?? "Ошибка")
  }

  const doExport = async () => {
    const rows = await exportLeads({ ...query, page: 1, pageSize: 5000 })
    const header = ["ID", "Имя", "Телефон", "Email", "Услуга", "Источник", "Статус", "Сумма", "Ответственный", "Создана", "Сообщение"]
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const csv = [
      header.join(";"),
      ...rows.map((r) =>
        [r.id, r.name, r.phone, r.email, r.service, r.source, LEAD_STATUS_META[r.status as LeadStatus]?.label ?? r.status, r.value, r.assigneeName, fmtDateTime(r.createdAt), r.message].map(esc).join(";"),
      ),
    ].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(`Экспортировано ${rows.length} заявок`)
  }

  const activeFilters = [query.service, query.source, query.assignee, query.from, query.to].filter(Boolean).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Заявки"
        description="Все обращения с сайта: фильтруйте, назначайте ответственных и ведите по воронке."
        actions={
          <>
            <Btn variant="outline" size="sm" onClick={doExport}>
              <Download /> Экспорт CSV
            </Btn>
            {canWrite && (
              <Btn variant="primary" size="sm" onClick={() => setCreating(true)}>
                <Plus /> Новая заявка
              </Btn>
            )}
          </>
        }
      />

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusTab active={!query.status || query.status === "all"} onClick={() => setParams({ status: "all" })} label="Все" />
        {LEAD_STATUSES.map((s) => (
          <StatusTab key={s} active={query.status === s} onClick={() => setParams({ status: s })} label={LEAD_STATUS_META[s].label} dot={LEAD_STATUS_META[s].dot} />
        ))}
        <button
          type="button"
          onClick={() => setParams({ archived: query.archived ? undefined : "1" })}
          className={cn(
            "ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
            query.archived ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          <Archive className="size-3.5" /> Архив
        </button>
      </div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault()
              setParams({ q })
            }}
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени, телефону, email или сообщению…" className="pl-10 pr-9" />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("")
                  setParams({ q: undefined })
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                aria-label="Очистить поиск"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>
          <Btn variant={filtersOpen || activeFilters ? "secondary" : "outline"} size="md" onClick={() => setFiltersOpen((v) => !v)}>
            <Filter /> Фильтры
            {activeFilters > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{activeFilters}</span>}
          </Btn>
        </div>

        {filtersOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
            <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-5">
              <NativeSelect value={query.service ?? ""} onChange={(e) => setParams({ service: e.target.value || undefined })}>
                <option value="">Все услуги</option>
                {facets.services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect value={query.source ?? ""} onChange={(e) => setParams({ source: e.target.value || undefined })}>
                <option value="">Все источники</option>
                {facets.sources.map((s) => (
                  <option key={s} value={s}>
                    {LEAD_SOURCE_LABELS[normalizeSource(s)] ?? s}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect value={query.assignee ?? ""} onChange={(e) => setParams({ assignee: e.target.value || undefined })}>
                <option value="">Любой ответственный</option>
                <option value="none">Без ответственного</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </NativeSelect>
              <TextInput type="date" value={query.from ?? ""} onChange={(e) => setParams({ from: e.target.value || undefined })} aria-label="С даты" />
              <TextInput type="date" value={query.to ?? ""} onChange={(e) => setParams({ to: e.target.value || undefined })} aria-label="По дату" />
            </div>
            {activeFilters > 0 && (
              <button type="button" onClick={() => setParams({ service: undefined, source: undefined, assignee: undefined, from: undefined, to: undefined })} className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline">
                Сбросить фильтры
              </button>
            )}
          </motion.div>
        )}
      </Card>

      {/* Bulk bar */}
      {ids.length > 0 && canWrite && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">Выбрано: {ids.length}</span>
          <div className="mx-1 h-5 w-px bg-border" />
          <NativeSelect className="h-8 w-auto py-1 text-xs" defaultValue="" onChange={(e) => e.target.value && runBulk(() => bulkSetStatus(ids, e.target.value as LeadStatus), "Статус обновлён")}>
            <option value="">Сменить статус…</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_META[s].label}
              </option>
            ))}
          </NativeSelect>
          <Btn size="sm" variant="outline" onClick={() => runBulk(() => archiveLeads(ids, !query.archived), query.archived ? "Восстановлено" : "В архиве")}>
            {query.archived ? <ArchiveRestore /> : <Archive />} {query.archived ? "Восстановить" : "В архив"}
          </Btn>
          {canDelete && (
            <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Удалить
            </Btn>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
            Снять выделение
          </button>
        </motion.div>
      )}

      {/* Table */}
      <Card className={cn("overflow-hidden", pending && "opacity-60 transition-opacity")}>
        {data.rows.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-6" />}
            title={query.q || activeFilters ? "Ничего не найдено" : query.archived ? "Архив пуст" : "Заявок пока нет"}
            description={query.q || activeFilters ? "Попробуйте изменить запрос или сбросить фильтры." : "Новые обращения с сайта появятся здесь автоматически."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-foreground/[0.02] text-left text-xs text-muted-foreground">
                  {canWrite && (
                    <th className="w-10 px-4 py-3">
                      <CheckBox checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={toggleAll} label="Выбрать все заявки на странице" />
                    </th>
                  )}
                  <SortTh label="Клиент" col="name" query={query} onSort={toggleSort} />
                  <th className="px-4 py-3 font-medium">Услуга</th>
                  <SortTh label="Статус" col="status" query={query} onSort={toggleSort} />
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Источник</th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">Ответственный</th>
                  <SortTh label="Сумма" col="value" query={query} onSort={toggleSort} className="text-right" />
                  <SortTh label="Создана" col="createdAt" query={query} onSort={toggleSort} className="text-right" />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => {
                  const meta = LEAD_STATUS_META[r.status as LeadStatus] ?? LEAD_STATUS_META.new
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.3, ease: EASE }}
                      onClick={() => setOpenId(r.id)}
                      className={cn("cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-foreground/[0.03]", selected.has(r.id) && "bg-primary/[0.04]")}
                    >
                      {canWrite && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <CheckBox checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} label={`Выбрать заявку №${r.id}`} />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-xs font-semibold">
                            {r.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{r.name}</span>
                              {r.status === "new" && <span className="size-1.5 rounded-full bg-primary" aria-label="Новая" />}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{r.phone || r.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-muted-foreground">{r.service || "—"}</td>
                      <td className="px-4 py-3">
                        <Chip className={meta.badge} dot={meta.dot}>
                          {meta.label}
                        </Chip>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{LEAD_SOURCE_LABELS[normalizeSource(r.source)]}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">{r.assigneeName ?? <span className="text-muted-foreground/50">не назначен</span>}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.value ? fmtMoney(r.value) : <span className="text-muted-foreground/50">—</span>}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground" title={fmtDateTime(r.createdAt)}>
                        {relativeTime(r.createdAt)}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {data.rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={(p) => setParams({ page: p }, false)} />
          </div>
        )}
      </Card>

      <LeadDrawer id={openId} onClose={() => setOpenId(null)} assignees={assignees} canWrite={canWrite} canDelete={canDelete} onChanged={() => router.refresh()} />
      {canWrite && <CreateLeadModal open={creating} onClose={() => setCreating(false)} services={facets.services} onCreated={() => router.refresh()} />}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Удалить ${ids.length} заявок?`}
        description="Заявки и вся история по ним будут удалены без возможности восстановления."
        onConfirm={async () => {
          await runBulk(() => deleteLeads(ids), "Удалено")
          setConfirmDelete(false)
        }}
      />
    </div>
  )
}

function StatusTab({ active, onClick, label, dot }: { active: boolean; onClick: () => void; label: string; dot?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
      {label}
    </button>
  )
}

function SortTh({
  label,
  col,
  query,
  onSort,
  className,
}: {
  label: string
  col: NonNullable<LeadsQuery["sort"]>
  query: LeadsQuery
  onSort: (c: NonNullable<LeadsQuery["sort"]>) => void
  className?: string
}) {
  const active = query.sort === col
  const Icon = active ? (query.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <th className={cn("px-4 py-3 font-medium", className)}>
      <button type="button" onClick={() => onSort(col)} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
        {label} <Icon className="size-3" />
      </button>
    </th>
  )
}
