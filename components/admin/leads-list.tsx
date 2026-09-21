import { Paperclip } from 'lucide-react'
import type { Lead } from '@/lib/db/schema'

const fmt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })

export function LeadsList({ leads }: { leads: Lead[] }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Заявки</h1>
        <p className="text-sm text-muted-foreground">Последние 100 обращений с формы на сайте.</p>
      </div>

      {leads.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center text-muted-foreground">Заявок пока нет.</div>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {leads.map((l) => (
            <li key={l.id} className="glass flex flex-col gap-4 rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-display font-semibold">{l.name}</span>
                  <a href={`mailto:${l.email}`} className="text-sm text-primary hover:underline">
                    {l.email}
                  </a>
                  {l.company && <span className="text-sm text-muted-foreground">{l.company}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {l.projectType && <span className="rounded-full bg-secondary px-3 py-1">{l.projectType}</span>}
                  {l.budget && <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">{l.budget}</span>}
                  <span className="text-muted-foreground">{fmt.format(new Date(l.createdAt))}</span>
                </div>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{l.message}</p>
              {l.fileUrl && (
                <a
                  href={l.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" aria-hidden />
                  Вложение
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
