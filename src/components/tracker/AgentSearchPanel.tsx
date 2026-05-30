'use client'

import { formatDistanceToNow } from 'date-fns'
import { Loader2 } from 'lucide-react'
import type { AgentSearchResult } from '@/types/jobs'
import AgentJobCard from './AgentJobCard'

interface Props {
  result: AgentSearchResult | null
  loading: boolean
  error: string | null
  onRunSearch: () => void | Promise<void>
}

export default function AgentSearchPanel({
  result,
  loading,
  error,
  onRunSearch,
}: Props) {
  // State 1: Idle/Empty
  if (!result && !loading && !error) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">No searches yet</h3>
            <p className="text-xs text-muted">
              Discover AI-ranked job opportunities matched to your profile
            </p>
          </div>
          <button
            onClick={onRunSearch}
            disabled={loading}
            className="bg-accent text-white px-4 py-2 rounded text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Run Search
          </button>
        </div>
      </div>
    )
  }

  // State 2: Loading
  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin mb-3" />
          <p className="text-xs text-muted">Searching sources…</p>
        </div>
      </div>
    )
  }

  // State 3: Error
  if (error) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-red-500 mb-3">{error}</p>
          <button
            onClick={onRunSearch}
            className="text-xs text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // State 4: Complete
  if (result && result.status === 'complete') {
    const topResults = result.results.slice(0, 5)
    const lastRunTime = formatDistanceToNow(new Date(result.created_at), {
      addSuffix: false,
    })

    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
            AI Job Picks
          </span>
          <button
            onClick={onRunSearch}
            disabled={loading}
            className="bg-accent text-white px-3 py-1 rounded text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Run Search
          </button>
        </div>

        {/* Metadata Row */}
        <div className="text-[10px] font-mono text-muted mb-4">
          Last run {lastRunTime} · {result.sources_searched} listings evaluated
        </div>

        {/* Summary Blurb */}
        <div className="border-l-2 border-accent/30 bg-surface-2/50 rounded px-3 py-3 mb-4 text-xs text-muted">
          {result.summary}
        </div>

        {/* Results List */}
        <div className="divide-y divide-border/50">
          {topResults.map((job, index) => (
            <AgentJobCard key={job.id} job={job} index={index} />
          ))}
        </div>
      </div>
    )
  }

  return null
}
