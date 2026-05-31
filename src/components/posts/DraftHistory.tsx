'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PostDraft } from '@/types/posts'

interface DraftHistoryProps {
  onSelectDraft: (draft: PostDraft) => void
}

export default function DraftHistory({ onSelectDraft }: DraftHistoryProps) {
  const [drafts, setDrafts] = useState<PostDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDrafts()
  }, [])

  async function fetchDrafts() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('post_drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      setDrafts(data as PostDraft[])
    }
    setLoading(false)
  }

  if (drafts.length === 0 && !loading) {
    return null
  }

  return (
    <div className="panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors border-b border-glass-border"
      >
        <h3 className="text-lg font-semibold text-text">Draft History</h3>
        <ChevronDown
          size={20}
          className={`text-muted transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="divide-y divide-glass-border">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-border/20 rounded animate-pulse"
                />
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <div className="p-6 text-center text-muted">
              No drafts yet. Generate your first post above!
            </div>
          ) : (
            drafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => onSelectDraft(draft)}
                className="w-full px-6 py-3 text-left hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-accent/20 text-accent whitespace-nowrap">
                      {draft.topic}
                    </span>
                  </div>
                  <p className="text-sm text-muted truncate">
                    {draft.variants[0]?.content.substring(0, 80)}...
                  </p>
                </div>
                <span className="text-xs text-muted/60 whitespace-nowrap flex-shrink-0">
                  {formatDistanceToNow(new Date(draft.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
