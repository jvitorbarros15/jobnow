'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAgentSearch } from '@/lib/contexts/AgentSearchContext'
import JobSearchForm from '@/components/jobs/JobSearchForm'
import JobCard from '@/components/jobs/JobCard'
import ResumeBuilder from '@/components/jobs/ResumeBuilder'
import ManualJobInput from '@/components/jobs/ManualJobInput'
import KeywordScore from '@/components/jobs/KeywordScore'
import LatexOutput from '@/components/jobs/LatexOutput'
import ResumePipelineStatus from '@/components/jobs/ResumePipelineStatus'
import type { JobResult, ResumeTemplate } from '@/types/jobs'

interface ResumeResult {
  resume_id: string | null
  latex_code: string
  keyword_match_score: number
  matched_keywords: string[]
  missing_skills: string[]
  job_category: string
  visa_warning?: boolean
  visa_warning_reason?: string | null
}

interface AgentJobResult {
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
}

interface AgentSearchResult {
  results: AgentJobResult[]
  summary: string
  sources_searched: number
}

export default function JobsPage() {
  const { result: agentResults, loading: agentSearching, startSearch: handleAgentSearch } = useAgentSearch()
  const [searchResults, setSearchResults] = useState<JobResult[]>([])
  const [savedJobs, setSavedJobs] = useState<JobResult[]>([])
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'saved' | 'agent'>('results')
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null)
  const [generatingResume, setGeneratingResume] = useState(false)
  const [resumeResult, setResumeResult] = useState<ResumeResult | null>(null)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [hasSearched, setHasSearched] = useState(false)
  const [manualMode, setManualMode] = useState(true)
  const [manualResumeResult, setManualResumeResult] = useState<ResumeResult | null>(null)
  const [manualLoading, setManualLoading] = useState(false)
  const [manualJobMeta, setManualJobMeta] = useState<{ title: string; company: string; description: string } | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [requestJobMeta, setRequestJobMeta] = useState<{ title: string; company: string; description: string } | null>(null)
  const [requestLoading, setRequestLoading] = useState(false)

  async function handleSearch(query: string, location: string, remote: boolean) {
    setSearching(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({ query, location, remote: String(remote) })
      const res = await fetch(`/api/jobs/search?${params}`)
      const data = await res.json()
      setSearchResults(data.jobs ?? [])
      setActiveTab('results')
    } finally { setSearching(false) }
  }

  function onAgentSearchClick() {
    setHasSearched(true)
    handleAgentSearch()
  }

  async function handleSave(job: JobResult) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (savedJobIds.has(job.id)) {
      await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('id', job.id)
      setSavedJobIds((prev) => { const n = new Set(prev); n.delete(job.id); return n })
      setSavedJobs((prev) => prev.filter((j) => j.id !== job.id))
    } else {
      await supabase.from('saved_jobs').insert({ id: job.id, user_id: user.id, title: job.title, company: job.company, location: job.location, salary: job.salary, source: job.source, url: job.url, posted_at: job.posted_at, description: job.description, ats_keywords: job.ats_keywords })
      setSavedJobIds((prev) => new Set(prev).add(job.id))
      setSavedJobs((prev) => [...prev, job])
    }
  }

  async function handleManualGenerate(company: string, title: string, description: string, template: string) {
    setManualLoading(true)
    setManualJobMeta({ title, company, description })
    try {
      const res = await fetch('/api/jobs/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: description, company_name: company, job_title: title, template }),
      })
      const data = await res.json()
      setManualResumeResult(data)
    } catch (e) { console.error(e) } finally { setManualLoading(false) }
  }

  async function handleRequestGenerate(company: string, title: string, description: string, template: string) {
    setRequestLoading(true)
    setRequestJobMeta({ title, company, description })
    try {
      const res = await fetch('/api/jobs/resume-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: title, company, job_description: description, template }),
      })
      const data = await res.json()
      if (data.request) setRequestId(data.request.id)
    } catch (e) { console.error(e) } finally { setRequestLoading(false) }
  }

  async function handleGenerate(template: ResumeTemplate) {
    if (!selectedJob) return
    setGeneratingResume(true)
    setResumeResult(null)
    try {
      const res = await fetch('/api/jobs/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: selectedJob.description, template, job_id: selectedJob.id }),
      })
      const data = await res.json()
      setResumeResult(data)
    } finally { setGeneratingResume(false) }
  }

  async function handleSearchRequestGenerate(template: ResumeTemplate) {
    if (!selectedJob) return
    setRequestLoading(true)
    setRequestJobMeta({ title: selectedJob.title, company: selectedJob.company, description: selectedJob.description })
    try {
      const res = await fetch('/api/jobs/resume-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: selectedJob.title,
          company: selectedJob.company,
          job_description: selectedJob.description,
          template,
        }),
      })
      const data = await res.json()
      if (data.request) setRequestId(data.request.id)
    } catch (e) { console.error(e) } finally { setRequestLoading(false) }
  }

  const displayedJobs = activeTab === 'results' ? searchResults : savedJobs

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text tracking-tight">Jobs & Resume</h1>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-0 border-b border-border">
        {([['paste', 'Paste Job Description'], ['search', 'Search Jobs']] as const).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setManualMode(mode === 'paste')}
            className={`px-4 py-2.5 text-xs font-sans font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              (mode === 'paste') === manualMode
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {manualMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <ManualJobInput
              onGenerate={handleManualGenerate}
              onRequestGenerate={handleRequestGenerate}
              loading={manualLoading || requestLoading}
            />
          </div>
          <div className="lg:col-span-2 space-y-4">
            {requestId ? (
              <ResumePipelineStatus
                requestId={requestId}
                jobMeta={requestJobMeta}
                onReset={() => { setRequestId(null); setRequestJobMeta(null) }}
              />
            ) : (
              <>
                {manualResumeResult?.visa_warning && (
                  <div className="border border-red/30 p-4 flex gap-3">
                    <AlertTriangle size={15} className="text-red flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-sans font-semibold text-red">Visa sponsorship likely not available</p>
                      {manualResumeResult.visa_warning_reason && (
                        <p className="text-xs font-sans text-muted mt-1">{manualResumeResult.visa_warning_reason}</p>
                      )}
                    </div>
                  </div>
                )}
                {manualResumeResult && (
                  <div className="space-y-6">
                    <KeywordScore
                      score={manualResumeResult.keyword_match_score}
                      matched={manualResumeResult.matched_keywords}
                      missing={manualResumeResult.missing_skills}
                    />
                    <LatexOutput
                      latex={manualResumeResult.latex_code}
                      onCopy={() => {}}
                      jobMeta={manualJobMeta ?? undefined}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <JobSearchForm onSearch={handleSearch} loading={searching} />
            <button
              onClick={onAgentSearchClick}
              disabled={agentSearching}
              className="btn-primary w-full py-2 px-4 text-sm flex items-center justify-center gap-2"
            >
              {agentSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Searching all sources...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  AI-Powered Search (All Sources)
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex gap-0 border-b border-border">
                {(['results', 'saved', 'agent'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-xs font-sans font-medium capitalize whitespace-nowrap transition-all border-b-2 -mb-px ${
                      activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
                    }`}
                  >
                    {tab === 'agent' ? (
                      <>
                        <Sparkles size={12} className="inline mr-1" />
                        AI Results
                      </>
                    ) : tab}
                    {tab === 'results' && searchResults.length > 0 && (
                      <span className="ml-2 font-mono text-[10px] text-muted">{searchResults.length}</span>
                    )}
                    {tab === 'agent' && agentResults?.results.length ? (
                      <span className="ml-2 font-mono text-[10px] text-muted">{agentResults.results.length}</span>
                    ) : null}
                  </button>
                ))}
              </div>

              {activeTab === 'agent' ? (
                agentSearching ? (
                  <div className="space-y-4">
                    <div className="panel p-6 text-center">
                      <Loader2 size={24} className="animate-spin mx-auto mb-3 text-accent" />
                      <p className="text-sm text-text">Searching all sources...</p>
                      <p className="text-xs text-muted mt-2">This may take a few minutes</p>
                    </div>
                  </div>
                ) : agentResults?.results.length ? (
                  <div className="space-y-4">
                    <div className="panel p-4 bg-accent/10 border-l-2 border-accent">
                      <p className="text-xs text-text font-medium">{agentResults.summary}</p>
                      <p className="text-xs text-muted mt-2">Searched {agentResults.sources_searched} sources</p>
                    </div>
                    {agentResults.results.map((job) => (
                      <a
                        key={job.id}
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="panel p-4 block hover:bg-white/[0.03] transition-colors border-l-2 border-accent/40"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-text">{job.title}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">{job.fit_score}/10</span>
                            </div>
                            <p className="text-xs text-muted mb-2">{job.company} • {job.location}</p>
                            <p className="text-xs text-text/80 mb-2">{job.fit_summary}</p>
                            <div className="flex gap-1 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05]">
                                {job.source}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                job.sponsorship_status === 'confirmed' ? 'bg-green/20 text-green' :
                                job.sponsorship_status === 'likely' ? 'bg-cyan/20 text-cyan' :
                                job.sponsorship_status === 'no' ? 'bg-red/20 text-red' :
                                'bg-white/[0.05]'
                              }`}>
                                Sponsorship: {job.sponsorship_status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-sans text-muted py-16 text-center">
                    Run AI-powered search to see results from all sources
                  </p>
                )
              ) : searching ? (
                <div className="space-y-0">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 border-b border-border animate-pulse bg-surface/30" />
                  ))}
                </div>
              ) : displayedJobs.length > 0 ? (
                <div>
                  {displayedJobs.map((job) => (
                    <JobCard key={job.id} job={job} onSave={() => handleSave(job)} onBuildResume={() => { setSelectedJob(job); setResumeResult(null) }} saved={savedJobIds.has(job.id)} />
                  ))}
                </div>
              ) : (
                <p className="text-xs font-sans text-muted py-16 text-center">
                  {activeTab === 'saved' ? 'No saved jobs' : hasSearched ? 'No results found' : 'Search for jobs above'}
                </p>
              )}
            </div>
            <div className="lg:col-span-2">
              {requestId ? (
                <ResumePipelineStatus
                  requestId={requestId}
                  jobMeta={requestJobMeta}
                  onReset={() => { setRequestId(null); setRequestJobMeta(null) }}
                />
              ) : (
                <ResumeBuilder
                  job={selectedJob}
                  onGenerate={handleGenerate}
                  onRequestGenerate={handleSearchRequestGenerate}
                  loading={generatingResume || requestLoading}
                  result={resumeResult}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
