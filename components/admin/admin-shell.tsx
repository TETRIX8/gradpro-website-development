'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ExternalLink, FolderKanban, Inbox, LogOut, Plus } from 'lucide-react'
import type { Lead, Project } from '@/lib/db/schema'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { ProjectsManager } from './projects-manager'
import { LeadsList } from './leads-list'

type Tab = 'projects' | 'leads'

export function AdminShell({
  user,
  initialProjects,
  leads,
}: {
  user: { name: string; email: string }
  initialProjects: Project[]
  leads: Lead[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('projects')
  const [openCreate, setOpenCreate] = useState(false)

  const signOut = async () => {
    await authClient.signOut()
    router.push('/admin/sign-in')
    router.refresh()
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-10">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-display text-base font-bold tracking-[0.18em]">
              GRAD<span className="text-primary">PRO</span>
              <span className="ml-3 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground">
                ADMIN
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Разделы">
              {(
                [
                  { id: 'projects', label: 'Проекты', Icon: FolderKanban, count: initialProjects.length },
                  { id: 'leads', label: 'Заявки', Icon: Inbox, count: leads.length },
                ] as const
              ).map(({ id, label, Icon, count }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={tab === id}
                  className={cn(
                    'relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
                    tab === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab === id && (
                    <motion.span
                      layoutId="admin-tab"
                      className="absolute inset-0 rounded-full bg-secondary"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" aria-hidden />
                  <span className="relative">{label}</span>
                  <span className="relative rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              Сайт <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
            {tab === 'projects' && (
              <button
                type="button"
                onClick={() => setOpenCreate(true)}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_rgba(200,255,31,0.35)]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Новый проект</span>
              </button>
            )}
            <button
              type="button"
              onClick={signOut}
              aria-label="Выйти"
              title={user.email}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <nav className="flex gap-1 px-6 pb-3 md:hidden" aria-label="Разделы">
          {(['projects', 'leads'] as Tab[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm',
                tab === id ? 'bg-secondary text-foreground' : 'text-muted-foreground',
              )}
            >
              {id === 'projects' ? 'Проекты' : 'Заявки'}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10">
        {tab === 'projects' ? (
          <ProjectsManager
            initialProjects={initialProjects}
            openCreate={openCreate}
            onCloseCreate={() => setOpenCreate(false)}
          />
        ) : (
          <LeadsList leads={leads} />
        )}
      </main>
    </div>
  )
}
