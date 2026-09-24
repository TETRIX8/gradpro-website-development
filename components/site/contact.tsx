'use client'

import { useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { Check, Loader2, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { submitLead, type LeadErrors, type LeadInput } from '@/app/actions/public'
import { Reveal, SplitWords, EASE_OUT } from '@/components/motion/reveal'
import { GlowButton } from '@/components/motion/glow-button'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

const TYPES = ['Сайт', 'Web-продукт', 'Брендинг', '3D / motion', 'Другое']
const BUDGETS = ['до 1 млн ₽', '1–3 млн ₽', '3–7 млн ₽', '7+ млн ₽']

const inputBase =
  'w-full rounded-2xl border bg-input px-5 py-4 text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/60'

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string
  error?: string
  children: React.ReactNode
  htmlFor: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Contact() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const portalScale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [0.7, 1.05])
  const portalGlow = useTransform(scrollYProgress, [0, 1], [0.2, 1])

  const [values, setValues] = useState<LeadInput>({
    name: '',
    email: '',
    company: '',
    projectType: '',
    budget: '',
    message: '',
    fileUrl: null,
  })
  const [errors, setErrors] = useState<LeadErrors>({})
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [file, setFile] = useState<{ name: string; progress: number; url?: string } | null>(null)

  const set = (k: keyof LeadInput) => (v: string) => {
    setValues((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const uploadFile = (f: File) => {
    if (f.size > 15 * 1024 * 1024) {
      toast.error('Файл больше 15 МБ')
      return
    }
    setFile({ name: f.name, progress: 0 })
    const xhr = new XMLHttpRequest()
    const fd = new FormData()
    fd.append('file', f)
    fd.append('scope', 'brief')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setFile((s) => (s ? { ...s, progress: Math.round((e.loaded / e.total) * 100) } : s))
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && res.url) {
          setFile({ name: f.name, progress: 100, url: res.url })
          setValues((s) => ({ ...s, fileUrl: res.url }))
        } else {
          toast.error(res.error ?? 'Загрузка не удалась')
          setFile(null)
        }
      } catch {
        toast.error('Загрузка не удалась')
        setFile(null)
      }
    }
    xhr.onerror = () => {
      toast.error('Загрузка не удалась')
      setFile(null)
    }
    xhr.open('POST', '/api/upload')
    xhr.send(fd)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    if (file && !file.url) {
      toast.message('Дождитесь окончания загрузки файла')
      return
    }
    setPending(true)
    try {
      const res = await submitLead(values)
      if (!res.ok) {
        setErrors(res.errors)
        toast.error('Проверьте поля формы')
        return
      }
      setDone(true)
      toast.success('Заявка отправлена')
    } catch {
      toast.error('Что-то пошло не так. Попробуйте ещё раз.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section ref={ref} id="contact" className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto grid w-full max-w-7xl gap-16 px-6 md:px-10 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div className="flex flex-col gap-10">
          <Reveal className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-8 bg-primary" />
            Контакты
          </Reveal>
          <h2 className="font-display text-[clamp(2.2rem,5vw,4.4rem)] font-bold leading-[1] tracking-tight text-balance">
            <SplitWords text={'Готовы сделать\nследующий шаг?'} highlight={['следующий', 'шаг?']} />
          </h2>
          <Reveal className="max-w-md text-lg leading-relaxed text-muted-foreground" delay={0.1}>
            Расскажите о задаче — вернёмся с первыми идеями и оценкой в течение 48 часов.
          </Reveal>

          <motion.div
            style={{ scale: portalScale }}
            className="relative mx-auto aspect-[3/4] w-full max-w-xs origin-bottom lg:mx-0 lg:max-w-sm"
            aria-hidden
          >
            <motion.div
              style={{ opacity: portalGlow }}
              className="absolute inset-0 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_60%,rgba(167,139,250,0.55),transparent_70%)] blur-3xl"
            />
            <div className="absolute inset-[6%] rounded-[2.5rem] border border-accent/60 shadow-[0_0_60px_rgba(167,139,250,0.55),inset_0_0_60px_rgba(167,139,250,0.25)]" />
            <div className="absolute inset-[12%] rounded-[2rem] bg-gradient-to-b from-background via-background to-[#14101f]" />
            <div className="absolute inset-x-[30%] bottom-[10%] h-px bg-primary shadow-[0_0_20px_rgba(200,255,31,0.9)]" />
            <div className="absolute inset-[12%] flex items-center justify-center rounded-[2rem]">
              <span className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                enter
              </span>
            </div>
          </motion.div>

          <Reveal className="flex flex-col gap-2 text-sm text-muted-foreground" delay={0.2}>
            <a href="mailto:hello@gradpro.studio" className="w-fit transition-colors hover:text-primary">
              hello@gradpro.studio
            </a>
            <a href="tel:+74950000000" className="w-fit transition-colors hover:text-primary">
              +7 495 000-00-00
            </a>
            <span>Москва · Берлин · Remote</span>
          </Reveal>
        </div>

        <Reveal className="glass relative rounded-[2rem] p-6 md:p-10 lg:self-start" delay={0.1} y={40}>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className="flex min-h-[460px] flex-col items-center justify-center gap-6 text-center"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_60px_rgba(200,255,31,0.5)]"
                >
                  <Check className="h-9 w-9" aria-hidden />
                </motion.span>
                <h3 className="font-display text-3xl font-bold">Заявка отправлена</h3>
                <p className="max-w-sm text-muted-foreground">
                  Спасибо, {values.name.split(' ')[0]}. Мы уже читаем ваше сообщение и вернёмся с ответом в течение 48 часов.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDone(false)
                    setValues({ name: '', email: '', company: '', projectType: '', budget: '', message: '', fileUrl: null })
                    setFile(null)
                  }}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Отправить ещё одну
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={onSubmit}
                noValidate
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Имя" htmlFor="name" error={errors.name}>
                    <input
                      id="name"
                      name="name"
                      autoComplete="name"
                      value={values.name}
                      onChange={(e) => set('name')(e.target.value)}
                      placeholder="Как к вам обращаться"
                      aria-invalid={Boolean(errors.name)}
                      className={cn(inputBase, errors.name ? 'border-destructive/70' : 'border-border')}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email" error={errors.email}>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => set('email')(e.target.value)}
                      placeholder="you@company.com"
                      aria-invalid={Boolean(errors.email)}
                      className={cn(inputBase, errors.email ? 'border-destructive/70' : 'border-border')}
                    />
                  </Field>
                </div>

                <Field label="Компания" htmlFor="company">
                  <input
                    id="company"
                    name="company"
                    autoComplete="organization"
                    value={values.company}
                    onChange={(e) => set('company')(e.target.value)}
                    placeholder="Необязательно"
                    className={cn(inputBase, 'border-border')}
                  />
                </Field>

                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Тип проекта
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <label key={t} className="cursor-pointer">
                        <input
                          type="radio"
                          name="projectType"
                          value={t}
                          checked={values.projectType === t}
                          onChange={() => set('projectType')(t)}
                          className="peer sr-only"
                        />
                        <span className="block rounded-full border border-border px-4 py-2 text-sm transition-all duration-300 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50 hover:border-foreground/40">
                          {t}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.projectType && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.projectType}
                    </p>
                  )}
                </fieldset>

                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Бюджет
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {BUDGETS.map((b) => (
                      <label key={b} className="cursor-pointer">
                        <input
                          type="radio"
                          name="budget"
                          value={b}
                          checked={values.budget === b}
                          onChange={() => set('budget')(b)}
                          className="peer sr-only"
                        />
                        <span className="block rounded-full border border-border px-4 py-2 text-sm transition-all duration-300 peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50 hover:border-foreground/40">
                          {b}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.budget && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.budget}
                    </p>
                  )}
                </fieldset>

                <Field label="О проекте" htmlFor="message" error={errors.message}>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={values.message}
                    onChange={(e) => set('message')(e.target.value)}
                    placeholder="Цели, сроки, референсы — всё, что поможет нам понять задачу"
                    aria-invalid={Boolean(errors.message)}
                    className={cn(inputBase, 'resize-none', errors.message ? 'border-destructive/70' : 'border-border')}
                  />
                </Field>

                <div className="flex flex-col gap-3">
                  <label
                    htmlFor="brief"
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    <Paperclip className="h-4 w-4" aria-hidden />
                    {file ? 'Заменить файл' : 'Прикрепить бриф или ТЗ (PDF, ZIP, изображения — до 15 МБ)'}
                    <input
                      id="brief"
                      type="file"
                      accept=".pdf,.zip,image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadFile(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <AnimatePresence>
                    {file && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm">
                          <span className="min-w-0 flex-1 truncate">{file.name}</span>
                          <span className="w-10 text-right tabular-nums text-muted-foreground">{file.progress}%</span>
                          <button
                            type="button"
                            aria-label="Удалить файл"
                            onClick={() => {
                              setFile(null)
                              setValues((s) => ({ ...s, fileUrl: null }))
                            }}
                            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                          <motion.div
                            className="h-full bg-primary"
                            animate={{ width: `${file.progress}%` }}
                            transition={{ ease: 'easeOut', duration: 0.3 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <GlowButton type="submit" disabled={pending} icon={!pending} className="w-full sm:w-auto">
                    {pending ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Отправляем…
                      </span>
                    ) : (
                      'Отправить заявку'
                    )}
                  </GlowButton>
                  <p className="text-xs text-muted-foreground">
                    Нажимая кнопку, вы соглашаетесь с обработкой данных.
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  )
}
