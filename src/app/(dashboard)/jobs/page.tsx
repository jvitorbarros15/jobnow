'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import JobSearchForm from '@/components/jobs/JobSearchForm'
import JobCard from '@/components/jobs/JobCard'
import ResumeBuilder from '@/components/jobs/ResumeBuilder'
import type { JobResult, ResumeTemplate } from '@/types/jobs'

interface ResumeResult {
  resume_id: string | null
  latex_code: string
  keyword_match_score: number
  matched_keywords: string[]
  missing_skills: string[]
  job_category: string
}

export default function JobsPage() {
  const [searchResults, setSearchResults] = useState<JobResult[]>([])
  const [savedJobs, setSavedJobs] = useState<JobResult[]>([])
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'saved'>('results')
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null)
  const [generatingResume, setGeneratingResume] = useState(false)
  const [resumeResult, setResumeResult] = useState<ResumeResult | null>(null)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(query: string, location: string, remote: boolean) {
    setSearching(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({ query, location, remote: String(remote) })
      const res = await fetch(`/api/jobs/search?${params}`)
      const data = await res.json()
      setSearchResults(data.jobs ?? [])
      setActiveTab('results')
    } finally {
      setSearching(false)
    }
  }

  async function handleSave(job: JobResult) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (savedJobIds.has(job.id)) {
      await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('id', job.id)
      setSavedJobIds((prev) => {
        const next = new Set(prev)
        next.delete(job.id)
        return next
      })
      setSavedJobs((prev) => prev.filter((j) => j.id !== job.id))
    } else {
      await supabase.from('saved_jobs').insert({
        id: job.id,
        user_id: user.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        source: job.source,
        url: job.url,
        posted_at: job.posted_at,
        description: job.description,
        ats_keywords: job.ats_keywords,
      })
      setSavedJobIds((prev) => new Set(prev).add(job.id))
      setSavedJobs((prev) => [...prev, job])
    }
  }

  async function handleGenerate(template: ResumeTemplate) {
    if (!selectedJob) return
    setGeneratingResume(true)
    setResumeResult(null)
    try {
      const res = await fetch('/api/jobs/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: selectedJob.description,
          template,
          job_id: selectedJob.id,
        }),
      })
      const data = await res.json()
      setResumeResult(data)
    } finally {
      setGeneratingResume(false)
    }
  }

  const displayedJobs = activeTab === 'results' ? searchResults : savedJobs

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-1">Jobs & Resume</h1>
        <p className="text-muted">Find roles and generate tailored resumes</p>
      </div>

      <JobSearchForm onSearch={handleSearch} loading={searching} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-1 border-b border-border">
            {(['results', 'saved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-white'
                }`}
              >
                {tab}
                {tab === 'results' && searchResults.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent">
                    {searchResults.length}
                  </span>
                )}
                {tab === 'saved' && savedJobs.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent">
                    {savedJobs.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {searching ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-surface rounded-lg h-32 border border-border" />
              ))}
            </div>
          ) : displayedJobs.length > 0 ? (
            <div className="space-y-3">
              {displayedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSave={() => handleSave(job)}
                  onBuildResume={() => {
                    setSelectedJob(job)
                    setResumeResult(null)
                  }}
                  saved={savedJobIds.has(job.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
              {activeTab === 'saved' ? (
                <p>No saved jobs yet</p>
              ) : hasSearched ? (
                <p>No jobs found. Try different keywords or location.</p>
              ) : (
                <p>Search for jobs above to get started</p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <ResumeBuilder
            job={selectedJob}
            onGenerate={handleGenerate}
            loading={generatingResume}
            result={resumeResult}
          />
        </div>
      </div>
    </div>
  )
}
