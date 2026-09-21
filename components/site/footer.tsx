import Link from 'next/link'
import { Reveal } from '@/components/motion/reveal'

const LINKS = [
  { label: 'Услуги', href: '/#services' },
  { label: 'Проекты', href: '/#projects' },
  { label: 'Процесс', href: '/#process' },
  { label: 'Отзывы', href: '/#testimonials' },
  { label: 'Контакты', href: '/#contact' },
]

const SOCIAL = [
  { label: 'Behance', href: 'https://behance.net' },
  { label: 'Dribbble', href: 'https://dribbble.com' },
  { label: 'Telegram', href: 'https://t.me' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border pt-20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <Reveal className="flex flex-col gap-6">
            <p className="font-display text-2xl font-bold tracking-[0.18em]">
              GRAD<span className="text-primary">PRO</span>
            </p>
            <p className="max-w-sm text-muted-foreground">
              Digital-агентство полного цикла. Создаём сайты и продукты, которые невозможно
              забыть.
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Навигация
            </h3>
            <ul className="flex flex-col gap-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="transition-colors hover:text-primary">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Соцсети
            </h3>
            <ul className="flex flex-col gap-3">
              {SOCIAL.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-primary"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="flex flex-col gap-4 border-t border-border py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Gradpro. Все права защищены.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground">
              Политика конфиденциальности
            </a>
            <Link href="/admin" className="hover:text-foreground">
              Админ
            </Link>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none overflow-hidden text-center font-display text-[clamp(5rem,20vw,18rem)] font-bold leading-[0.75] tracking-tighter text-foreground/[0.035]"
      >
        GRADPRO
      </div>
    </footer>
  )
}
