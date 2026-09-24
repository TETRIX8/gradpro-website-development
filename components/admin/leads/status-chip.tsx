"use client"

import { ChevronDown } from "lucide-react"
import { LEAD_STATUSES, LEAD_STATUS_META, type LeadStatus } from "@/lib/admin/constants"
import { Chip, Menu, MenuItem } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

export function StatusChip({ status, onChange, disabled }: { status: string; onChange?: (s: LeadStatus) => void; disabled?: boolean }) {
  const meta = LEAD_STATUS_META[status as LeadStatus] ?? LEAD_STATUS_META.new
  if (!onChange || disabled) {
    return (
      <Chip className={meta.badge} dot={meta.dot}>
        {meta.label}
      </Chip>
    )
  }
  return (
    <Menu
      align="start"
      trigger={
        <button type="button" className="group inline-flex items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label={`Статус: ${meta.label}. Изменить`}>
          <Chip className={cn(meta.badge, "transition group-hover:brightness-110")} dot={meta.dot}>
            {meta.label}
            <ChevronDown className="size-3 opacity-60" />
          </Chip>
        </button>
      }
    >
      {(close) =>
        LEAD_STATUSES.map((s) => (
          <MenuItem
            key={s}
            onClick={() => {
              close()
              if (s !== status) onChange(s)
            }}
            icon={<span className={cn("size-2 rounded-full", LEAD_STATUS_META[s].dot)} />}
          >
            <span className={cn(s === status && "font-semibold")}>{LEAD_STATUS_META[s].label}</span>
          </MenuItem>
        ))
      }
    </Menu>
  )
}
