import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { cn } from '@/shared/utils'
import { Toaster } from '@/components/ui/sonner'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const siteDescription =
  'Feature flags, gradual rollout, real-time updates and operational safety for modern teams.'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans'
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: 'CanaryGate',
  title: {
    default: 'CanaryGate',
    template: '%s | CanaryGate'
  },
  description: siteDescription,
  keywords: [
    'CanaryGate',
    'feature flags',
    'gradual rollout',
    'canary deploy',
    'real-time updates',
    'SSE'
  ],
  openGraph: {
    type: 'website',
    siteName: 'CanaryGate',
    title: 'CanaryGate',
    description: siteDescription
  },
  twitter: {
    card: 'summary',
    title: 'CanaryGate',
    description: siteDescription
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="CanaryGate" />
      </head>
      <body
        className={cn(
          'dark font-sans antialiased',
          jakarta.variable,
          jetbrains.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
