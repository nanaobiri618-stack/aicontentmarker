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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-white min-h-screen`}>
        <Providers>
          <div className="backdrop-blur-sm bg-slate-900/80">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}