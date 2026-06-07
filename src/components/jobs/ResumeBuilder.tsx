'use client'

import { useState, useEffect } from 'react'
import { Loader2, FileText, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import KeywordScore from './KeywordScore'
import LatexOutput from './LatexOutput'
import { createClient } from '@/lib/supabase/client'
import type { JobResult, ResumeTemplate, Resume } from '@/types/jobs'

interface ResumeResult {
  resume_id: string | null
  latex_code: string
  keyword_match_score: number
  matched_keywords: string[]
  missing_skills: string[]
  job_category: string
}

interface ResumeBuilderProps {
  job: JobResult | null
  onGenerate: (template: ResumeTemplate) => void
  onRequestGenerate: (template: ResumeTemplate) => void
  loading: boolean
  result: ResumeResult | null
}

const TEMPLATES: { value: ResumeTemplate; label: string; sub: string }[] = [
  { value: 'classic_ats', label: 'Classic ATS', sub: 'Big tech, enterprise' },
  { value: 'modern_clean', label: 'Modern Clean', sub: 'Startups' },
  { value: 'research_academic', label: 'Research', sub: 'Research roles' },
  { value: 'blockchain_web3', label: 'Blockchain / Web3', sub: 'Crypto, L2' },
]

export default function ResumeBuilder({ job, onGenerate, onRequestGenerate, loading, result }: ResumeBuilderProps) {
  const [template, setTemplate] = useState<ResumeTemplate>('classic_ats')
  const [savedResumes, setSavedResumes] = useState<Resume[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    createClient().from('resumes').select('*').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setSavedResumes(data as Resume[]) })
  }, [result])

  return (
    <div className="space-y-6 sticky top-6">
      {job ? (
        <div>
          <p className="font-display text-base font-bold text-text truncate">{job.title}</p>
          <p className="text-xs font-sans text-muted">{job.company}</p>
        </div>
      ) : (
        <div className="panel border-dashed py-8 text-center">
          <FileText size={20} className="text-muted mx-auto mb-2 opacity-30" />
          <p className="text-xs font-sans text-muted">Select a job to build resume</p>
        </div>
      )}

      <div>
        <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-3">Template</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTemplate(t.value)}
              className={`text-left p-3 border transition-colors rounded ${
                template === t.value
                  ? 'border-accent bg-accent/5 text-text'
                  : 'border-glass-border text-muted hover:border-glass-border/80 hover:text-text'
              }`}
            >
              <p className="text-xs font-sans font-medium">{t.label}</p>
              <p className="text-[10px] font-sans text-muted mt-0.5">{t.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onRequestGenerate(template)}
          disabled={!job || loading}
          className="btn-primary flex-1 py-3 text-sm"
        >
          {loading ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Sparkles size={15} /> Generate Resume (Agent)</>}
        </button>
        <button
          onClick={() => onGenerate(template)}
          disabled={!job || loading}
          className="btn-ghost px-4 py-3 text-sm"
          title="Rule-based (fast)"
        >
          <FileText size={15} />
        </button>
      </div>

      {result && (
        <div className="space-y-6 pt-4 border-t border-border">
          <KeywordScore score={result.keyword_match_score} matched={result.matched_keywords} missing={result.missing_skills} />
          <LatexOutput
            latex={result.latex_code}
            onCopy={() => {}}
            jobMeta={job ? { title: job.title, company: job.company, description: job.description } : undefined}
          />
        </div>
      )}

      {savedResumes.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-[0.12em] text-muted hover:text-[#1c1a18] transition-colors w-full"
          >
            {historyOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            History ({savedResumes.length})
          </button>
          {historyOpen && (
            <div className="mt-3 space-y-0">
              {savedResumes.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 py-2.5 border-b border-border/40">
                  <div className="min-w-0">
                    <p className="text-xs font-sans text-text truncate">{r.job_title ?? 'Untitled'}{r.company ? ` — ${r.company}` : ''}</p>
                    <p className="text-[10px] font-mono text-muted">
                      {r.keyword_match_score != null ? `${r.keyword_match_score}% · ` : ''}
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
