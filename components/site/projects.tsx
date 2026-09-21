import type { Project } from '@/lib/db/schema'
import { Reveal, SplitWords } from '@/components/motion/reveal'
import { GlowButton } from '@/components/motion/glow-button'
import { ProjectCard } from './project-card'

export function Projects({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className="relative py-28 md:py-40">
      <div
        className="absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Reveal className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" />
              Проекты
            </Reveal>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.8rem)] font-bold leading-[1.02] tracking-tight text-balance">
              <SplitWords text={'Работы, которыми\nмы гордимся'} highlight={['гордимся']} />
            </h2>
          </div>
          <Reveal className="max-w-sm text-muted-foreground" delay={0.15}>
            Каждый проект — это история о бренде, рассказанная через свет, движение и код.
          </Reveal>
        </div>

        {projects.length === 0 ? (
          <Reveal className="glass rounded-3xl p-12 text-center text-muted-foreground">
            Проекты скоро появятся.
          </Reveal>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} large={p.featured && i === 0} />
            ))}
          </div>
        )}

        <Reveal className="flex justify-center pt-4">
          <GlowButton href="/#contact" variant="ghost">
            Стать следующим кейсом
          </GlowButton>
        </Reveal>
      </div>
    </section>
  )
}
