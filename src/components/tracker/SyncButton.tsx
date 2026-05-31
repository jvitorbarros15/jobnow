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
      className="btn-primary px-4 py-2 text-xs font-semibold"
    >
      {loading ? <Loader2 size={15} className="animate-spin text-muted" /> : <Mail size={15} />}
      {loading ? 'Syncing…' : 'Sync Gmail'}
    </button>
  )
}
