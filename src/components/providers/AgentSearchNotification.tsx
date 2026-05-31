'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useAgentSearch } from '@/lib/contexts/AgentSearchContext'

export default function AgentSearchNotification() {
  const { result, loading } = useAgentSearch()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (result?.status === 'complete' && !loading) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [result?.status, loading])

  if (!show) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-start gap-3 p-4 bg-surface border border-green/30 rounded-lg shadow-lg max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Sparkles size={18} className="text-green flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-text">AI job search complete!</p>
        <p className="text-xs text-muted mt-1">Found {result?.results?.length || 0} jobs. Go to Jobs page to see results.</p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-muted hover:text-text transition-colors p-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}
