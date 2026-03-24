'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) router.push('/')
  }, [session, router])

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="relative overflow-hidden bg-[#111118] border border-[#1e1e2e] rounded-2xl p-10 w-full max-w-sm text-center space-y-8">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600 to-transparent" />
        <div className="absolute inset-0 fuel-stripe opacity-30 pointer-events-none" />

        <div className="relative space-y-2">
          <p className="font-condensed text-xs tracking-[0.3em] uppercase text-red-500">
            Fuel Log
          </p>
          <h1 className="font-display text-6xl tracking-widest text-white">
            FILL<br /><span className="text-red-600">&apos;ER</span> UP
          </h1>
          <p className="font-condensed text-sm text-gray-500 tracking-widest uppercase pt-1">
            Sign in to continue
          </p>
        </div>

        <button
          onClick={() => signIn('github', { callbackUrl: '/' })}
          className="relative w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-[#1e1e2e] hover:border-red-900/50 transition-all rounded-xl px-6 py-3.5 font-condensed tracking-widest uppercase text-sm"
        >
          <GithubIcon />
          Sign in with GitHub
        </button>
      </div>
    </div>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
