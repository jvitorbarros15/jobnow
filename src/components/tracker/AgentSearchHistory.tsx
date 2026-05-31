'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Trash2, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AgentSearch {
  id: string
  created_at: string
  completed_at: string
  summary: string
  results: Array<{ id: string; title: string; company: string; fit_score: number }>
  sources_searched: number
}

export default function AgentSearchHistory() {
  const [searches, setSearches] = useState<AgentSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchSearchHistory()
  }, [])

  async function fetchSearchHistory() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('agent_job_searches')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(50)

      setSearches((data || []) as AgentSearch[])
    } catch (error) {
      console.error('Failed to fetch search history:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const supabase = createClient()
      await supabase.from('agent_job_searches').delete().eq('id', id)
      setSearches((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Failed to delete search:', error)
    } finally {
      setDeleting(null)
    }
  }

  const groupedByDate = searches.reduce(
    (acc, search) => {
      const date = search.created_at.split('T')[0]
      if (!acc[date]) acc[date] = []
      acc[date].push(search)
      return acc
    },
    {} as Record<string, AgentSearch[]>
  )

  const sortedDates = Object.keys(groupedByDate).sort().reverse()

  if (loading) {
    return (
      <div className="panel p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-surface-2 rounded w-24" />
          <div className="h-3 bg-surface-2 rounded" />
        </div>
      </div>
    )
  }

  if (searches.length === 0) {
    return (
      <div className="panel p-4">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Sparkles size={20} className="text-muted mb-2" />
          <p className="text-xs font-semibold text-text">No searches yet</p>
          <p className="text-[10px] text-muted mt-1">Run a search to see history</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel p-4 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Search History</h3>

      {sortedDates.map((date) => {
        const isExpanded = expandedDates.has(date)
        const dateSearches = groupedByDate[date]

        return (
          <div key={date} className="space-y-1">
            {/* Date header */}
            <button
              onClick={() => {
                setExpandedDates((prev) => {
                  const next = new Set(prev)
                  next.has(date) ? next.delete(date) : next.add(date)
                  return next
                })
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-white/[0.03] rounded transition-colors text-xs"
            >
              <div className="flex items-center gap-1.5">
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span className="font-mono text-text font-medium">{format(new Date(date), 'MMM d, yyyy')}</span>
                <span className="text-[10px] text-muted">{dateSearches.length} search(es)</span>
              </div>
            </button>

            {/* Search entries */}
            {isExpanded && (
              <div className="ml-4 space-y-1 border-l border-border/30 pl-2">
                {dateSearches.map((search) => (
                  <div key={search.id} className="text-[10px] bg-white/[0.02] rounded p-1.5 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-muted font-mono">{format(new Date(search.created_at), 'HH:mm')}</p>
                        <p className="text-text truncate line-clamp-2">{search.summary}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(search.id)}
                        disabled={deleting === search.id}
                        className="text-muted hover:text-red transition-colors flex-shrink-0 p-0.5"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div className="flex gap-1 text-muted flex-wrap">
                      <span className="bg-white/[0.05] px-1 rounded">{search.results?.length || 0} jobs</span>
                      <span className="bg-white/[0.05] px-1 rounded">{search.sources_searched} sources</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
