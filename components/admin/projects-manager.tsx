'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, GripVertical, Pencil, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Project } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import {
  deleteProject,
  reorderProjects,
  toggleFeatured,
  togglePublished,
} from '@/app/actions/projects'
import { ProjectModal } from './project-modal'
import { ConfirmDialog } from './confirm-dialog'

function Row({
  project,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
}: {
  project: Project
  onEdit: () => void
  onDelete: () => void
  onTogglePublished: () => void
  onToggleFeatured: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'glass flex items-center gap-4 rounded-2xl p-3 pr-4 transition-shadow',
        isDragging && 'z-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-primary/50',
        !project.published && 'opacity-60',
      )}
    >
      <button
        type="button"
        aria-label="Перетащить для изменения порядка"
        {...attributes}
        {...listeners}
        className="flex h-10 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        {project.coverUrl && (
          <Image src={project.coverUrl} alt="" fill sizes="80px" className="object-cover" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate font-display font-semibold">{project.title}</span>
          {project.featured && <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-label="Избранный" />}
          {!project.published && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              черновик
            </span>
          )}
        </div>
        <span className="truncate text-sm text-muted-foreground">
          /projects/{project.slug} · {project.category} · {project.year}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <IconBtn label={project.featured ? 'Убрать из избранных' : 'Сделать избранным'} onClick={onToggleFeatured}>
          <Star className={cn('h-4 w-4', project.featured && 'fill-primary text-primary')} aria-hidden />
        </IconBtn>
        <IconBtn label={project.published ? 'Скрыть' : 'Опубликовать'} onClick={onTogglePublished}>
          {project.published ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
        </IconBtn>
        <IconBtn label="Редактировать" onClick={onEdit}>
          <Pencil className="h-4 w-4" aria-hidden />
        </IconBtn>
        <IconBtn label="Удалить" onClick={onDelete} danger>
          <Trash2 className="h-4 w-4" aria-hidden />
        </IconBtn>
      </div>
    </li>
  )
}

function IconBtn({
  label,
  onClick,
  children,
  danger,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
        danger && 'hover:bg-destructive/15 hover:text-destructive',
      )}
    >
      {children}
    </button>
  )
}

export function ProjectsManager({
  initialProjects,
  openCreate,
  onCloseCreate,
}: {
  initialProjects: Project[]
  openCreate: boolean
  onCloseCreate: () => void
}) {
  const [items, setItems] = useState(initialProjects)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  useEffect(() => setItems(initialProjects), [initialProjects])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((p) => p.id === active.id)
    const newIndex = items.findIndex((p) => p.id === over.id)
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    try {
      await reorderProjects(next.map((p) => p.id))
      toast.success('Порядок сохранён')
    } catch {
      setItems(items)
      toast.error('Не удалось сохранить порядок')
    }
  }

  const patch = (id: number, data: Partial<Project>) =>
    setItems((s) => s.map((p) => (p.id === id ? { ...p, ...data } : p)))

  const handleTogglePublished = async (p: Project) => {
    patch(p.id, { published: !p.published })
    try {
      await togglePublished(p.id, !p.published)
      toast.success(!p.published ? 'Проект опубликован' : 'Проект скрыт')
    } catch {
      patch(p.id, { published: p.published })
      toast.error('Ошибка сохранения')
    }
  }

  const handleToggleFeatured = async (p: Project) => {
    patch(p.id, { featured: !p.featured })
    try {
      await toggleFeatured(p.id, !p.featured)
    } catch {
      patch(p.id, { featured: p.featured })
      toast.error('Ошибка сохранения')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const target = deleting
    setItems((s) => s.filter((p) => p.id !== target.id))
    setDeleting(null)
    try {
      await deleteProject(target.id)
      toast.success(`«${target.title}» удалён`)
    } catch {
      setItems((s) => [...s, target].sort((a, b) => a.sortOrder - b.sortOrder))
      toast.error('Не удалось удалить проект')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Проекты</h1>
        <p className="text-sm text-muted-foreground">
          Перетаскивайте карточки, чтобы изменить порядок на сайте. Изменения применяются сразу.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center text-muted-foreground">
          Пока нет проектов. Нажмите «Новый проект», чтобы добавить первый.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3" role="list">
              <AnimatePresence initial={false}>
                {items.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    <Row
                      project={p}
                      onEdit={() => setEditing(p)}
                      onDelete={() => setDeleting(p)}
                      onTogglePublished={() => handleTogglePublished(p)}
                      onToggleFeatured={() => handleToggleFeatured(p)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <ProjectModal
        open={openCreate || Boolean(editing)}
        project={editing}
        onClose={() => {
          setEditing(null)
          onCloseCreate()
        }}
        onSaved={(saved) => {
          setItems((s) => {
            const exists = s.some((p) => p.id === saved.id)
            return exists ? s.map((p) => (p.id === saved.id ? saved : p)) : [...s, saved]
          })
          setEditing(null)
          onCloseCreate()
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Удалить проект?"
        description={`«${deleting?.title ?? ''}» будет удалён без возможности восстановления.`}
        confirmLabel="Удалить"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
