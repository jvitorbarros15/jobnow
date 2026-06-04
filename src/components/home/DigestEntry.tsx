'use client'

import { ChevronDown, Trash2 } from 'lucide-react'

interface DigestEntryProps {
  slot: 'morning' | 'afternoon'
  date: string        // ISO date string e.g. "2026-05-27"
  content: string
  open: boolean
  onToggle: () => void
  onDelete: () => void
  accentClass: string // "text-accent" or "text-green"
  labelText: string   // "Morning" or "Afternoon"
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DigestEntry({
  slot, date, content, open, onToggle, onDelete, accentClass, labelText
}: DigestEntryProps) {
  const slotLabel = slot === 'morning' ? '08:00' : '16:00'

  return (
    <div>
      <div className="w-full flex items-center justify-between px-4 py-3 transition-all hover:bg-white/[0.03] group">
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex-1 flex items-center gap-2.5 font-mono text-xs text-left cursor-pointer rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <span className={`font-semibold ${accentClass}`}>{slotLabel}</span>
          <span className="text-muted/60">·</span>
          <span className="text-text font-medium">{formatDate(date)}</span>
          <span className="text-muted/60">·</span>
          <span className="text-muted text-[10px] tracking-wide">{labelText}</span>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0 pl-3">
          <button
            onClick={onDelete}
            aria-label="Delete digest"
            className="text-red-400/50 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded-sm p-1 cursor-pointer"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
          <button
            onClick={onToggle}
            aria-label={open ? 'Collapse digest' : 'Expand digest'}
            className="cursor-pointer focus:outline-none"
          >
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''} group-hover:text-accent`}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-glass-border pt-4 bg-white/[0.02]">
          <div className="text-sm leading-7 text-muted whitespace-pre-wrap overflow-x-auto font-sans">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
