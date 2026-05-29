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
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-all hover:bg-surface-2/10 group focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 font-mono text-xs">
          <span className={`font-semibold ${accentClass}`}>{slotLabel}</span>
          <span className="text-muted/60">·</span>
          <span className="text-[#171412] font-medium">{formatDate(date)}</span>
          <span className="text-muted/60">·</span>
          <span className="text-muted text-[10px] tracking-wide">{labelText}</span>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-muted transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''} group-hover:text-accent`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border/30 pt-4 bg-surface-2/5">
          <div className="text-sm leading-7 text-[#2d2a27] whitespace-pre-wrap overflow-x-auto font-sans">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
