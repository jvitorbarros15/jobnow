'use client'

import { useState } from 'react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { CalendarCheck, AlertTriangle, ExternalLink, Trash2, Mail, Inbox } from 'lucide-react'
import type { JobApplication } from '@/types/tracker'

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  interview_scheduled: 'Interview',
  interview_completed: 'Interviewed',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
  follow_up_needed: 'Follow-up',
  unknown: 'Unknown',
}

function statusBadge(status: string): string {
  if (status === 'offer') return 'bg-green/20 text-green'
  if (status === 'rejected' || status === 'ghosted') return 'bg-red/20 text-red'
  if (status === 'interview_scheduled' || status === 'interview_completed') return 'bg-accent/20 text-accent'
  if (status === 'follow_up_needed') return 'bg-amber/20 text-amber'
  if (status === 'applied') return 'bg-accent-2/20 text-accent-2'
  return 'bg-surface-2 text-muted'
}

function CalendarCell({ app }: { app: JobApplication }) {
  const hasInterview = app.status === 'interview_scheduled' || app.status === 'interview_completed' || app.interview_datetime
  if (!hasInterview) return null
  if (app.calendar_event_id) {
    return (
      <a href={`https://calendar.google.com/calendar/event?eid=${app.calendar_event_id}`} target="_blank" rel="noopener noreferrer" className="text-green hover:opacity-70 transition-opacity">
        <CalendarCheck size={14} />
      </a>
    )
  }
  if (app.status === 'interview_scheduled') {
    return <span className="text-accent-2"><AlertTriangle size={14} /></span>
  }
  return null
}

function InterviewDate({ datetime }: { datetime: string | null }) {
  if (!datetime) return <span className="text-muted/30">—</span>
  try {
    const parsed = parseISO(datetime)
    return (
      <span>
        <span className="text-text font-mono text-xs">{format(parsed, 'MMM d')}</span>
        <span className="text-muted font-mono text-xs ml-1">{format(parsed, 'h:mm a')}</span>
      </span>
    )
  } catch { return <span className="text-muted text-xs font-mono">{datetime}</span> }
}

function ApplicationDate({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted/30">—</span>
  try {
    const parsed = parseISO(date)
    return <span className="font-mono text-xs text-muted">{formatDistanceToNow(parsed, { addSuffix: true })}</span>
  } catch { return <span className="font-mono text-xs text-muted">{date}</span> }
}

interface JobTableProps {
  applications: JobApplication[]
  onDelete: (id: string) => void
}

export default function JobTable({ applications, onDelete }: JobTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24">
        <Inbox size={32} className="text-muted mb-4 opacity-30" />
        <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-muted">No applications yet</p>
        <p className="text-muted text-sm mt-2 max-w-xs">Click <span className="text-accent-2 font-semibold">+ Add</span> above to log your first application, or paste a Simplify URL to import one.</p>
      </div>
    )
  }

  function handleDeleteClick(id: string) {
    if (confirmDelete === id) { onDelete(id); setConfirmDelete(null) }
    else { setConfirmDelete(id); setTimeout(() => setConfirmDelete(null), 3000) }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-border">
            {['Company', 'Role', 'Status', 'Applied', 'Recruiter', 'Interview', 'Cal', 'Next Action', ''].map((h) => (
              <th key={h} className="text-left py-2.5 px-4 text-[10px] font-sans font-medium text-muted uppercase tracking-widest first:pl-0 last:text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {applications.map((app, index) => (
            <tr
              key={app.id}
              className="border-b border-border/40 hover:bg-white/[0.03] transition-colors duration-150 group opacity-0"
              style={{ animation: `fadeInUp 0.3s ease ${index * 35}ms forwards` }}
            >
              <td className="py-2.5 px-4 pl-0 font-semibold text-text text-sm">{app.company ?? <span className="text-muted">—</span>}</td>
              <td className="py-2.5 px-4 text-muted text-xs max-w-[160px] truncate">{app.role ?? '—'}</td>
              <td className="py-2.5 px-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold tracking-wide ${statusBadge(app.status)}`}>
                  {STATUS_LABELS[app.status] ?? app.status}
                </span>
              </td>
              <td className="py-2.5 px-4"><ApplicationDate date={app.date} /></td>
              <td className="py-3.5 px-4 text-muted text-xs max-w-[140px] truncate font-mono">{app.recruiter_email ?? <span className="opacity-30">—</span>}</td>
              <td className="py-2.5 px-4"><InterviewDate datetime={app.interview_datetime} /></td>
              <td className="py-2.5 px-4"><CalendarCell app={app} /></td>
              <td className="py-3.5 px-4 text-muted text-xs max-w-[160px] truncate">{app.next_action ?? <span className="opacity-30">—</span>}</td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {app.gmail_thread_url && (
                    <a href={app.gmail_thread_url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent transition-colors">
                      <Mail size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteClick(app.id)}
                    className={`transition-colors cursor-pointer p-1 rounded ${confirmDelete === app.id ? 'text-red-500' : 'text-red-400/50 hover:text-red-500'}`}
                  >
                    <Trash2 size={18} />
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
