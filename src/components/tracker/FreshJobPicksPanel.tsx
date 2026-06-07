'use client'

import { useState, useEffect } from 'react'
import { Sparkles, ExternalLink, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AgentJobResult } from '@/types/jobs'

interface FreshSearch {
  id: string
  created_at: string
  summary: string
  results: AgentJobResult[]
  sources_searched: number
}

function fitBadge(score: number) {
  if (score >= 9) return 'bg-green/10 text-green'
  if (score >= 7) return 'bg-accent/10 text-accent'
  return 'bg-surface-2 text-muted'
}

export default function FreshJobPicksPanel() {
  const [search, setSearch] = useState<FreshSearch | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayPicks()
  }, [])

  async function fetchTodayPicks() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('agent_job_searches')
        .select('*')
        .eq('user_id', user.id)
        .eq('source', 'scheduled_routine')
        .eq('status', 'complete')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setSearch(data as FreshSearch | null)
    } catch {
      setSearch(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-accent animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Fresh job picks today</span>
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 bg-surface-2/40 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!search) {
    return (
      <div className="panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-accent/50" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Fresh job picks today</span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs text-muted">No picks yet — routine runs at 11 AM</p>
          <p className="text-[11px] text-muted/50 mt-1">Checks daily and deduplicates automatically</p>
        </div>
      </div>
    )
  }

  const topJobs = search.results
    .sort((a, b) => b.fit_score - a.fit_score)
    .slice(0, 6)

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Fresh job picks today</span>
        </div>
        <button
          onClick={fetchTodayPicks}
          className="p-1 hover:text-accent text-muted/50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="text-[10px] font-mono text-muted/60 mb-3">
        {topJobs.length} picks · {search.sources_searched} sources searched
      </div>

      {search.summary && (
        <div className="border-l-2 border-accent/30 bg-surface-2/30 rounded px-3 py-2 mb-4 text-[11px] text-muted leading-relaxed">
          {search.summary}
        </div>
      )}

      <div className="space-y-2">
        {topJobs.map((job) => (
          <a
            key={job.id}
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface-2/20 border border-border/50 hover:border-accent/30 hover:bg-surface-2/40 transition-all group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${fitBadge(job.fit_score)}`}>
                  {job.fit_score}/10
                </span>
                {job.sponsorship_status === 'confirmed' && (
                  <span className="text-[10px] text-green">✓ Visa</span>
                )}
                {job.sponsorship_status === 'likely' && (
                  <span className="text-[10px] text-accent">? Visa</span>
                )}
              </div>
              <p className="text-xs font-semibold text-text truncate">{job.title}</p>
              <p className="text-[11px] text-muted truncate">{job.company} · {job.remote ? 'Remote' : job.location}</p>
              <p className="text-[10px] text-muted/70 mt-1 line-clamp-2">{job.fit_summary}</p>
            </div>
            <ExternalLink size={12} className="text-muted/40 group-hover:text-accent flex-shrink-0 mt-1 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  )
}
