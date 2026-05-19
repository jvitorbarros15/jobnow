'use client'

import { useState, useEffect } from 'react'
import { Loader2, FileText, ChevronDown, ChevronRight } from 'lucide-react'
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
  loading: boolean
  result: ResumeResult | null
}

const TEMPLATES: { value: ResumeTemplate; label: string; description: string }[] = [
  { value: 'classic_ats', label: 'Classic ATS', description: 'Big tech, enterprise' },
  { value: 'modern_clean', label: 'Modern Clean', description: 'Startups' },
  { value: 'research_academic', label: 'Research / Academic', description: 'Research roles' },
  { value: 'blockchain_web3', label: 'Blockchain / Web3', description: 'Crypto, L2' },
]

export default function ResumeBuilder({ job, onGenerate, loading, result }: ResumeBuilderProps) {
  const [template, setTemplate] = useState<ResumeTemplate>('classic_ats')
  const [savedResumes, setSavedResumes] = useState<Resume[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setSavedResumes(data as Resume[])
      })
  }, [result])

  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-5 sticky top-6">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-accent flex-shrink-0" />
        <div className="min-w-0">
          {job ? (
            <>
              <p className="font-bold text-white truncate">{job.title}</p>
              <p className="text-xs text-muted truncate">{job.company}</p>
            </>
          ) : (
            <p className="text-muted text-sm">Select a job to build resume</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted">Template</p>
        {TEMPLATES.map((t) => (
          <label
            key={t.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              template === t.value
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <input
              type="radio"
              name="template"
              value={t.value}
              checked={template === t.value}
              onChange={() => setTemplate(t.value)}
              className="sr-only"
            />
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                template === t.value ? 'border-accent bg-accent' : 'border-border'
              }`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{t.label}</p>
              <p className="text-xs text-muted">{t.description}</p>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={() => onGenerate(template)}
        disabled={!job || loading}
        className="w-full py-2 px-4 rounded-lg bg-accent hover:opacity-90 text-white font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating tailored resume...
          </>
        ) : (
          <>
            <FileText size={16} />
            Generate Resume
          </>
        )}
      </button>

      {result && (
        <div className="space-y-4 pt-2 border-t border-border">
          <KeywordScore
            score={result.keyword_match_score}
            matched={result.matched_keywords}
            missing={result.missing_skills}
          />
          <LatexOutput latex={result.latex_code} onCopy={() => {}} />
        </div>
      )}

      {savedResumes.length > 0 && (
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors w-full"
          >
            {historyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Saved resumes ({savedResumes.length})
          </button>

          {historyOpen && (
            <div className="mt-3 space-y-2">
              {savedResumes.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-background border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {r.job_title ?? 'Untitled'} — {r.company ?? ''}
                    </p>
                    <p className="text-xs text-muted">
                      {r.keyword_match_score != null ? `${r.keyword_match_score}% match · ` : ''}
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
