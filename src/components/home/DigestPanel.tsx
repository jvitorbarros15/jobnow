'use client'

import { useState } from 'react'
import DigestEntry from './DigestEntry'

interface Digest {
  id: string
  slot: 'morning' | 'afternoon'
  date: string
  content: string
}

interface DigestPanelProps {
  label: string
  type: 'email' | 'news'
  digests: Digest[]
}

export default function DigestPanel({ label, type, digests }: DigestPanelProps) {
  const [openIndex, setOpenIndex] = useState<number>(digests.length > 0 ? 0 : -1)

  const accentClass = type === 'email' ? 'text-accent' : 'text-green'
  const labelText   = type === 'email' ? 'Email' : 'News + Drafts'

  const toggle = (i: number) => setOpenIndex(i === openIndex ? -1 : i)

  return (
    <div>
      <p className="text-[10px] font-sans uppercase tracking-widest text-muted font-medium mb-3">
        {label}
      </p>

      {digests.length === 0 ? (
        <p className="font-mono text-xs text-muted">
          No digests yet — routines run at 08:00 and 16:00 ET
        </p>
      ) : (
        <div className="border-t border-border">
          {digests.map((d, i) => (
            <DigestEntry
              key={d.id}
              slot={d.slot}
              date={d.date}
              content={d.content}
              open={i === openIndex}
              onToggle={() => toggle(i)}
              accentClass={accentClass}
              labelText={d.slot === 'morning' ? 'Morning' : 'Afternoon'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
