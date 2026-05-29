'use client'

import { useState } from 'react'
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

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/callback` },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError(null)
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 border border-accent mb-6">
            <span className="font-display text-sm font-bold text-accent">JM</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1c1a18] tracking-tight">JobMaker</h1>
          <p className="text-xs font-sans text-muted mt-2">Your AI-powered job search co-pilot</p>
        </div>

        {error && (
          <div className="mb-6 border border-red/30 px-4 py-3">
            <p className="text-xs font-sans text-red">{error}</p>
          </div>
        )}

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full mb-8 py-3 bg-accent text-black text-sm font-semibold font-sans flex items-center justify-center gap-3 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-[#f7f5f2] text-[10px] font-sans uppercase tracking-[0.15em] text-muted">or</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-6">
          <div>
            <label className="block text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-0 py-2 bg-transparent border-b border-border text-[#1c1a18] text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-0 py-2 bg-transparent border-b border-border text-[#1c1a18] text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 border border-border text-[#1c1a18] text-sm font-sans hover:border-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
