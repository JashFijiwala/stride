import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopNav } from '@/components/layout/TopNav'
import { ServiceWorkerRegistration } from '@/components/layout/ServiceWorkerRegistration'
import { InstallPrompt } from '@/components/ui/InstallPrompt'

export const metadata: Metadata = {
  title: 'Stride — Improve your life, stride by stride',
  description:
    'A daily journaling app that helps you improve your routines gradually. Write freely, let AI find your patterns.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stride',
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
