'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT } from '@/components/motion/reveal'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Подтвердить',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/70 p-6 backdrop-blur-md"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md rounded-3xl p-8"
          >
            <h2 id="confirm-title" className="font-display text-2xl font-bold">
              {title}
            </h2>
            <p id="confirm-desc" className="mt-3 text-muted-foreground">
              {description}
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={onConfirm}
                autoFocus
                className="rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-foreground transition-shadow hover:shadow-[0_0_30px_rgba(255,93,108,0.4)]"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
