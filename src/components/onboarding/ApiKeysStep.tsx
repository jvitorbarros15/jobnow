'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ApiKeysStepProps {
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

export default function ApiKeysStep({ user, onNext, onSkip }: ApiKeysStepProps) {
  const [newsapiKey, setNewsapiKey] = useState('')
  const [cryptopanicKey, setCryptopanicKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      setError(null)
      const supabaseClient = getSupabaseClient()

      const updateData: Record<string, any> = {}
      if (newsapiKey.trim()) updateData.newsapi_key = newsapiKey.trim()
      if (cryptopanicKey.trim()) updateData.cryptopanic_key = cryptopanicKey.trim()

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)

        if (updateError) throw updateError
      }

      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API keys')
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
        <h3 className="text-lg font-semibold">Add API Keys (Optional)</h3>
        <p className="text-muted text-sm">Enhance JobMaker with news and crypto insights</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="newsapi" className="block text-sm font-medium">
            NewsAPI Key
          </label>
          <a
            href="https://newsapi.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 text-xs underline transition-colors"
          >
            Get free key
          </a>
        </div>
        <input
          id="newsapi"
          type="password"
          value={newsapiKey}
          onChange={(e) => setNewsapiKey(e.target.value)}
          placeholder="Optional API key"
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
          disabled={isLoading}
        />
        <p className="text-xs text-muted mt-1">Used to fetch tech and business news</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="cryptopanic" className="block text-sm font-medium">
            CryptoPanic Key
          </label>
          <a
            href="https://cryptopanic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 text-xs underline transition-colors"
          >
            Get free key
          </a>
        </div>
        <input
          id="cryptopanic"
          type="password"
          value={cryptopanicKey}
          onChange={(e) => setCryptopanicKey(e.target.value)}
          placeholder="Optional API key"
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
          disabled={isLoading}
        />
        <p className="text-xs text-muted mt-1">Used to fetch crypto-related job opportunities</p>
      </div>

      <div className="p-4 rounded-lg bg-surface/50 border border-border/50 text-sm text-muted">
        <p>These API keys are optional and can be added later in your settings.</p>
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
