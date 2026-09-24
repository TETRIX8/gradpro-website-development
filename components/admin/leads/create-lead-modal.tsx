"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createLead } from "@/app/actions/leads"
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_STATUSES, LEAD_STATUS_META, SERVICE_OPTIONS, type LeadStatus } from "@/lib/admin/constants"
import { Btn, Field, Modal, NativeSelect, TextArea, TextInput } from "@/components/admin/ui"

const empty = { name: "", phone: "", email: "", service: "", source: "direct", message: "", value: 0, status: "new" as LeadStatus }

export function CreateLeadModal({ open, onClose, services, onCreated }: { open: boolean; onClose: () => void; services: string[]; onCreated: () => void }) {
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }))
  const options = Array.from(new Set<string>([...SERVICE_OPTIONS, ...services]))

  const submit = async () => {
    setBusy(true)
    const res = await createLead(form)
    setBusy(false)
    if (res.ok) {
      toast.success("Заявка создана")
      setForm(empty)
      onCreated()
      onClose()
    } else toast.error(res.error ?? "Ошибка")
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новая заявка"
      description="Заведите обращение вручную — например, после звонка."
      size="lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={busy}>
            Отмена
          </Btn>
          <Btn variant="primary" onClick={submit} loading={busy} disabled={form.name.trim().length < 2}>
            Создать
          </Btn>
        </>
      }
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Field label="Имя *">
          <TextInput autoFocus required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Иван Петров" />
        </Field>
        <Field label="Телефон">
          <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+7 900 000-00-00" />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ivan@example.com" />
        </Field>
        <Field label="Услуга">
          <TextInput list="lead-service-options" value={form.service} onChange={(e) => set("service", e.target.value)} placeholder="Выберите или введите" />
          <datalist id="lead-service-options">
            {options.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
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
        <Field label="Статус">
          <NativeSelect value={form.status} onChange={(e) => set("status", e.target.value)}>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_META[s].label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Сумма сделки, ₽">
          <TextInput type="number" min={0} value={form.value} onChange={(e) => set("value", Number(e.target.value))} />
        </Field>
        <Field label="Сообщение" className="sm:col-span-2">
          <TextArea rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Суть запроса клиента" />
        </Field>
      </form>
    </Modal>
  )
}
