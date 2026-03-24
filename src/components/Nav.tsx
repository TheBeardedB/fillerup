'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Nav() {
  const { data: session } = useSession()
  const path = usePathname()

  return (
    <nav className="border-b border-[#1e1e2e] bg-[#0c0c0f]/95 backdrop-blur-sm sticky top-0 z-10">
      {/* Top accent stripe */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo mark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <GaugeSvg />
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl tracking-widest text-white group-hover:text-red-400 transition-colors">
                FILL &apos;ER UP
              </span>
              <span className="font-condensed text-[9px] tracking-[0.25em] text-gray-500 uppercase">
                Fuel Log
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/"       active={path === '/'}>Dashboard</NavLink>
            {session && (
              <>
                <NavLink href="/entry"  active={path === '/entry'}>Add Fill-Up</NavLink>
                <NavLink href="/upload" active={path === '/upload'}>Import CSV</NavLink>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-1">
            <NavLink href="/"      active={path === '/'}>Home</NavLink>
            {session && (
              <NavLink href="/entry" active={path === '/entry'}>Add</NavLink>
            )}
          </div>

          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="font-condensed text-xs tracking-widest uppercase text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="font-condensed text-xs tracking-widest uppercase text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign In
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
        'font-condensed text-sm tracking-wider uppercase px-3 py-1.5 rounded transition-colors',
        active
          ? 'text-white bg-white/5'
          : 'text-gray-500 hover:text-white',
      )}
    >
      {children}
    </Link>
  )
}

function GaugeSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" stroke="#dc2626" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="9"  stroke="#1e1e2e" strokeWidth="5" />
      {/* Gauge ticks */}
      <line x1="14" y1="3"  x2="14" y2="6"  stroke="#6b7280" strokeWidth="1" />
      <line x1="25" y1="14" x2="22" y2="14" stroke="#6b7280" strokeWidth="1" />
      <line x1="3"  y1="14" x2="6"  y2="14" stroke="#6b7280" strokeWidth="1" />
      {/* Needle */}
      <line x1="14" y1="14" x2="20" y2="8" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="14" r="1.5" fill="#dc2626" />
    </svg>
  )
}
