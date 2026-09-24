"use client"

import { useEffect, useState } from "react"
import { Archive, Clock, Mail, MessageSquare, Pencil, Phone, Save, Trash2, UserCheck, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { LeadRow } from "@/app/actions/leads"
import { addLeadComment, archiveLeads, assignLead, deleteLeads, getLeadDetail, setLeadStatus, updateLead } from "@/app/actions/leads"
import type { LeadEvent } from "@/lib/db/schema"
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_STATUSES, LEAD_STATUS_META, normalizeSource, type LeadStatus } from "@/lib/admin/constants"
import { fmtDateTime, fmtMoney, relativeTime } from "@/lib/admin/format"
import { Btn, Chip, ConfirmDialog, Drawer, Field, NativeSelect, Skeleton, TextArea, TextInput } from "@/components/admin/ui"

type Detail = LeadRow & { events: LeadEvent[] }
type Assignee = { id: string; name: string; role: string }

const EVENT_LABELS: Record<string, string> = {
  created: "Заявка создана",
  status: "Статус изменён",
  assigned: "Назначен ответственный",
  comment: "Комментарий",
  edited: "Данные изменены",
}

export function LeadDrawer({
  id,
  onClose,
  assignees,
  canWrite,
  canDelete,
  onChanged,
}: {
  id: number | null
  onClose: () => void
  assignees: Assignee[]
  canWrite: boolean
  canDelete: boolean
  onChanged: () => void
}) {
  const [lead, setLead] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const load = async (leadId: number) => {
    setLoading(true)
    const d = await getLeadDetail(leadId)
    setLead(d)
    setLoading(false)
  }

  useEffect(() => {
    if (id == null) {
      setLead(null)
      setEditing(false)
      return
    }
    void load(id)
  }, [id])

  const refresh = async () => {
    if (id != null) await load(id)
    onChanged()
  }

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => {
    setBusy(true)
    const res = await fn()
    setBusy(false)
    if (res.ok) {
      toast.success(msg)
      await refresh()
      return true
    }
    toast.error(res.error ?? "Ошибка")
    return false
  }

  const meta = lead ? LEAD_STATUS_META[lead.status as LeadStatus] ?? LEAD_STATUS_META.new : null

  return (
    <>
      <Drawer
        open={id != null}
        onClose={onClose}
        title={lead ? lead.name : "Заявка"}
        width="max-w-2xl"
        header={
          lead && meta ? (
            <div className="flex flex-wrap items-center gap-2">
              <Chip className={meta.badge} dot={meta.dot}>
                {meta.label}
              </Chip>
              <span className="text-xs text-muted-foreground">#{lead.id} · {fmtDateTime(lead.createdAt)}</span>
              {lead.archived && (
                <Chip className="bg-foreground/10 text-muted-foreground ring-border">
                  <Archive className="size-3" /> В архиве
                </Chip>
              )}
            </div>
          ) : null
        }
      >
        {loading || !lead ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6">
            {/* Quick actions */}
            {canWrite && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Статус">
                  <NativeSelect value={lead.status} disabled={busy} onChange={(e) => run(() => setLeadStatus(lead.id, e.target.value as LeadStatus), "Статус обновлён")}>
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STATUS_META[s].label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Ответственный">
                  <NativeSelect value={lead.assigneeId ?? ""} disabled={busy} onChange={(e) => run(() => assignLead(lead.id, e.target.value || null), "Ответственный обновлён")}>
                    <option value="">Не назначен</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
            )}

            {/* Details */}
            <section className="rounded-2xl border border-border bg-foreground/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Контакт и запрос</h3>
                {canWrite && !editing && (
                  <Btn size="sm" variant="ghost" onClick={() => setEditing(true)}>
                    <Pencil /> Редактировать
                  </Btn>
                )}
              </div>
              {editing ? (
                <EditForm
                  lead={lead}
                  busy={busy}
                  onCancel={() => setEditing(false)}
                  onSave={async (data) => {
                    const ok = await run(() => updateLead(lead.id, data), "Сохранено")
                    if (ok) setEditing(false)
                  }}
                />
              ) : (
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <Row icon={<Phone className="size-3.5" />} label="Телефон">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="hover:underline">
                        {lead.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Row>
                  <Row icon={<Mail className="size-3.5" />} label="Email">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="truncate hover:underline">
                        {lead.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Row>
                  <Row label="Услуга">{lead.service || "—"}</Row>
                  <Row label="Источник">{LEAD_SOURCE_LABELS[normalizeSource(lead.source)]}</Row>
                  <Row label="Сумма сделки">{lead.value ? fmtMoney(lead.value) : "—"}</Row>
                  <Row label="Обновлена">{relativeTime(lead.updatedAt)}</Row>
                  <div className="sm:col-span-2">
                    <dt className="mb-1 text-xs text-muted-foreground">Сообщение</dt>
                    <dd className="whitespace-pre-wrap rounded-xl bg-background/60 p-3 text-sm leading-relaxed">{lead.message || <span className="text-muted-foreground">Без сообщения</span>}</dd>
                  </div>
                </dl>
              )}
            </section>

            {/* Timeline */}
            <section>
              <h3 className="mb-3 text-sm font-semibold">История</h3>
              {canWrite && (
                <form
                  className="mb-4 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!comment.trim()) return
                    const ok = await run(() => addLeadComment(lead.id, comment.trim()), "Комментарий добавлен")
                    if (ok) setComment("")
                  }}
                >
                  <TextInput value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Добавить комментарий…" />
                  <Btn type="submit" variant="primary" loading={busy} disabled={!comment.trim()}>
                    <MessageSquare />
                  </Btn>
                </form>
              )}
              <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
                {lead.events.length === 0 && <li className="text-sm text-muted-foreground">Событий пока нет</li>}
                {lead.events.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className={cn("absolute -left-[26px] top-1 size-3 rounded-full ring-4 ring-background", ev.type === "comment" ? "bg-accent" : ev.type === "status" ? "bg-primary" : "bg-muted-foreground/50")} />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">{EVENT_LABELS[ev.type] ?? ev.type}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {relativeTime(ev.createdAt)} · {ev.actorName}
                      </span>
                    </div>
                    <EventPayload ev={ev} />
                  </li>
                ))}
              </ol>
            </section>

            {/* Danger zone */}
            {canWrite && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Btn size="sm" variant="outline" onClick={() => run(() => archiveLeads([lead.id], !lead.archived), lead.archived ? "Восстановлено" : "В архиве")}>
                  <Archive /> {lead.archived ? "Восстановить из архива" : "В архив"}
                </Btn>
                {canDelete && (
                  <Btn size="sm" variant="danger" onClick={() => setConfirm(true)}>
                    <Trash2 /> Удалить
                  </Btn>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Удалить заявку?"
        description="Это действие нельзя отменить."
        loading={busy}
        onConfirm={async () => {
          if (!lead) return
          const ok = await run(() => deleteLeads([lead.id]), "Заявка удалена")
          setConfirm(false)
          if (ok) onClose()
        }}
      />
    </>
  )
}

function Row({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="truncate font-medium">{children}</dd>
    </div>
  )
}

function EventPayload({ ev }: { ev: LeadEvent }) {
  const p = (ev.payload ?? {}) as Record<string, unknown>
  if (ev.type === "comment" && typeof p.text === "string") return <p className="mt-1 whitespace-pre-wrap rounded-xl bg-foreground/[0.03] p-2.5 text-sm">{p.text}</p>
  if (ev.type === "status" && typeof p.to === "string") {
    const from = typeof p.from === "string" ? LEAD_STATUS_META[p.from as LeadStatus]?.label : null
    const to = LEAD_STATUS_META[p.to as LeadStatus]?.label ?? p.to
    return (
      <p className="mt-0.5 text-xs text-muted-foreground">
        {from ? `${from} → ` : ""}
        {to}
      </p>
    )
  }
  if (ev.type === "assigned") {
    return (
      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <UserCheck className="size-3" /> {typeof p.assigneeName === "string" ? p.assigneeName : "Снято назначение"}
      </p>
    )
  }
  return null
}

function EditForm({ lead, busy, onCancel, onSave }: { lead: LeadRow; busy: boolean; onCancel: () => void; onSave: (d: Parameters<typeof updateLead>[1]) => void }) {
  const [form, setForm] = useState({
    name: lead.name,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    service: lead.service ?? "",
    source: normalizeSource(lead.source),
    message: lead.message ?? "",
    value: lead.value ?? 0,
  })
  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <Field label="Имя">
        <TextInput required value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Телефон">
        <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field label="Email">
        <TextInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </Field>
      <Field label="Услуга">
        <TextInput value={form.service} onChange={(e) => set("service", e.target.value)} />
      </Field>
      <Field label="Источник">
        <NativeSelect value={form.source} onChange={(e) => set("source", e.target.value)}>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {LEAD_SOURCE_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Сумма сделки, ₽">
        <TextInput type="number" min={0} value={form.value} onChange={(e) => set("value", Number(e.target.value))} />
      </Field>
      <Field label="Сообщение" className="sm:col-span-2">
        <TextArea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Btn variant="ghost" onClick={onCancel} disabled={busy}>
          <X /> Отмена
        </Btn>
        <Btn type="submit" variant="primary" loading={busy}>
          <Save /> Сохранить
        </Btn>
      </div>
    </form>
  )
}
