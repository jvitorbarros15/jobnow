'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Briefcase, Calendar, Award, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import JobTable from '@/components/tracker/JobTable'
import StatsCard from '@/components/tracker/StatsCard'
import AddApplicationForm from '@/components/tracker/AddApplicationForm'
import AgentSearchPanel from '@/components/tracker/AgentSearchPanel'
import AgentSearchHistory from '@/components/tracker/AgentSearchHistory'
import FreshJobPicksPanel from '@/components/tracker/FreshJobPicksPanel'
import type { JobApplication } from '@/types/tracker'
import type { AgentSearchResult } from '@/types/jobs'

type Toast = { type: 'success' | 'error'; message: string }

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      className="h-12 border-b border-border flex items-center gap-6 opacity-0"
      style={{ animation: `fadeInUp 0.25s ease ${delay}ms forwards` }}
    >
      <div className="h-3 rounded bg-surface-2 animate-pulse w-24" />
      <div className="h-3 rounded bg-surface-2 animate-pulse w-40" />
      <div className="h-4 rounded bg-surface-2 animate-pulse w-14" />
      <div className="h-3 rounded bg-surface-2 animate-pulse w-16 ml-auto" />
    </div>
  )
}

export default function TrackerPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)
  const [agentSearch, setAgentSearch] = useState<AgentSearchResult | null>(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchApplications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    if (!error && data) setApplications(data as JobApplication[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchApplications()
    // Fetch last agent search result
    fetch('/api/jobs/agent-search')
      .then(r => r.json())
      .then(data => {
        if (data.result) setAgentSearch(data.result)
      })
      .catch(() => {})
  }, [fetchApplications])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) showToast('error', 'Failed to delete')
    else setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  const handleRunAgentSearch = async () => {
    setAgentLoading(true)
    setAgentError(null)
    try {
      const response = await fetch('/api/jobs/agent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || 'Search failed')
    }
      const data = await response.json()
      setAgentSearch(data.result)
      showToast('success', 'Search complete! Check the picks on the right.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setAgentError(message)
      showToast('error', `Search failed: ${message}`)
    } finally {
      setAgentLoading(false)
    }
  }

  const stats = {
    active: applications.filter(a => a.status !== 'unknown').length,
    interviews: applications.filter(a =>
      a.status === 'interview_scheduled' || a.status === 'interview_completed'
    ).length,
    offers: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a =>
      a.status === 'rejected' || a.status === 'ghosted'
    ).length,
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 border rounded-lg text-sm font-sans shadow-lg ${
          toast.type === 'success' ? 'bg-surface border-green/25 text-text' : 'bg-surface border-red/25 text-text'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle size={13} className="text-green flex-shrink-0" />
            : <XCircle    size={13} className="text-red   flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header Section */}
      <div
        className="opacity-0"
        style={{ animation: 'fadeInUp 0.35s ease 0ms forwards' }}
      >
        <div className="mb-1">
          <h1 className="text-3xl font-bold text-text font-display tracking-tight">Job Tracker</h1>
        </div>
        <p className="text-sm text-accent-2">Track applications, interview status, and AI-powered job matches</p>
      </div>

      {/* Stats Row */}
      <div className="opacity-0 grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ animation: 'fadeInUp 0.35s ease 60ms forwards' }}>
        <div className="panel panel-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={18} className="text-accent-2" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Active</span>
          </div>
          <div className="text-2xl font-bold text-text">{stats.active}</div>
        </div>
        <div className="panel panel-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-accent-2" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Interviewing</span>
          </div>
          <div className="text-2xl font-bold text-text">{stats.interviews}</div>
        </div>
        <div className="panel panel-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-green" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Offers</span>
          </div>
          <div className="text-2xl font-bold text-text">{stats.offers}</div>
        </div>
        <div className="panel panel-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-red" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Rejected</span>
          </div>
          <div className="text-2xl font-bold text-text">{stats.rejected}</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="opacity-0 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6" style={{ animation: 'fadeInUp 0.35s ease 120ms forwards' }}>
        {/* Left Panel: Job Table */}
        <div className="panel">
          <AddApplicationForm
            onSuccess={(newApp) => {
              setApplications((prev) => [newApp, ...prev])
            }}
          />
          <div className="border-t border-border">
            {loading ? (
              <div>
                {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} delay={i * 50} />)}
              </div>
            ) : (
              <JobTable applications={applications} onDelete={handleDelete} />
            )}
          </div>
        </div>

        {/* Right Panel: Agent Search */}
        <div className="space-y-4">
          <FreshJobPicksPanel />
          <AgentSearchPanel
            result={agentSearch}
            loading={agentLoading}
            error={agentError}
            onRunSearch={handleRunAgentSearch}
            onJobSaved={fetchApplications}
          />
          <AgentSearchHistory />
        </div>
      </div>
    </div>
  )
}
