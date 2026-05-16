'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface GoogleSheetStepProps {
  user: any
  onNext: () => void
  onSkip: () => void
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

export default function GoogleSheetStep({ user, onNext, onSkip }: GoogleSheetStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreated, setIsCreated] = useState(false)
  const [sheetUrl, setSheetUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreateSheet = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/sheets/create-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create sheet')
      }

      const data = await response.json()
      const supabaseClient = getSupabaseClient()

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ sheets_spreadsheet_id: data.spreadsheet_id })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSheetUrl(data.spreadsheet_url)
      setIsCreated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Google Sheet')
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
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3H9V9H3V3Z" fill="#34A853" opacity="0.8" />
              <path d="M11 3H17V9H11V3Z" fill="#EA4335" opacity="0.8" />
              <path d="M19 3H24V9H19V3Z" fill="#FBBC04" opacity="0.8" />
              <path d="M3 11H9V17H3V11Z" fill="#4285F4" opacity="0.8" />
              <path d="M11 11H17V17H11V11Z" fill="#34A853" opacity="0.8" />
              <path d="M19 11H24V17H19V11Z" fill="#EA4335" opacity="0.8" />
            </svg>
          </div>
        </div>

        {isCreated ? (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-green">Sheet Created!</h3>
            <p className="text-muted text-sm">Your Google Sheet for tracking jobs is ready.</p>
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-accent hover:text-accent/80 text-sm underline transition-colors"
              >
                Open your sheet
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Create Google Sheet</h3>
            <p className="text-muted text-sm">We'll create a spreadsheet to help you track and organize your job applications.</p>
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-surface/50 border border-border/50 text-sm text-muted space-y-2">
        <p>Your Google Sheet will include:</p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>Application tracking with dates and status</li>
          <li>Company and position information</li>
          <li>Follow-up reminders and notes</li>
          <li>Automated updates from JobMaker</li>
        </ul>
      </div>

      <div className="space-y-3 pt-6">
        <button
          onClick={handleCreateSheet}
          disabled={isLoading || isCreated}
          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3H9V9H3V3Z" fill="currentColor" opacity="0.8" />
            <path d="M11 3H17V9H11V3Z" fill="currentColor" opacity="0.8" />
            <path d="M19 3H24V9H19V3Z" fill="currentColor" opacity="0.8" />
            <path d="M3 11H9V17H3V11Z" fill="currentColor" opacity="0.8" />
            <path d="M11 11H17V17H11V11Z" fill="currentColor" opacity="0.8" />
            <path d="M19 11H24V17H19V11Z" fill="currentColor" opacity="0.8" />
          </svg>
          <span>{isLoading ? 'Creating...' : 'Create Google Sheet'}</span>
        </button>

        <button
          onClick={onSkip}
          disabled={isLoading || isCreated}
          className="w-full py-2 px-4 rounded-lg text-muted hover:text-white transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
        >
          I'll create this later
        </button>
      </div>
    </div>
  )
}
