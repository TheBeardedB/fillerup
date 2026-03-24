import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: "Fill 'Er Up",
  description: 'Fuel economy tracker for the Suzuki Equator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-[#0c0c0f] text-gray-100 min-h-screen">
        <Providers>
          <Nav />
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
