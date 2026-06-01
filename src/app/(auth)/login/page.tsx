'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null
const getSupabaseClient = () => {
  if (!supabase) supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return supabase
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError(null)
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/tracker')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md panel p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 border border-accent mb-4">
            <span className="font-display text-sm font-bold text-accent">JM</span>
          </div>
          <h1 className="text-text font-display text-lg font-bold tracking-tight">JobMaker</h1>
          <p className="text-muted text-sm mt-2">Your AI-powered job search co-pilot</p>
        </div>

        {error && (
          <div className="mb-6 border border-red/30 bg-red/5 px-3 py-2 rounded text-sm">
            <p className="text-red text-xs">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="text-muted text-sm font-medium block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-white/[0.05] border border-glass-border text-text placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent w-full px-3 py-2 rounded text-sm transition-colors"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-muted text-sm font-medium block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white/[0.05] border border-glass-border text-text placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent w-full px-3 py-2 rounded text-sm transition-colors"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-2 disabled:opacity-50"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
