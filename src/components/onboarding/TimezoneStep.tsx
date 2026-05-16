'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface TimezoneStepProps {
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

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Australia/Melbourne',
  'UTC',
]

export default function TimezoneStep({ user, onNext }: TimezoneStepProps) {
  const [timezone, setTimezone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(detectedTimezone)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timezone) return

    try {
      setIsLoading(true)
      setError(null)
      const supabaseClient = getSupabaseClient()

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ timezone })
        .eq('id', user.id)

      if (updateError) throw updateError

      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save timezone')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red/10 border border-red/30 text-red text-sm">
          {error}
        </div>
      )}

      <div className="text-center space-y-2 mb-6">
        <h3 className="text-lg font-semibold">Select Your Timezone</h3>
        <p className="text-muted text-sm">We auto-detected: {timezone}</p>
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium mb-2">
          Timezone
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none transition-colors"
          disabled={isLoading}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 rounded-lg bg-surface/50 border border-border/50 text-sm text-muted space-y-2">
        <p>Your timezone is used to:</p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>Display job application dates and times correctly</li>
          <li>Schedule follow-up reminders at appropriate times</li>
          <li>Sync with your calendar events</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white"
      >
        {isLoading ? 'Saving...' : 'Continue'}
      </button>
    </form>
  )
}
