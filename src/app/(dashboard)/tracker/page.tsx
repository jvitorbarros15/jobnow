'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import JobTable from '@/components/tracker/JobTable'
import type { JobApplication } from '@/types/tracker'

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

  useEffect(() => { fetchApplications() }, [fetchApplications])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) showToast('error', 'Failed to delete')
    else setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  const active       = applications.filter((a) => a.status !== 'unknown')
  const interviews   = applications.filter((a) => a.status === 'interview_scheduled' || a.status === 'interview_completed')
  const offers       = applications.filter((a) => a.status === 'offer')
  const rejected     = applications.filter((a) => a.status === 'rejected' || a.status === 'ghosted')

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 border rounded-lg text-sm font-sans shadow-lg ${
          toast.type === 'success' ? 'bg-surface border-green/25 text-[#171412]' : 'bg-surface border-red/25 text-[#171412]'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle size={13} className="text-green flex-shrink-0" />
            : <XCircle    size={13} className="text-red   flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-baseline justify-between opacity-0"
        style={{ animation: 'fadeInUp 0.35s ease 0ms forwards' }}
      >
        <h1 className="font-display text-2xl font-bold text-[#171412] tracking-tight">Job Tracker</h1>
        {!loading && active.length > 0 && (
          <div className="flex items-center gap-2.5 text-xs font-mono text-muted">
            <span>
              <span className="font-semibold text-[#171412]">{active.length}</span>
              <span className="ml-1">applied</span>
            </span>
            {interviews.length > 0 && (
              <>
                <span className="text-border select-none">·</span>
                <span>
                  <span className="font-semibold text-accent">{interviews.length}</span>
                  <span className="ml-1">interviewing</span>
                </span>
              </>
            )}
            {offers.length > 0 && (
              <>
                <span className="text-border select-none">·</span>
                <span>
                  <span className="font-semibold text-green">{offers.length}</span>
                  <span className="ml-1">{offers.length === 1 ? 'offer' : 'offers'}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div
        className="opacity-0"
        style={{ animation: 'fadeInUp 0.35s ease 80ms forwards' }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-sans uppercase tracking-widest text-muted font-medium">Applications</p>
          {applications.length > 0 && (
            <span className="font-mono text-xs text-muted">{applications.length}</span>
          )}
        </div>

        {loading ? (
          <div className="border-t border-border">
            {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} delay={i * 50} />)}
          </div>
        ) : (
          <JobTable applications={applications} onDelete={handleDelete} />
        )}
      </div>
    </div>
  )
}
