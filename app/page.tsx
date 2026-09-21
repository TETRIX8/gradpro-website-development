import { getPublishedProjects } from '@/lib/queries/projects'
import { Header } from '@/components/site/header'
import { Hero } from '@/components/site/hero'
import { About } from '@/components/site/about'
import { Services } from '@/components/site/services'
import { Projects } from '@/components/site/projects'
import { Process } from '@/components/site/process'
import { Testimonials } from '@/components/site/testimonials'
import { Contact } from '@/components/site/contact'
import { Footer } from '@/components/site/footer'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const projects = await getPublishedProjects()

  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Projects projects={projects} />
        <Process />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
