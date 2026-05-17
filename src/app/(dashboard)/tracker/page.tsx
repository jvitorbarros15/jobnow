'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox, Calendar, Star, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/tracker/StatsCard'
import SyncButton from '@/components/tracker/SyncButton'
import JobTable from '@/components/tracker/JobTable'
import type { JobApplication } from '@/types/tracker'

type Toast = { type: 'success' | 'error'; message: string }

export default function TrackerPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const supabase = createClient()

  const fetchApplications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setApplications(data as JobApplication[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  function handleSyncStart() {
    // optimistic — nothing to do
  }

  function handleSyncComplete(result: { synced: number; calendar_events_created: number }) {
    setLastSynced(new Date())
    const msg =
      result.calendar_events_created > 0
        ? `Synced ${result.synced} application${result.synced !== 1 ? 's' : ''}, ${result.calendar_events_created} calendar event${result.calendar_events_created !== 1 ? 's' : ''} created`
        : `Synced ${result.synced} new application${result.synced !== 1 ? 's' : ''}`
    showToast('success', msg)
    fetchApplications()
  }

  function handleSyncError(msg: string) {
    showToast('error', msg)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) {
      showToast('error', 'Failed to delete application')
    } else {
      setApplications((prev) => prev.filter((a) => a.id !== id))
    }
  }

  const totalApplications = applications.filter((a) => a.status !== 'unknown').length
  const totalInterviews = applications.filter(
    (a) => a.status === 'interview_scheduled' || a.status === 'interview_completed'
  ).length
  const totalOffers = applications.filter((a) => a.status === 'offer').length

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-surface border-green/40 text-white'
              : 'bg-surface border-red/40 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={16} className="text-green flex-shrink-0" />
          ) : (
            <XCircle size={16} className="text-red flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Job Tracker</h1>
          <p className="text-muted">Monitor your job applications and interviews</p>
          <p className="text-xs text-muted/60 mt-1">
            {lastSynced
              ? `Last synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}`
              : 'Never synced'}
          </p>
        </div>
        <div className="flex-shrink-0">
          <SyncButton
            onSyncComplete={handleSyncComplete}
            onError={handleSyncError}
            onSyncStart={handleSyncStart}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard icon={Inbox} label="Applications" value={totalApplications} />
        <StatsCard icon={Calendar} label="Interviews" value={totalInterviews} />
        <StatsCard icon={Star} label="Offers" value={totalOffers} />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Applications</h2>
          {applications.length > 0 && (
            <span className="text-xs text-muted">
              {applications.length} record{applications.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-4 py-3 border-t border-border/50 items-center"
              >
                <div className="h-4 bg-border/50 rounded w-24 animate-pulse" />
                <div className="h-4 bg-border/50 rounded w-20 animate-pulse" />
                <div className="h-4 bg-border/50 rounded w-16 animate-pulse" />
                <div className="h-4 bg-border/50 rounded w-16 animate-pulse" />
                <div className="h-4 bg-border/50 rounded w-12 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <JobTable applications={applications} onDelete={handleDelete} />
        )}
      </div>
    </div>
  )
}
