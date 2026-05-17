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
      if (!res.ok) {
        onError(data.error || 'Sync failed')
        return
      }
      onSyncComplete({
        synced: data.synced ?? 0,
        calendar_events_created: data.calendar_events_created ?? 0,
      })
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
      className="px-6 py-3 bg-accent hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white rounded-lg flex items-center gap-2"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
      {loading ? 'Syncing…' : 'Sync Gmail'}
    </button>
  )
}
