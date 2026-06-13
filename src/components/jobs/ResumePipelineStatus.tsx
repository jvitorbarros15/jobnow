'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, CheckCircle, XCircle, Sparkles, Terminal } from 'lucide-react'
import type { ResumeRequest } from '@/types/jobs'
import type { Resume } from '@/types/jobs'
import KeywordScore from './KeywordScore'
import LatexOutput from './LatexOutput'

interface Props {
  requestId: string | null
  jobMeta: { title: string; company: string; description: string } | null
  onReset: () => void
}

interface PollResponse {
  request: ResumeRequest & { resumes: Resume | null }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Waiting for agent…',
  building: 'Building resume…',
  reviewing: 'Reviewing & scoring…',
  complete: 'Done',
  failed: 'Failed',
}

export default function ResumePipelineStatus({ requestId, jobMeta, onReset }: Props) {
  const [req, setReq] = useState<PollResponse['request'] | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!requestId) return
    poll()
    intervalRef.current = setInterval(poll, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [requestId])

  useEffect(() => {
    if (req?.status === 'complete' || req?.status === 'failed') {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [req?.status])

  async function poll() {
    if (!requestId) return
    try {
      const res = await fetch(`/api/jobs/resume-request?id=${requestId}`)
      if (!res.ok) return
      const data: PollResponse = await res.json()
      if (data.request) setReq(data.request)
    } catch {
      // network error or non-JSON body — interval will retry
    }
  }

  if (!requestId) return null

  const resume = req?.resumes

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border text-xs ${
        req?.status === 'complete' ? 'border-green/30 bg-green/5' :
        req?.status === 'failed'   ? 'border-red/30 bg-red/5' :
        'border-accent/30 bg-accent/5'
      }`}>
        {req?.status === 'complete' ? (
          <CheckCircle size={14} className="text-green flex-shrink-0" />
        ) : req?.status === 'failed' ? (
          <XCircle size={14} className="text-red flex-shrink-0" />
        ) : (
          <Loader2 size={14} className="animate-spin text-accent flex-shrink-0" />
        )}
        <span className="font-mono">
          {STATUS_LABELS[req?.status ?? 'pending']}
        </span>
        <button onClick={onReset} className="ml-auto text-muted hover:text-text transition-colors">
          ✕
        </button>
      </div>

      {/* Agent command — show while pending */}
      {(!req || req.status === 'pending') && (
        <div className="panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Run in Claude Code</span>
          </div>
          <p className="text-xs text-muted">Open Claude Code in this project and say:</p>
          <div className="bg-black/30 border border-glass-border rounded p-3 font-mono text-xs text-accent">
            run the resume pipeline agent
          </div>
          <p className="text-[10px] text-muted/60">The agent reads the pending request from Supabase, builds and reviews your resume, then saves results here.</p>
        </div>
      )}

      {/* Building / reviewing spinner */}
      {(req?.status === 'building' || req?.status === 'reviewing') && (
        <div className="panel p-6 flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="text-xs text-muted">{STATUS_LABELS[req.status]}</p>
        </div>
      )}

      {/* Complete — show results */}
      {req?.status === 'complete' && resume && (
        <div className="space-y-6">
          {/* Review score + keywords */}
          {resume.review_score != null && (
            <div className="panel p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Recruiter Analysis</span>
                <span className={`ml-auto text-sm font-bold px-2 py-0.5 rounded ${
                  resume.review_score >= 80 ? 'bg-green/10 text-green' :
                  resume.review_score >= 60 ? 'bg-accent/10 text-accent' :
                  'bg-red/10 text-red'
                }`}>{resume.review_score}/100</span>
              </div>

              {resume.review_keywords?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Top Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.review_keywords.map((kw: string) => (
                      <span key={kw} className="text-[10px] px-2 py-1 rounded bg-accent/10 text-accent font-mono">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {resume.review_red_flags?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Red Flags</p>
                  <div className="space-y-1.5">
                    {resume.review_red_flags.map((rf: { flag: string; cost: string }, i: number) => (
                      <div key={i} className="text-[11px] flex gap-2">
                        <span className="text-red flex-shrink-0">↳</span>
                        <span className="text-text/80">{rf.flag} — <span className="text-muted">{rf.cost}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <KeywordScore
            score={resume.keyword_match_score ?? 0}
            matched={resume.ats_keywords_matched ?? []}
            missing={resume.missing_skills ?? []}
          />

          {/* Reviewed LaTeX (rewritten) takes priority, fall back to original */}
          <LatexOutput
            latex={resume.reviewed_latex ?? resume.latex_code}
            onCopy={() => {}}
            jobMeta={jobMeta ?? undefined}
          />
        </div>
      )}

      {/* Failed */}
      {req?.status === 'failed' && (
        <div className="panel p-4 text-center space-y-2">
          <p className="text-xs text-red">{req.error_message ?? 'Agent run failed'}</p>
          <button onClick={onReset} className="text-xs text-accent hover:underline">Try again</button>
        </div>
      )}
    </div>
  )
}
