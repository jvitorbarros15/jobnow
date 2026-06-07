'use client'

import { useState } from 'react'
import { Loader2, FileText, Link, Sparkles } from 'lucide-react'
import type { ResumeTemplate } from '@/types/jobs'

interface ManualJobInputProps {
  onGenerate: (company: string, title: string, description: string, template: string) => void
  onRequestGenerate: (company: string, title: string, description: string, template: string) => void
  loading: boolean
}

const TEMPLATES: { value: ResumeTemplate; label: string; sub: string }[] = [
  { value: 'classic_ats', label: 'Classic ATS', sub: 'Big tech, enterprise' },
  { value: 'modern_clean', label: 'Modern Clean', sub: 'Startups, Series A–B' },
  { value: 'research_academic', label: 'Research', sub: 'Research, PhD programs' },
  { value: 'blockchain_web3', label: 'Blockchain / Web3', sub: 'Crypto, L2, protocol' },
]

export default function ManualJobInput({ onGenerate, onRequestGenerate, loading }: ManualJobInputProps) {
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState<ResumeTemplate>('classic_ats')
  const [url, setUrl] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const canSubmit = company.trim() && title.trim() && description.trim() && !loading

  async function handleFetchUrl() {
    if (!url.trim()) return
    setFetchingUrl(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/jobs/fetch-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setFetchError(data.error || 'Failed to fetch'); return }
      if (data.title) setTitle(data.title)
      if (data.company) setCompany(data.company)
      if (data.description) setDescription(data.description)
    } catch { setFetchError('Network error') } finally { setFetchingUrl(false) }
  }

  return (
    <div className="space-y-6">
      {/* URL fetch */}
      <div>
        <label className="block text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-2">Fetch from URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
            placeholder="https://jobs.lever.co/company/job-id"
            className="flex-1 px-0 py-2 bg-transparent border-b border-glass-border text-text text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleFetchUrl}
            disabled={fetchingUrl || !url.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans text-muted border border-glass-border hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
          >
            {fetchingUrl ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
            Fetch
          </button>
        </div>
        {fetchError && <p className="text-[10px] font-sans text-red mt-1">{fetchError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-2">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Coinbase"
            className="w-full px-0 py-2 bg-transparent border-b border-glass-border text-text text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-2">Role</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Software Engineer"
            className="w-full px-0 py-2 bg-transparent border-b border-glass-border text-text text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-2">Job description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={14}
          placeholder="Paste the full job description here..."
          className="w-full px-0 py-2 bg-transparent border-b border-glass-border text-text text-sm font-sans leading-relaxed placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

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
          onClick={() => onRequestGenerate(company.trim(), title.trim(), description.trim(), template)}
          disabled={!canSubmit}
          className="btn-primary flex-1 py-3 text-sm"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Saving request…</>
          ) : (
            <><Sparkles size={15} /> Generate Resume (Agent)</>
          )}
        </button>
        <button
          onClick={() => onGenerate(company.trim(), title.trim(), description.trim(), template)}
          disabled={!canSubmit}
          className="btn-ghost px-4 py-3 text-sm"
          title="Rule-based (fast, no AI)"
        >
          <FileText size={15} />
        </button>
      </div>
    </div>
  )
}
