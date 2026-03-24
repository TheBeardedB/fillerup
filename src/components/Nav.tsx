'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Nav() {
  const { data: session } = useSession()
  const path = usePathname()

  return (
    <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-white">
            ⛽ Fuel Log
          </Link>
          <NavLink href="/" active={path === '/'}>Dashboard</NavLink>
          {session && (
            <>
              <NavLink href="/entry"  active={path === '/entry'}>Add Fill-Up</NavLink>
              <NavLink href="/upload" active={path === '/upload'}>Import CSV</NavLink>
            </>
          )}
        </div>
        <div>
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'text-sm transition-colors',
        active ? 'text-white font-medium' : 'text-gray-400 hover:text-white',
      )}
    >
      {children}
    </Link>
  )
}
