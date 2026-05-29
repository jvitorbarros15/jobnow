'use client'

import { useState } from 'react'
import { Loader2, FileText } from 'lucide-react'
import type { ResumeTemplate } from '@/types/jobs'

interface ManualJobInputProps {
  onGenerate: (company: string, title: string, description: string, template: string) => void
  loading: boolean
}

const TEMPLATES: { value: ResumeTemplate; label: string; sub: string }[] = [
  { value: 'classic_ats', label: 'Classic ATS', sub: 'Big tech, enterprise' },
  { value: 'modern_clean', label: 'Modern Clean', sub: 'Startups, Series A–B' },
  { value: 'research_academic', label: 'Research', sub: 'Research, PhD programs' },
  { value: 'blockchain_web3', label: 'Blockchain / Web3', sub: 'Crypto, L2, protocol' },
]

export default function ManualJobInput({ onGenerate, loading }: ManualJobInputProps) {
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState<ResumeTemplate>('classic_ats')

  const canSubmit = company.trim() && title.trim() && description.trim() && !loading

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-2">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Coinbase"
            className="w-full px-0 py-2 bg-transparent border-b border-border text-[#1c1a18] text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-2">Role</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Software Engineer"
            className="w-full px-0 py-2 bg-transparent border-b border-border text-[#1c1a18] text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors"
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
          className="w-full px-0 py-2 bg-transparent border-b border-border text-[#1c1a18] text-sm font-sans leading-relaxed placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

      <div>
        <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-muted mb-3">Template</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTemplate(t.value)}
              className={`text-left p-3 border transition-colors ${
                template === t.value
                  ? 'border-accent bg-accent/5 text-[#1c1a18]'
                  : 'border-border text-muted hover:border-border/80 hover:text-[#1c1a18]'
              }`}
            >
              <p className="text-xs font-sans font-medium">{t.label}</p>
              <p className="text-[10px] font-sans text-muted mt-0.5">{t.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onGenerate(company.trim(), title.trim(), description.trim(), template)}
        disabled={!canSubmit}
        className="w-full py-3 bg-accent text-black text-sm font-semibold font-sans flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 size={15} className="animate-spin" /> Generating resume…</>
        ) : (
          <><FileText size={15} /> Generate Resume</>
        )}
      </button>
    </div>
  )
}
