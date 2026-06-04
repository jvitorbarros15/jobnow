'use client'

import { useState, useCallback, useEffect } from 'react'
import { Zap, Loader2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PostVariants from '@/components/posts/PostVariants'
import DraftHistory from '@/components/posts/DraftHistory'
import type { PostVariant, PostDraft } from '@/types/posts'

interface NewsDigest {
  id: string
  slot: 'morning' | 'afternoon'
  date: string
  content: string
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PostsPage() {
  const [mode, setMode] = useState<'news' | 'custom'>('custom')

  // News Feed state
  const [digests, setDigests] = useState<NewsDigest[]>([])
  const [loadingDigests, setLoadingDigests] = useState(false)
  const [selectedDigest, setSelectedDigest] = useState<NewsDigest | null>(null)
  const [openDigestId, setOpenDigestId] = useState<string | null>(null)

  // Custom Content state
  const [customContent, setCustomContent] = useState('')

  // Generate state
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [currentDraft, setCurrentDraft] = useState<{ id: string; variants: PostVariant[] } | null>(null)

  const fetchDigests = useCallback(async () => {
    setLoadingDigests(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('digests')
      .select('id, slot, date, content')
      .eq('type', 'news')
      .order('date', { ascending: false })
      .order('slot', { ascending: false })
      .limit(14)
    setDigests(data ?? [])
    if (data?.[0]) setOpenDigestId(data[0].id)
    setLoadingDigests(false)
  }, [])

  useEffect(() => {
    if (mode === 'news') fetchDigests()
  }, [mode, fetchDigests])

  const activeContent = mode === 'custom' ? customContent.trim() : selectedDigest?.content ?? ''

  const generateBody = () =>
    mode === 'custom'
      ? { customContent: customContent.trim(), topic: 'Custom' }
      : { customContent: selectedDigest!.content, topic: `News Digest — ${formatDate(selectedDigest!.date)} ${selectedDigest!.slot}` }

  const canGenerate = mode === 'custom' ? !!customContent.trim() : !!selectedDigest

  const callGenerate = async () => {
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateBody()),
      })
      const data = await res.json()
      if (!res.ok) { setDraftError(data.error || 'Failed to generate post'); return }
      setCurrentDraft({ id: data.draft_id, variants: data.variants })
    } catch { setDraftError('Network error') } finally { setDrafting(false) }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text tracking-tight">LinkedIn Posts</h1>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-0 border-b border-border">
        {([['custom', 'Custom Content'], ['news', 'News Feed']] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2.5 text-xs font-sans font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              mode === m ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left panel */}
        <div className="lg:col-span-2 space-y-0">
          {mode === 'custom' ? (
            <div className="space-y-4">
              <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-muted">Paste articles, links, or thoughts</p>
              <textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                rows={16}
                placeholder="Paste anything — article text, a URL, project notes, or raw ideas you want to post about..."
                className="w-full px-0 py-2 bg-transparent border-b border-glass-border text-text text-sm font-sans leading-relaxed placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors resize-none"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-muted">News digests</p>
                <button
                  onClick={fetchDigests}
                  disabled={loadingDigests}
                  className="text-[10px] font-sans uppercase tracking-[0.1em] text-muted hover:text-accent transition-colors disabled:opacity-40"
                >
                  {loadingDigests ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              {loadingDigests && digests.length === 0 ? (
                <div className="space-y-0">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 border-b border-border animate-pulse bg-surface/30" />
                  ))}
                </div>
              ) : digests.length === 0 ? (
                <p className="text-xs font-sans text-muted py-8 text-center">No news digests yet. Routines run at 10:00 & 17:00 ET.</p>
              ) : (
                <div className="border border-border rounded overflow-hidden">
                  {digests.map((digest) => {
                    const isOpen = openDigestId === digest.id
                    const isSelected = selectedDigest?.id === digest.id
                    return (
                      <div
                        key={digest.id}
                        className={`border-b border-border last:border-b-0 transition-colors ${isSelected ? 'bg-accent/5' : ''}`}
                      >
                        <div className="flex items-center justify-between px-3 py-2.5 group">
                          <button
                            onClick={() => {
                              setSelectedDigest(isSelected ? null : digest)
                              setOpenDigestId(isOpen ? null : digest.id)
                            }}
                            className="flex-1 flex items-center gap-2 text-left"
                          >
                            <span className={`font-mono text-xs font-semibold ${isSelected ? 'text-accent' : 'text-accent-2'}`}>
                              {digest.slot === 'morning' ? '08:00' : '16:00'}
                            </span>
                            <span className="text-muted/60 text-xs">·</span>
                            <span className="text-xs font-sans text-text">{formatDate(digest.date)}</span>
                            <span className="text-muted/60 text-xs">·</span>
                            <span className="text-[10px] font-sans text-muted capitalize">{digest.slot}</span>
                            {isSelected && (
                              <span className="ml-auto text-[9px] font-sans uppercase tracking-wider text-accent">Selected</span>
                            )}
                          </button>
                          <ChevronDown
                            size={13}
                            className={`text-muted ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                        {isOpen && (
                          <div className="px-3 pb-3 pt-1 border-t border-glass-border bg-white/[0.02]">
                            <p className="text-xs font-sans text-muted leading-6 whitespace-pre-wrap line-clamp-6">{digest.content}</p>
                            {!isSelected && (
                              <button
                                onClick={() => setSelectedDigest(digest)}
                                className="mt-2 text-[10px] font-sans uppercase tracking-wider text-accent hover:text-accent/70 transition-colors"
                              >
                                Use this digest →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <button
            onClick={callGenerate}
            disabled={drafting || !canGenerate}
            className="btn-primary w-full mt-6 py-3 text-sm"
          >
            {drafting ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Zap size={15} /> Generate Post</>}
          </button>
        </div>

        {/* Post editor */}
        <div className="lg:col-span-3">
          {draftError && (
            <div className="border border-red/30 p-3 mb-4 rounded">
              <span className="text-xs font-sans text-red">{draftError}</span>
            </div>
          )}

          {currentDraft ? (
            <PostVariants variants={currentDraft.variants} draftId={currentDraft.id} onRegenerate={callGenerate} />
          ) : (
            <div className="panel border-dashed flex flex-col items-center justify-center py-24 text-center">
              <Zap size={28} className="text-muted mb-4 opacity-40" />
              <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-muted">Ready to draft</p>
              <p className="text-sm text-muted mt-2 max-w-xs">
                {mode === 'news' ? 'Select a news digest and generate a post' : 'Paste content and generate a post'}
              </p>
            </div>
          )}
        </div>
      </div>

      <DraftHistory onSelectDraft={(draft: PostDraft) => setCurrentDraft({ id: draft.id, variants: draft.variants })} />
    </div>
  )
}
