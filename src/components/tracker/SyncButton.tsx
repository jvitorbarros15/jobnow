'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'

interface SyncButtonProps {
  onSyncComplete: (result: { synced: number; calendar_events_created: number }) => void
  onError: (msg: string) => void
  onSyncStart: () => void
}

export default function SyncButton({ onSyncComplete, onError, onSyncStart }: SyncButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    setLoading(true)
    onSyncStart()
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { onError(data.error || 'Sync failed'); return }
      onSyncComplete({ synced: data.synced ?? 0, calendar_events_created: data.calendar_events_created ?? 0 })
    } catch {
      onError('Network error — sync failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-semibold font-sans rounded-lg transition-all duration-150 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
      {loading ? 'Syncing…' : 'Sync Gmail'}
    </button>
  )
}
