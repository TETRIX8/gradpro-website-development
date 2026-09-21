import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProjectBySlug, getProjectNeighbours } from '@/lib/queries/projects'
import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'
import { ProjectDetail } from '@/components/site/project-detail'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return { title: 'Проект не найден — Gradpro' }
  return {
    title: `${project.title} — кейс Gradpro`,
    description: project.tagline,
    openGraph: { title: project.title, description: project.tagline, images: [project.coverUrl] },
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project || !project.published) notFound()
  const { prev, next } = await getProjectNeighbours(slug)

  return (
    <>
      <Header />
      <main>
        <ProjectDetail project={project} prev={prev} next={next} />
      </main>
      <Footer />
    </>
  )
}
