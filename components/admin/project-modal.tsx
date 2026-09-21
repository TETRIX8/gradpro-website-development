'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Project } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { createProject, updateProject, type ProjectInput } from '@/app/actions/projects'
import { EASE_OUT } from '@/components/motion/reveal'

type Errors = Partial<Record<keyof ProjectInput, string>>

const input =
  'w-full rounded-xl border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/40'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => {
      const map: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
        к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
        х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
      }
      return map[c] ?? ''
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const empty = (): ProjectInput => ({
  title: '',
  slug: '',
  tagline: '',
  description: '',
  category: '',
  year: new Date().getFullYear(),
  technologies: [],
  coverUrl: '',
  gallery: [],
  videoUrl: null,
  accent: 'lime',
  published: true,
  featured: false,
})

function fromProject(p: Project): ProjectInput {
  return {
    title: p.title,
    slug: p.slug,
    tagline: p.tagline,
    description: p.description,
    category: p.category,
    year: p.year,
    technologies: p.technologies,
    coverUrl: p.coverUrl,
    gallery: p.gallery,
    videoUrl: p.videoUrl,
    accent: p.accent,
    published: p.published,
    featured: p.featured,
  }
}

type Upload = { id: string; name: string; progress: number }

function uploadImage(file: File, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('scope', 'media')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status < 300 && res.url) resolve(res.url)
        else reject(new Error(res.error ?? 'Ошибка загрузки'))
      } catch {
        reject(new Error('Ошибка загрузки'))
      }
    }
    xhr.onerror = () => reject(new Error('Ошибка сети'))
    xhr.open('POST', '/api/upload')
    xhr.send(fd)
  })
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </label>
  )
}

function Err({ msg }: { msg?: string }) {
  return msg ? (
    <p role="alert" className="text-xs text-destructive">
      {msg}
    </p>
  ) : null
}

export function ProjectModal({
  open,
  project,
  onClose,
  onSaved,
}: {
  open: boolean
  project: Project | null
  onClose: () => void
  onSaved: (p: Project) => void
}) {
  const [values, setValues] = useState<ProjectInput>(empty())
  const [errors, setErrors] = useState<Errors>({})
  const [techInput, setTechInput] = useState('')
  const [pending, setPending] = useState(false)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(project ? fromProject(project) : empty())
      setErrors({})
      setTechInput('')
      setUploads([])
      setSlugTouched(Boolean(project))
    }
  }, [open, project])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => {
    setValues((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const addTech = () => {
    const t = techInput.trim()
    if (!t) return
    if (!values.technologies.includes(t)) set('technologies', [...values.technologies, t])
    setTechInput('')
  }

  const handleFiles = async (files: FileList | null, target: 'cover' | 'gallery') => {
    if (!files?.length) return
    const list = Array.from(files).slice(0, target === 'cover' ? 1 : 10)
    for (const file of list) {
      const id = `${Date.now()}-${Math.random()}`
      setUploads((u) => [...u, { id, name: file.name, progress: 0 }])
      try {
        const url = await uploadImage(file, (p) =>
          setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))),
        )
        if (target === 'cover') set('coverUrl', url)
        else setValues((s) => ({ ...s, gallery: [...s.gallery, url] }))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Ошибка загрузки')
      } finally {
        setUploads((u) => u.filter((x) => x.id !== id))
      }
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    if (uploads.length) {
      toast.message('Дождитесь окончания загрузки')
      return
    }
    setPending(true)
    try {
      const payload = { ...values, videoUrl: values.videoUrl?.trim() || null }
      const res = project ? await updateProject(project.id, payload) : await createProject(payload)
      if (!res.ok) {
        setErrors(res.errors)
        toast.error('Проверьте поля')
        return
      }
      toast.success(project ? 'Проект обновлён' : 'Проект создан')
      onSaved(res.project)
    } catch {
      toast.error('Не удалось сохранить')
    } finally {
      setPending(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-end justify-center bg-background/70 backdrop-blur-md sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            className="glass flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5 md:px-8">
              <h2 id="project-modal-title" className="font-display text-xl font-bold">
                {project ? 'Редактировать проект' : 'Новый проект'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="p-title">Название</Label>
                    <input
                      id="p-title"
                      value={values.title}
                      onChange={(e) => {
                        set('title', e.target.value)
                        if (!slugTouched) set('slug', slugify(e.target.value))
                      }}
                      className={cn(input, errors.title ? 'border-destructive/70' : 'border-border')}
                      placeholder="NOVA"
                    />
                    <Err msg={errors.title} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="p-slug">Slug (URL)</Label>
                    <input
                      id="p-slug"
                      value={values.slug}
                      onChange={(e) => {
                        setSlugTouched(true)
                        set('slug', slugify(e.target.value))
                      }}
                      className={cn(input, 'font-mono', errors.slug ? 'border-destructive/70' : 'border-border')}
                      placeholder="nova"
                    />
                    <Err msg={errors.slug} />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="p-tagline">Короткое описание</Label>
                    <input
                      id="p-tagline"
                      value={values.tagline}
                      onChange={(e) => set('tagline', e.target.value)}
                      className={cn(input, 'border-border')}
                      placeholder="Финтех-платформа нового поколения"
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="p-desc">Полное описание</Label>
                    <textarea
                      id="p-desc"
                      rows={5}
                      value={values.description}
                      onChange={(e) => set('description', e.target.value)}
                      className={cn(input, 'resize-none border-border')}
                      placeholder="Задача, решение, результат…"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="p-cat">Категория</Label>
                    <input
                      id="p-cat"
                      value={values.category}
                      onChange={(e) => set('category', e.target.value)}
                      className={cn(input, 'border-border')}
                      placeholder="Web-платформа"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="p-year">Год</Label>
                    <input
                      id="p-year"
                      type="number"
                      min={2000}
                      max={2100}
                      value={values.year}
                      onChange={(e) => set('year', Number(e.target.value))}
                      className={cn(input, errors.year ? 'border-destructive/70' : 'border-border')}
                    />
                    <Err msg={errors.year} />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="p-tech">Технологии</Label>
                    <div className={cn(input, 'flex flex-wrap items-center gap-2 border-border py-2')}>
                      {values.technologies.map((t) => (
                        <span key={t} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                          {t}
                          <button
                            type="button"
                            aria-label={`Удалить ${t}`}
                            onClick={() => set('technologies', values.technologies.filter((x) => x !== t))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" aria-hidden />
                          </button>
                        </span>
                      ))}
                      <input
                        id="p-tech"
                        value={techInput}
                        onChange={(e) => setTechInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.nativeEvent.isComposing || e.keyCode === 229) return
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            addTech()
                          }
                        }}
                        onBlur={addTech}
                        placeholder="Next.js, Enter"
                        className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Обложка</Label>
                    <label
                      className={cn(
                        'relative flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors hover:border-foreground/40',
                        errors.coverUrl ? 'border-destructive/70' : 'border-border',
                      )}
                    >
                      {values.coverUrl ? (
                        <Image src={values.coverUrl} alt="Обложка" fill sizes="400px" className="object-cover" />
                      ) : (
                        <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                          <ImagePlus className="h-5 w-5" aria-hidden />
                          Загрузить изображение
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          handleFiles(e.target.files, 'cover')
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <Err msg={errors.coverUrl} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Галерея</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {values.gallery.map((url, i) => (
                        <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg">
                          <Image src={url} alt={`Галерея ${i + 1}`} fill sizes="120px" className="object-cover" />
                          <button
                            type="button"
                            aria-label="Удалить изображение"
                            onClick={() => set('gallery', values.gallery.filter((_, j) => j !== i))}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                      ))}
                      <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/40">
                        <ImagePlus className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Добавить в галерею</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            handleFiles(e.target.files, 'gallery')
                            e.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <AnimatePresence>
                    {uploads.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2 overflow-hidden md:col-span-2"
                      >
                        {uploads.map((u) => (
                          <li key={u.id} className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                              <span className="truncate">{u.name}</span>
                              <span className="tabular-nums">{u.progress}%</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-border">
                              <motion.div className="h-full bg-primary" animate={{ width: `${u.progress}%` }} />
                            </div>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="p-video">Видео (YouTube / Vimeo)</Label>
                    <input
                      id="p-video"
                      value={values.videoUrl ?? ''}
                      onChange={(e) => set('videoUrl', e.target.value || null)}
                      className={cn(input, errors.videoUrl ? 'border-destructive/70' : 'border-border')}
                      placeholder="https://youtu.be/…"
                    />
                    <Err msg={errors.videoUrl} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Акцент</Label>
                    <div className="flex gap-2">
                      {(
                        [
                          ['lime', 'bg-primary'],
                          ['violet', 'bg-accent'],
                          ['blue', 'bg-electric'],
                        ] as const
                      ).map(([v, c]) => (
                        <button
                          key={v}
                          type="button"
                          aria-label={v}
                          aria-pressed={values.accent === v}
                          onClick={() => set('accent', v)}
                          className={cn(
                            'h-9 w-9 rounded-full transition-all',
                            c,
                            values.accent === v ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : 'opacity-60',
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-end gap-3">
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={values.published}
                        onChange={(e) => set('published', e.target.checked)}
                        className="h-4 w-4 accent-[#c8ff1f]"
                      />
                      Опубликован
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={values.featured}
                        onChange={(e) => set('featured', e.target.checked)}
                        className="h-4 w-4 accent-[#c8ff1f]"
                      />
                      Избранный (крупная карточка)
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 md:px-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_rgba(200,255,31,0.35)] disabled:opacity-60"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {project ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
