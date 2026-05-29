'use client'

import { ChevronDown } from 'lucide-react'

interface DigestEntryProps {
  slot: 'morning' | 'afternoon'
  date: string        // ISO date string e.g. "2026-05-27"
  content: string
  open: boolean
  onToggle: () => void
  accentClass: string // "text-accent" or "text-green"
  labelText: string   // "Morning" or "Afternoon"
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DigestEntry({
  slot, date, content, open, onToggle, accentClass, labelText
}: DigestEntryProps) {
  const slotLabel = slot === 'morning' ? '08:00' : '16:00'

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2.5 px-0 cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={`font-semibold ${accentClass}`}>{slotLabel}</span>
          <span className="text-muted">·</span>
          <span className="text-[#171412]">{formatDate(date)}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">{labelText} digest</span>
        </div>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <pre className="pb-4 text-[11px] font-mono leading-relaxed text-[#2d2a27] whitespace-pre-wrap overflow-x-auto">
          {content}
        </pre>
      )}
    </div>
  )
}
