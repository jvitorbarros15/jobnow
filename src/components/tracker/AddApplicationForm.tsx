'use client'

import { useState } from 'react'
import { ChevronUp } from 'lucide-react'
import type { JobApplication } from '@/types/tracker'

interface AddApplicationFormProps {
  onSuccess: (app: JobApplication) => void
}

export default function AddApplicationForm({ onSuccess }: AddApplicationFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)

  const [formData, setFormData] = useState({
    simplifyUrl: '',
    company: '',
    role: '',
    status: 'applied' as const,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())

  async function handleFetchSimplify() {
    if (!formData.simplifyUrl.trim()) return

    setFetchLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/jobs/simplify-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.simplifyUrl }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to fetch')
      }

      const data = await res.json()
      setFormData(prev => ({
        ...prev,
        company: data.company || prev.company,
        role: data.role || prev.role,
      }))

      const filled = new Set<string>()
      if (data.company) filled.add('company')
      if (data.role) filled.add('role')
      setAutoFilledFields(filled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed')
    } finally {
      setFetchLoading(false)
    }
  }

  async function handleSubmit() {
    if (!formData.company || !formData.role) {
      setError('Company and Role are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: formData.company,
          role: formData.role,
          status: formData.status,
          date: formData.date,
          notes: formData.notes,
          gmail_thread_url: formData.simplifyUrl || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save')
      }

      const newApp = await res.json()
      onSuccess(newApp)
      setIsExpanded(false)
      setFormData({
        simplifyUrl: '',
        company: '',
        role: '',
        status: 'applied',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setAutoFilledFields(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-0">
      {/* Header with toggle button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide font-display">
          {isExpanded ? 'Add Application' : 'New Application'}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs text-accent-2 hover:text-accent transition-colors"
        >
          {isExpanded ? '✕ Cancel' : '+ Add'}
          {isExpanded && <ChevronUp size={14} />}
        </button>
      </div>

      {/* Expanded form */}
      {isExpanded && (
        <div className="bg-surface-2/30 border-b border-border p-4 space-y-4">
          {/* Simplify URL */}
          <div>
            <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-2">
              Simplify URL <span className="text-muted/50">(optional — auto-fills fields)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.simplifyUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, simplifyUrl: e.target.value }))}
                placeholder="https://simplify.jobs/p/..."
                className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
              />
              <button
                onClick={handleFetchSimplify}
                disabled={fetchLoading || !formData.simplifyUrl.trim()}
                className="px-4 py-2 bg-accent-2/20 text-accent-2 rounded-md text-sm font-medium hover:bg-accent-2/30 disabled:opacity-50 transition-colors"
              >
                {fetchLoading ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
          </div>

          {/* Company & Role (2-col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className={`w-full bg-surface border rounded-md px-3 py-2 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors ${
                  autoFilledFields.has('company') ? 'border-accent/50' : 'border-border'
                }`}
                placeholder="e.g., Vercel"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className={`w-full bg-surface border rounded-md px-3 py-2 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors ${
                  autoFilledFields.has('role') ? 'border-accent/50' : 'border-border'
                }`}
                placeholder="e.g., Software Engineer"
              />
            </div>
          </div>

          {/* Status & Date (2-col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
              >
                <option value="applied">Applied</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interview_completed">Interview Completed</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="ghosted">Ghosted</option>
                <option value="follow_up_needed">Follow-up Needed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-2">
                Date Applied
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-2">
              Notes <span className="text-muted/50">(optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/50 resize-none"
              rows={2}
              placeholder="Any notes about this application"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red bg-red/10 border border-red/20 rounded-md p-2">
              {error}
            </div>
          )}

          {/* Auto-filled hint */}
          {autoFilledFields.size > 0 && (
            <div className="text-xs text-accent-2">↑ Blue borders indicate fields auto-filled from Simplify</div>
          )}

          {/* Submit button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-accent text-white rounded-md text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save Application'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
