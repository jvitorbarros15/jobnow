'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface GmailStepProps {
  user: any
  onNext: () => void
}

let supabase: SupabaseClient | null = null

const getSupabaseClient = () => {
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabase
}

export default function GmailStep({ user, onNext }: GmailStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnectGmail = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const redirectUrl = `${window.location.origin}/callback`
      const supabaseClient = getSupabaseClient()

      const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'gmail.readonly calendar.events spreadsheets',
        },
      })

      if (oauthError) throw oauthError
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Gmail')
      setIsLoading(false)
    }
  }

  const handleManualSkip = async () => {
    try {
      setIsLoading(true)
      setIsConnected(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red/10 border border-red/30 text-red text-sm">
          {error}
        </div>
      )}

      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-surface border-2 border-border flex items-center justify-center">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {isConnected ? (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-green">Gmail Connected!</h3>
            <p className="text-muted text-sm">Your Gmail account has been successfully connected.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Connect Your Gmail Account</h3>
            <p className="text-muted text-sm">We'll use Gmail to track your job application emails, calendar events, and create spreadsheets.</p>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-6">
        <button
          onClick={handleConnectGmail}
          disabled={isLoading || isConnected}
          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>{isLoading ? 'Connecting...' : 'Connect Gmail'}</span>
        </button>

        <button
          onClick={handleManualSkip}
          disabled={isLoading || isConnected}
          className="w-full py-2 px-4 rounded-lg text-muted hover:text-white transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
        >
          I'll connect this later
        </button>
      </div>
    </div>
  )
}
