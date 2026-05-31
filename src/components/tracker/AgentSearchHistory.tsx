'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Trash2, ChevronDown, ChevronRight, Sparkles, Zap, Clock } from 'lucide-react'
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
  const [hoveredSearch, setHoveredSearch] = useState<string | null>(null)

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
        <div className="space-y-3">
          <div className="h-3 bg-surface-2 rounded-full w-32 animate-pulse" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 bg-surface-2/40 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (searches.length === 0) {
    return (
      <div className="panel p-4 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 p-2 bg-accent/10 rounded-full animate-pulse">
            <Sparkles size={20} className="text-accent" />
          </div>
          <p className="text-xs font-semibold text-text">No searches yet</p>
          <p className="text-[10px] text-muted mt-1">Run a search to see history</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel p-4 overflow-hidden">
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-8px);
          }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .search-enter { animation: slideDown 0.3s ease-out; }
        .search-exit { animation: slideUp 0.2s ease-out; }
      `}</style>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Search History</h3>
        <span className="text-[10px] font-mono text-accent/60 bg-accent/10 px-2 py-1 rounded-full">{searches.length}</span>
      </div>

      <div className="space-y-3">
        {sortedDates.map((date, dateIdx) => {
          const isExpanded = expandedDates.has(date)
          const dateSearches = groupedByDate[date]

          return (
            <div key={date} className="group" style={{ animation: `slideDown 0.3s ease-out ${dateIdx * 50}ms both` }}>
              {/* Date header */}
              <button
                onClick={() => {
                  setExpandedDates((prev) => {
                    const next = new Set(prev)
                    next.has(date) ? next.delete(date) : next.add(date)
                    return next
                  })
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-white/[0.06] active:bg-white/[0.08] cursor-pointer border border-transparent hover:border-accent/20"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                    <ChevronRight size={14} className="text-accent/60" />
                  </div>
                  <span className="font-mono text-xs text-text font-medium truncate">{format(new Date(date), 'MMM d, yyyy')}</span>
                  <span className="text-[9px] text-muted/70 bg-white/[0.04] px-2 py-0.5 rounded-full whitespace-nowrap">{dateSearches.length} searches</span>
                </div>
              </button>

              {/* Search entries - expandable */}
              {isExpanded && (
                <div className="mt-2 ml-6 space-y-1.5 border-l-2 border-accent/20 pl-3 relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-1 w-[6px] h-[6px] bg-accent rounded-full opacity-60" />

                  {dateSearches.map((search, searchIdx) => (
                    <div
                      key={search.id}
                      className="search-enter group/item"
                      style={{ animationDelay: `${searchIdx * 50}ms` }}
                      onMouseEnter={() => setHoveredSearch(search.id)}
                      onMouseLeave={() => setHoveredSearch(null)}
                    >
                      <div className="text-[10px] bg-white/[0.02] rounded-lg p-3 space-y-2 transition-all duration-200 hover:bg-white/[0.05] hover:border-accent/30 border border-white/[0.03] cursor-default">
                        {/* Time and actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-muted/80">
                            <Clock size={10} className="opacity-50" />
                            <span className="font-mono text-[9px]">{format(new Date(search.created_at), 'HH:mm')}</span>
                            <span className="text-[8px] text-muted/50">•</span>
                            <span className="text-[9px]">{formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}</span>
                          </div>
                          <button
                            onClick={() => handleDelete(search.id)}
                            disabled={deleting === search.id}
                            className="text-muted/40 hover:text-red transition-all duration-200 opacity-0 group-hover/item:opacity-100 flex-shrink-0 p-1 hover:bg-red/10 rounded cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                        {/* Summary text */}
                        <p className="text-text/90 line-clamp-2 text-[10px] leading-1.5">{search.summary}</p>

                        {/* Badges */}
                        <div className="flex gap-1.5 flex-wrap pt-1">
                          <div className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2 py-1 rounded-md">
                            <Zap size={9} className="text-accent opacity-70" />
                            <span className="text-accent font-semibold text-[9px]">{search.results?.length || 0}</span>
                            <span className="text-accent/70 text-[9px]">jobs</span>
                          </div>
                          <div className="bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-md">
                            <span className="text-muted/80 text-[9px]">{search.sources_searched} sources</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
