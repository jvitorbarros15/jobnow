'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ProfileStepProps {
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

export default function ProfileStep({ user, onNext }: ProfileStepProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setIsValid(!!name.trim() && !!phone.trim() && !!location.trim())
  }, [name, phone, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    try {
      setIsLoading(true)
      setError(null)
      const supabaseClient = getSupabaseClient()

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: name.trim(),
          email: user.email,
          phone: phone.trim(),
          location: location.trim(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
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

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email (from auth)
        </label>
        <input
          id="email"
          type="email"
          value={user.email || ''}
          disabled
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border/50 text-muted cursor-not-allowed"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-2">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="San Francisco, CA"
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white"
      >
        {isLoading ? 'Saving...' : 'Continue'}
      </button>
    </form>
  )
}
