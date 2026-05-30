'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number>(digests.length > 0 ? 0 : -1)
  const [deletedIds, setDeletedIds] = useState<string[]>([])

  const accentClass = type === 'email' ? 'text-accent' : 'text-green'
  const accentBg = type === 'email' ? 'bg-amber-50/30' : 'bg-green-50/30'
  const accentBorder = type === 'email' ? 'border-accent/20' : 'border-green/20'
  const labelText = type === 'email' ? 'Email' : 'News + Drafts'

  const visible = digests.filter((d) => !deletedIds.includes(d.id))

  const toggle = (i: number) => setOpenIndex(i === openIndex ? -1 : i)

  const handleDelete = async (id: string) => {
    setDeletedIds((prev) => [...prev, id])
    setOpenIndex(-1)
    const { error } = await createClient().from('digests').delete().eq('id', id)
    if (error) {
      setDeletedIds((prev) => prev.filter((x) => x !== id))
      return
    }
    router.refresh()
  }

  return (
    <div className="h-full">
      <div className="mb-4 pb-4 border-b border-border">
        <p className={`text-[10px] font-sans uppercase tracking-widest font-semibold mb-1 ${accentClass}`}>
          {label}
        </p>
        <p className="text-xs text-muted font-mono">
          {type === 'email' ? 'inbox summary' : 'industry updates'}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className={`rounded-lg border ${accentBorder} ${accentBg} p-4`}>
          <p className="font-mono text-xs text-muted leading-relaxed">
            No digests yet<br />
            routines run at 08:00 &amp; 16:00 ET
          </p>
        </div>
      ) : (
        <div className={`rounded-lg border ${accentBorder} ${accentBg} overflow-hidden backdrop-blur-sm`}>
          <div className="divide-y divide-border/50">
            {visible.map((d, i) => (
              <div
                key={d.id}
                className="transition-colors hover:bg-surface-2/20 group"
              >
                <DigestEntry
                  slot={d.slot}
                  date={d.date}
                  content={d.content}
                  open={i === openIndex}
                  onToggle={() => toggle(i)}
                  onDelete={() => handleDelete(d.id)}
                  accentClass={accentClass}
                  labelText={d.slot === 'morning' ? 'Morning' : 'Afternoon'}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
