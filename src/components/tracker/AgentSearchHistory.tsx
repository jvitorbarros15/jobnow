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
  results: Array<{
    id: string
    title: string
    company: string
    location: string
    remote: boolean
    url: string
    source: string
    fit_score: number
    sponsorship_status: string
    fit_summary: string
    priority: string
    action_items: string[]
  }>
  sources_searched: number
}

export default function AgentSearchHistory() {
  const [searches, setSearches] = useState<AgentSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [expandedSearches, setExpandedSearches] = useState<Set<string>>(new Set())
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
        <span className="text-[11px] font-mono text-accent/60 bg-accent/10 px-2.5 py-1.5 rounded-full">{searches.length}</span>
      </div>

      <div className="space-y-4">
        {sortedDates.map((date, dateIdx) => {
          const isExpanded = expandedDates.has(date)
          const dateSearches = groupedByDate[date]

          return (
            <div key={date} className="group">
              {/* Date header */}
              <button
                onClick={() => {
                  setExpandedDates((prev) => {
                    const next = new Set(prev)
                    next.has(date) ? next.delete(date) : next.add(date)
                    return next
                  })
                }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 hover:bg-white/[0.06] active:bg-white/[0.08] cursor-pointer border border-transparent hover:border-accent/20"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                    <ChevronRight size={16} className="text-accent/60" />
                  </div>
                  <span className="font-mono text-sm text-text font-medium">{format(new Date(date), 'MMM d, yyyy')}</span>
                  <span className="text-[11px] text-muted/70 bg-white/[0.04] px-2.5 py-1 rounded-full whitespace-nowrap">{dateSearches.length} searches</span>
                </div>
              </button>

              {/* Search entries - expandable */}
              {isExpanded && (
                <div className="mt-3 ml-8 space-y-2 border-l-2 border-accent/20 pl-4">
                  {/* Timeline dot */}
                  <div className="absolute ml-[-23px] w-3 h-3 bg-accent rounded-full opacity-60" />

                  {dateSearches.map((search) => {
                    const isSearchExpanded = expandedSearches.has(search.id)
                    return (
                      <div key={search.id} className="group/item">
                        <div
                          onClick={() => {
                            setExpandedSearches((prev) => {
                              const next = new Set(prev)
                              next.has(search.id) ? next.delete(search.id) : next.add(search.id)
                              return next
                            })
                          }}
                          className="w-full bg-white/[0.02] rounded-lg p-4 space-y-3 transition-all duration-200 hover:bg-white/[0.05] hover:border-accent/30 border border-white/[0.03] cursor-pointer"
                        >
                          {/* Time and actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 text-muted/80 text-sm">
                              <Clock size={12} className="opacity-50" />
                              <span className="font-mono text-sm">{format(new Date(search.created_at), 'HH:mm')}</span>
                              <span className="text-[10px] text-muted/50">•</span>
                              <span className="text-sm text-muted/70">{formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ChevronRight size={14} className={`text-accent/60 transition-transform duration-300 ${isSearchExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </div>

                          {/* Summary text */}
                          <p className="text-text/90 line-clamp-2 text-sm leading-relaxed">{search.summary}</p>

                          {/* Badges */}
                          <div className="flex gap-2 flex-wrap pt-1">
                            <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-2 rounded-md">
                              <Zap size={12} className="text-accent opacity-70" />
                              <span className="text-accent font-semibold text-sm">{search.results?.length || 0}</span>
                              <span className="text-accent/70 text-sm">jobs</span>
                            </div>
                            <div className="bg-white/[0.04] border border-white/[0.08] px-3 py-2 rounded-md">
                              <span className="text-muted/80 text-sm">{search.sources_searched} sources</span>
                            </div>
                          </div>
                        </div>

                        {/* Delete button - outside main div */}
                        <div className="flex justify-end mt-2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleDelete(search.id)}
                            disabled={deleting === search.id}
                            className="text-muted/40 hover:text-red transition-all duration-200 flex-shrink-0 p-1.5 hover:bg-red/10 rounded cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Jobs list - expandable */}
                        {isSearchExpanded && search.results && search.results.length > 0 && (
                          <div className="mt-3 ml-4 space-y-2.5 border-l-2 border-accent/20 pl-4">
                            {search.results.map((job) => (
                              <a
                                key={job.id}
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-white/[0.01] rounded-lg p-3 border border-white/[0.02] hover:bg-white/[0.04] hover:border-accent/20 transition-all"
                              >
                                <div className="space-y-2">
                                  {/* Header: title + fit score */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-text">{job.title}</p>
                                      <p className="text-xs text-muted/80">{job.company}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent font-semibold flex-shrink-0">{job.fit_score}/10</span>
                                  </div>

                                  {/* Location + remote */}
                                  <div className="flex items-center gap-2 text-xs text-muted/70">
                                    <span>{job.location}</span>
                                    {job.remote && <span className="px-1.5 py-0.5 bg-white/[0.05] rounded text-accent">Remote</span>}
                                  </div>

                                  {/* Fit reason */}
                                  <p className="text-xs text-text/80 leading-relaxed">{job.fit_summary}</p>

                                  {/* Source + sponsorship */}
                                  <div className="flex gap-1.5 flex-wrap pt-1">
                                    <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.05]">{job.source}</span>
                                    {job.sponsorship_status && (
                                      <span className={`text-[10px] px-2 py-1 rounded-full ${
                                        job.sponsorship_status === 'likely' ? 'bg-green/20 text-green' :
                                        job.sponsorship_status === 'confirmed' ? 'bg-green/30 text-green' :
                                        job.sponsorship_status === 'unlikely' ? 'bg-red/20 text-red' :
                                        'bg-white/[0.05]'
                                      }`}>
                                        Sponsorship: {job.sponsorship_status}
                                      </span>
                                    )}
                                  </div>

                                  {/* Apply link */}
                                  <div className="pt-1.5 flex items-center gap-1 text-accent text-xs font-medium hover:underline">
                                    <span>Click to apply →</span>
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
