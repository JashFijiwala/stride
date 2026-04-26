import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopNav } from '@/components/layout/TopNav'
import { ServiceWorkerRegistration } from '@/components/layout/ServiceWorkerRegistration'
import { InstallPrompt } from '@/components/ui/InstallPrompt'
import { CrisisModalWrapper } from '@/components/crisis/CrisisModalWrapper'

export const metadata: Metadata = {
  title: 'Haven — Your safe space to breathe',
  description:
    'A student mental health screening and stress management app. Write about your day in plain English. AI tracks your wellbeing, detects stress patterns, and guides you with evidence-based coping tools.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Haven',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <ServiceWorkerRegistration />
          <InstallPrompt />
          <CrisisModalWrapper />
          <TopNav />
          <main className="min-h-screen pb-16 lg:pb-0">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
