'use client'

import { formatDistanceToNow } from 'date-fns'
import { Bookmark, BookmarkCheck, FileText } from 'lucide-react'
import type { JobResult } from '@/types/jobs'

interface JobCardProps {
  job: JobResult
  onSave: () => void
  onBuildResume: () => void
  saved: boolean
}

const sourceStyles: Record<string, string> = {
  Indeed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ZipRecruiter: 'bg-green-500/20 text-green-400 border-green-500/30',
  LinkedIn: 'bg-blue-700/20 text-blue-300 border-blue-700/30',
  Glassdoor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

export default function JobCard({ job, onSave, onBuildResume, saved }: JobCardProps) {
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })
    } catch {
      return job.posted_at
    }
  })()

  const visibleKeywords = job.ats_keywords.slice(0, 5)
  const extraCount = job.ats_keywords.length - 5

  return (
    <div className="panel p-4 hover:border-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-bold text-text truncate">{job.title}</h3>
          <p className="text-sm text-muted truncate">{job.company}</p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded border whitespace-nowrap flex-shrink-0 ${
            sourceStyles[job.source] ?? 'bg-border/30 text-muted border-border'
          }`}
        >
          {job.source}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted">
        <span>{job.location}</span>
        {job.remote && (
          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
            Remote
          </span>
        )}
        {job.salary && <span className="text-text font-medium">{job.salary}</span>}
        <span className="ml-auto">{timeAgo}</span>
      </div>

      {visibleKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleKeywords.map((kw) => (
            <span
              key={kw}
              className="px-2 py-0.5 rounded text-xs bg-accent/15 text-accent border border-accent/25"
            >
              {kw}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="px-2 py-0.5 rounded text-xs bg-border/30 text-muted">
              +{extraCount} more
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            saved
              ? 'bg-accent/20 border-accent/40 text-accent'
              : 'border-glass-border text-muted hover:border-accent/50 hover:text-text'
          }`}
        >
          {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={onBuildResume}
          className="btn-primary px-3 py-1.5 text-sm"
        >
          <FileText size={14} />
          Build Resume
        </button>
      </div>
    </div>
  )
}
