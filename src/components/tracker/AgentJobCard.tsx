'use client'

import { useState } from 'react'
import { ExternalLink, Plus, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AgentJobResult } from '@/types/jobs'

interface Props {
  job: AgentJobResult
  index: number
  onSaved?: () => void
}

function fitScoreBadge(score: number): string {
  if (score >= 9) return 'bg-green/10 text-green'
  if (score >= 7) return 'bg-accent/10 text-accent'
  return 'bg-surface-2 text-muted'
}

function sponsorshipBadge(status: string): { bg: string; text: string; label: string } {
  if (status === 'confirmed') return { bg: 'bg-green/10', text: 'text-green', label: '✓ Visa' }
  if (status === 'likely') return { bg: 'bg-accent/10', text: 'text-accent', label: '? Visa' }
  return { bg: 'bg-surface-2', text: 'text-muted', label: 'Visa?' }
}

function priorityDot(priority: string): string {
  if (priority === 'high') return 'bg-green'
  if (priority === 'medium') return 'bg-accent'
  return 'bg-muted'
}

export default function AgentJobCard({ job, index, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const sponsor = sponsorshipBadge(job.sponsorship_status)
  const locationText = job.remote ? 'Remote' : job.location

  async function handleSaveToTracker() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('job_applications').insert({
        user_id: user.id,
        company: job.company,
        title: job.title,
        location: job.location,
        url: job.url,
        source: job.source,
        status: 'applied',
        fit_score: job.fit_score,
        sponsorship: job.sponsorship_status,
        description: job.fit_summary,
      })

      setSaved(true)
      onSaved?.()
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save job:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 opacity-0"
      style={{ animation: `fadeInUp 0.3s ease ${index * 100}ms forwards` }}
    >
      {/* Priority dot */}
      <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${priorityDot(job.priority)}`} />

      {/* Header row: company/role on left, fit score on right */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-display text-sm font-semibold text-[#171412]">{job.company}</h3>
          <p className="text-xs text-muted mt-0.5">{job.title}</p>
        </div>
        <div className={`w-8 h-8 flex items-center justify-center rounded-md font-mono font-bold text-sm ${fitScoreBadge(job.fit_score)}`}>
          {job.fit_score}
        </div>
      </div>

      {/* Info pills row */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-surface-2 font-mono text-[10px] text-[#171412]">
          {locationText}
        </span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[10px] ${sponsor.bg} ${sponsor.text}`}>
          {sponsor.label}
        </span>
      </div>

      {/* Fit summary */}
      <p className="text-xs text-muted mb-3">{job.fit_summary}</p>

      {/* Action items */}
      <ul className="space-y-1.5 mb-4">
        {job.action_items.map((item, i) => (
          <li key={i} className="text-[10px] text-muted flex items-start gap-2">
            <span className="text-accent mt-0.5 flex-shrink-0">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* Action buttons */}
      <div className="flex justify-between items-center gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:opacity-70 transition-opacity flex items-center gap-1 text-xs font-mono"
        >
          Apply
          <ExternalLink size={10} />
        </a>
        <button
          onClick={handleSaveToTracker}
          disabled={saving || saved}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
            saved
              ? 'bg-green/20 text-green'
              : 'bg-accent/20 text-accent hover:bg-accent/30'
          } disabled:opacity-50`}
        >
          {saved ? (
            <>
              <Check size={12} />
              Saved
            </>
          ) : (
            <>
              <Plus size={12} />
              Save
            </>
          )}
        </button>
      </div>
    </div>
  )
}
