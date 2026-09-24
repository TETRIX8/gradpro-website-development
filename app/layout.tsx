import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope, Unbounded } from 'next/font/google'
import { Toaster } from 'sonner'
import { CustomCursor } from '@/components/motion/custom-cursor'
import { PageTransitionProvider } from '@/components/motion/page-transition'
import { PreloaderProvider } from '@/components/motion/preloader'
import { VisitTracker } from '@/components/site/visit-tracker'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
})

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-unbounded',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gradpro — digital-агентство полного цикла',
  description:
    'Gradpro создаёт сайты, которые невозможно забыть: стратегия, UX/UI-дизайн, 3D и motion, разработка и поддержка digital-продуктов премиального уровня.',
  generator: 'v0.app',
  keywords: ['digital-агентство', 'разработка сайтов', 'UX/UI', '3D', 'брендинг', 'Gradpro'],
  openGraph: {
    title: 'Gradpro — создаём сайты, которые невозможно забыть',
    description: 'Премиальные digital-решения: стратегия, дизайн, 3D, разработка.',
    type: 'website',
    locale: 'ru_RU',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#fbfbf9',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      className={`bg-background ${manrope.variable} ${unbounded.variable}`}
    >
      <body className="antialiased">
        <PreloaderProvider>
          <PageTransitionProvider>{children}</PageTransitionProvider>
        </PreloaderProvider>
        <CustomCursor />
        <VisitTracker />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#10121a',
              border: '1px solid rgba(15,17,23,0.1)',
              color: '#f2f3f7',
            },
          }}
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
