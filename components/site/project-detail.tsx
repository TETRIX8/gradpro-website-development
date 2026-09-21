'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Project } from '@/lib/db/schema'
import { TransitionLink } from '@/components/motion/page-transition'
import { Reveal, SplitWords, EASE_OUT } from '@/components/motion/reveal'
import { GlowButton } from '@/components/motion/glow-button'
import { useReducedMotion } from '@/hooks/use-motion-prefs'

function toEmbed(url: string) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

export function ProjectDetail({
  project,
  prev,
  next,
}: {
  project: Project
  prev: Project | null
  next: Project | null
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['0%', '20%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 1.12])
  const embed = project.videoUrl ? toEmbed(project.videoUrl) : null

  return (
    <article>
      <div ref={heroRef} className="relative h-[86svh] min-h-[560px] overflow-hidden">
        <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
          <Image
            src={project.coverUrl}
            alt={`Обложка проекта ${project.title}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />

        <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-end gap-8 px-6 pb-16 pt-32 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.5 }}
          >
            <TransitionLink
              href="/#projects"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Все проекты
            </TransitionLink>
          </motion.div>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
              >
                <span className="glass rounded-full px-3 py-1 normal-case tracking-wide">{project.category}</span>
                <span>{project.year}</span>
              </motion.div>
              <h1 className="font-display text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.92] tracking-tight">
                <SplitWords text={project.title} animateOnMount stagger={0.1} />
              </h1>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.9 }}
              className="max-w-md text-lg text-muted-foreground md:text-right"
            >
              {project.tagline}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-16 px-6 py-24 md:px-10 lg:grid-cols-[1fr_2fr]">
        <aside className="flex flex-col gap-10 lg:sticky lg:top-32 lg:self-start">
          <Reveal className="flex flex-col gap-3 border-t border-border pt-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Клиент</span>
            <span className="font-display text-xl font-semibold">{project.title}</span>
          </Reveal>
          <Reveal delay={0.05} className="flex flex-col gap-3 border-t border-border pt-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Год</span>
            <span className="font-display text-xl font-semibold">{project.year}</span>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-3 border-t border-border pt-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Технологии</span>
            <ul className="flex flex-wrap gap-2">
              {project.technologies.map((t) => (
                <li key={t} className="rounded-full border border-border px-3 py-1 text-sm">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </aside>

        <div className="flex flex-col gap-16">
          <Reveal className="font-display text-[clamp(1.4rem,2.6vw,2.2rem)] font-medium leading-[1.3] tracking-tight text-pretty">
            {project.description}
          </Reveal>

          {embed && (
            <Reveal className="overflow-hidden rounded-[1.75rem] border border-border">
              <div className="aspect-video">
                <iframe
                  src={embed}
                  title={`Видео проекта ${project.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </Reveal>
          )}

          <div className="flex flex-col gap-6">
            {project.gallery.map((src, i) => (
              <motion.div
                key={`${src}-${i}`}
                variants={{ hidden: { opacity: 0, y: 50 }, show: { opacity: 1, y: 0 } }}
                initial={reduced ? 'show' : 'hidden'}
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 1.1, ease: EASE_OUT }}
                className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-border"
              >
                <motion.div
                  variants={{
                    hidden: { clipPath: 'inset(0% 0% 100% 0%)' },
                    show: { clipPath: 'inset(0% 0% 0% 0%)' },
                  }}
                  transition={{ duration: 1.1, ease: EASE_OUT }}
                  className="absolute inset-0"
                >
                  <Image
                    src={src}
                    alt={`${project.title} — изображение ${i + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="object-cover"
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>

          <Reveal className="glass flex flex-col gap-6 rounded-[1.75rem] p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-bold">Хотите такой же результат?</h2>
              <p className="text-muted-foreground">Расскажите о задаче — ответим в течение 48 часов.</p>
            </div>
            <GlowButton href="/#contact">Обсудить проект</GlowButton>
          </Reveal>
        </div>
      </div>

      <nav aria-label="Другие проекты" className="border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl md:grid-cols-2">
          {[
            { p: prev, label: 'Предыдущий', Icon: ArrowLeft, align: 'start' as const },
            { p: next, label: 'Следующий', Icon: ArrowRight, align: 'end' as const },
          ].map(({ p, label, Icon, align }) =>
            p ? (
              <TransitionLink
                key={label}
                href={`/projects/${p.slug}`}
                data-cursor="open"
                className={`group relative flex flex-col gap-3 overflow-hidden px-6 py-16 md:px-10 ${
                  align === 'end' ? 'items-end text-right md:border-l md:border-border' : ''
                }`}
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                  <Image src={p.coverUrl} alt="" fill sizes="50vw" className="object-cover opacity-30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-background/40" />
                </div>
                <span className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {align === 'start' && <Icon className="h-4 w-4" aria-hidden />}
                  {label}
                  {align === 'end' && <Icon className="h-4 w-4" aria-hidden />}
                </span>
                <span className="relative font-display text-4xl font-bold tracking-tight transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 md:text-5xl">
                  {p.title}
                </span>
                <span className="relative text-muted-foreground">{p.tagline}</span>
                <ArrowUpRight
                  className="relative mt-2 h-5 w-5 text-primary opacity-0 transition-all duration-500 group-hover:opacity-100"
                  aria-hidden
                />
              </TransitionLink>
            ) : (
              <div key={label} className="hidden md:block" />
            ),
          )}
        </div>
      </nav>
    </article>
  )
}
