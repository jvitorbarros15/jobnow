'use client'

import { useState } from 'react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import {
  CalendarCheck,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Mail,
  Inbox,
} from 'lucide-react'
import type { JobApplication } from '@/types/tracker'

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
  follow_up_needed: 'Follow-up Needed',
  unknown: 'Unknown',
}

function statusBadge(status: string) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap'
  if (status === 'offer') return `${base} bg-green/20 text-green border border-green/30`
  if (status === 'rejected' || status === 'ghosted') return `${base} bg-red/20 text-red border border-red/30`
  if (status === 'interview_scheduled' || status === 'interview_completed')
    return `${base} bg-amber/20 text-amber border border-amber/30`
  return `${base} bg-muted/20 text-muted border border-muted/30`
}

function CalendarCell({ app }: { app: JobApplication }) {
  const hasInterview =
    app.status === 'interview_scheduled' || app.status === 'interview_completed' || app.interview_datetime

  if (!hasInterview) return null

  if (app.calendar_event_id) {
    const calUrl = `https://calendar.google.com/calendar/event?eid=${app.calendar_event_id}`
    return (
      <a
        href={calUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View calendar event"
        className="inline-flex text-green hover:text-green/80 transition-colors"
      >
        <CalendarCheck size={16} />
      </a>
    )
  }

  if (app.status === 'interview_scheduled') {
    return (
      <span title="Sync again to create calendar event" className="inline-flex text-amber cursor-help">
        <AlertTriangle size={16} />
      </span>
    )
  }

  return null
}

function InterviewDate({ datetime }: { datetime: string | null }) {
  if (!datetime) return <span className="text-muted/40">—</span>
  try {
    const parsed = parseISO(datetime)
    return (
      <span title={format(parsed, 'PPpp')} className="text-sm">
        <span className="text-white">{format(parsed, 'MMM d')}</span>
        <span className="text-muted ml-1 text-xs">{format(parsed, 'h:mm a')}</span>
      </span>
    )
  } catch {
    return <span className="text-sm text-muted">{datetime}</span>
  }
}

function ApplicationDate({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted/40">—</span>
  try {
    const parsed = parseISO(date)
    return (
      <span title={format(parsed, 'PPP')} className="text-sm text-muted">
        {formatDistanceToNow(parsed, { addSuffix: true })}
      </span>
    )
  } catch {
    return <span className="text-sm text-muted">{date}</span>
  }
}

interface JobTableProps {
  applications: JobApplication[]
  onDelete: (id: string) => void
}

export default function JobTable({ applications, onDelete }: JobTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <Inbox size={48} className="text-muted mb-4 opacity-40" />
        <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
        <p className="text-muted text-sm max-w-sm">
          Click &ldquo;Sync Gmail&rdquo; above to import job applications from your inbox.
        </p>
      </div>
    )
  }

  function handleDeleteClick(id: string) {
    if (confirmDelete === id) {
      onDelete(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Company</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Applied</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Recruiter</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Interview</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Cal</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Next Action</th>
            <th className="text-right py-3 px-3 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app.id}
              className="border-b border-border/50 hover:bg-surface/60 transition-colors"
            >
              <td className="py-3 px-3 font-medium">{app.company ?? <span className="text-muted">—</span>}</td>
              <td className="py-3 px-3 text-muted max-w-[160px] truncate">{app.role ?? '—'}</td>
              <td className="py-3 px-3">
                <span className={statusBadge(app.status)}>
                  {STATUS_LABELS[app.status] ?? app.status}
                </span>
              </td>
              <td className="py-3 px-3">
                <ApplicationDate date={app.date} />
              </td>
              <td className="py-3 px-3 text-muted text-xs max-w-[140px] truncate">
                {app.recruiter_email ?? <span className="opacity-40">—</span>}
              </td>
              <td className="py-3 px-3">
                <InterviewDate datetime={app.interview_datetime} />
              </td>
              <td className="py-3 px-3 text-center">
                <CalendarCell app={app} />
              </td>
              <td className="py-3 px-3 text-muted text-xs max-w-[160px] truncate">
                {app.next_action ?? <span className="opacity-40">—</span>}
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center justify-end gap-2">
                  {app.gmail_thread_url && (
                    <a
                      href={app.gmail_thread_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View Gmail thread"
                      className="text-muted hover:text-accent transition-colors"
                    >
                      <Mail size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteClick(app.id)}
                    title={confirmDelete === app.id ? 'Click again to confirm' : 'Delete'}
                    className={`transition-colors ${
                      confirmDelete === app.id
                        ? 'text-red hover:text-red/80'
                        : 'text-muted hover:text-red'
                    }`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
