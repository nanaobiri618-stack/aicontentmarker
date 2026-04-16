import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Content Orchestrator',
  description: 'Professional marketing AI for 2026',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-screen transition-colors duration-300`}>
        <Providers>
          <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/80 min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}