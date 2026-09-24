"use client"

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion"
import { ChevronDown, Loader2, X } from "lucide-react"
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/* ---------------------------------- Buttons --------------------------------- */

type BtnVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "accent"
type BtnSize = "sm" | "md" | "lg" | "icon"

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-105 shadow-[0_8px_24px_-12px_var(--primary)]",
  accent: "bg-accent text-accent-foreground hover:brightness-110",
  secondary: "bg-secondary text-secondary-foreground hover:bg-foreground/10",
  outline: "border border-border bg-transparent text-foreground hover:bg-foreground/5",
  ghost: "bg-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
  danger: "bg-destructive/10 text-destructive hover:bg-destructive/20",
}
const btnSizes: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  icon: "size-9 rounded-xl",
}

export function Btn({
  variant = "secondary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; loading?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0",
        btnVariants[variant],
        btnSizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" /> : children}
    </button>
  )
}

/* ---------------------------------- Inputs ---------------------------------- */

export const fieldClass =
  "w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      {children}
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted-foreground/70">{hint}</span>
      ) : null}
    </label>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-24 resize-y", className)} {...props} />
}

export function NativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cn(fieldClass, "appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </span>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-primary" : "bg-foreground/15",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className={cn(
          "absolute size-5 rounded-full bg-white shadow",
          checked ? "left-[calc(100%-1.375rem)]" : "left-0.5",
        )}
      />
    </button>
  )
}

export function CheckBox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className="size-4 shrink-0 cursor-pointer appearance-none rounded-[5px] border border-border bg-input transition-colors checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&:checked]:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path fill=%22none%22 stroke=%22%230b0c05%22 stroke-width=%222.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M3.5 8.5l3 3 6-7%22/></svg>')] [&:checked]:bg-center [&:checked]:bg-no-repeat"
    />
  )
}

/* ------------------------------- Badges/Chips ------------------------------- */

export function Chip({
  children,
  className,
  dot,
}: {
  children: ReactNode
  className?: string
  dot?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />}
      {children}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-foreground/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

/* -------------------------------- Containers -------------------------------- */

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div className={cn("admin-card", className)} {...rest}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      {icon && (
        <div className="relative mb-5 grid size-16 place-items-center rounded-2xl bg-foreground/[0.04] text-muted-foreground ring-1 ring-border [&_svg]:size-7">
          <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]" aria-hidden />
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("admin-skeleton rounded-xl", className)} aria-hidden />
}

/* --------------------------------- Counter ---------------------------------- */

export function AnimatedNumber({
  value,
  format,
  duration = 1.1,
  className,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
}) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(format ? format(0) : "0")
  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: EASE as unknown as [number, number, number, number],
      onUpdate: (v) => setDisplay(format ? format(v) : Math.round(v).toLocaleString("ru-RU")),
    })
    return controls.stop
  }, [value, duration, format, mv])
  return (
    <span className={cn("tabular-nums", className)} aria-live="polite">
      {display}
    </span>
  )
}

export function useSpringNumber(value: number) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 80, damping: 20 })
  useEffect(() => mv.set(value), [value, mv])
  return useTransform(spring, (v) => Math.round(v))
}

/* ------------------------------- Modal / Drawer ------------------------------ */

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open, onClose])
}

function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const root = document.querySelector("[data-admin-root]") ?? document.body
  return createPortal(children, root)
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}) {
  useLockBody(open)
  useEscape(open, onClose)
  const id = useId()
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              aria-label="Закрыть"
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.28, ease: EASE }}
              className={cn(
                "relative z-10 flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-[1.5rem] border border-border bg-popover text-popover-foreground shadow-2xl sm:rounded-[1.5rem]",
                widths[size],
              )}
            >
              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div className="min-w-0">
                  <h2 id={`${id}-title`} className="font-display text-lg font-semibold">
                    {title}
                  </h2>
                  {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="admin-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>
              {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = "max-w-xl",
  header,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  width?: string
  header?: ReactNode
}) {
  useLockBody(open)
  useEscape(open, onClose)
  const id = useId()
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <button type="button" aria-label="Закрыть" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.36, ease: EASE }}
              className={cn(
                "absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-popover text-popover-foreground shadow-2xl sm:inset-y-3 sm:right-3 sm:rounded-[1.5rem] sm:border",
                width,
              )}
            >
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                <div className="min-w-0 flex-1">
                  <h2 id={`${id}-title`} className="font-display text-lg font-semibold">
                    {title}
                  </h2>
                  {header}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="admin-scroll flex-1 overflow-y-auto">{children}</div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Удалить",
  danger = true,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Отмена
          </Btn>
          <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Btn>
        </>
      }
    />
  )
}

/* ----------------------------------- Tabs ----------------------------------- */

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  size = "sm",
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  size?: "sm" | "md"
  className?: string
}) {
  const id = useId()
  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-0.5 rounded-xl bg-foreground/[0.05] p-1 ring-1 ring-border", className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-lg font-medium transition-colors",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------- Pagination -------------------------------- */

export function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number
  pages: number
  total: number
  onChange: (p: number) => void
}) {
  if (pages <= 1) {
    return <p className="text-xs text-muted-foreground">Всего: {total.toLocaleString("ru-RU")}</p>
  }
  const items: (number | "…")[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i)
    else if (items[items.length - 1] !== "…") items.push("…")
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Страница {page} из {pages} · Всего {total.toLocaleString("ru-RU")}
      </p>
      <div className="flex items-center gap-1">
        <Btn size="sm" variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Назад
        </Btn>
        {items.map((it, i) =>
          it === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={it}
              type="button"
              onClick={() => onChange(it)}
              aria-current={it === page ? "page" : undefined}
              className={cn(
                "grid size-8 place-items-center rounded-lg text-xs font-medium transition-colors",
                it === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              {it}
            </button>
          ),
        )}
        <Btn size="sm" variant="ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Вперёд
        </Btn>
      </div>
    </div>
  )
}

/* --------------------------------- Dropdown ---------------------------------- */

export function Menu({
  trigger,
  children,
  align = "end",
}: {
  trigger: ReactNode
  children: (close: () => void) => ReactNode
  align?: "start" | "end"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open])
  useEscape(open, () => setOpen(false))
  return (
    <div ref={ref} className="relative inline-block">
      <div
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-50 mt-1.5 min-w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl",
              align === "end" ? "right-0" : "left-0",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  danger,
  icon,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-foreground/5 [&_svg]:size-4 [&_svg]:text-muted-foreground",
        danger && "text-destructive hover:bg-destructive/10 [&_svg]:text-destructive",
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />
}
