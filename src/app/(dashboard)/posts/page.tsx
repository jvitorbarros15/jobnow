'use client'

import { useState, useCallback } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import TopicSelector from '@/components/posts/TopicSelector'
import NewsCard from '@/components/posts/NewsCard'
import PostVariants from '@/components/posts/PostVariants'
import DraftHistory from '@/components/posts/DraftHistory'
import type { NewsArticle, PostVariant, PostDraft } from '@/types/posts'

const TOPICS = ['AI / LLMs', 'Blockchain / Web3', 'Onchain AI', 'Startup / Founder', 'Developer Tools']

export default function PostsPage() {
  const [mode, setMode] = useState<'news' | 'custom'>('custom')
  const [topic, setTopic] = useState(TOPICS[0])
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [customContent, setCustomContent] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [currentDraft, setCurrentDraft] = useState<{ id: string; variants: PostVariant[] } | null>(null)

  const fetchNews = useCallback(async (selectedTopic: string, force = false) => {
    setLoadingNews(true)
    setNewsError(null)
    try {
      const params = new URLSearchParams({ topic: selectedTopic, ...(force && { force: 'true' }) })
      const res = await fetch(`/api/news/fetch?${params}`)
      const data = await res.json()
      if (!res.ok) { setNewsError(data.error || 'Failed to fetch news'); return }
      setArticles(data.articles || [])
    } catch { setNewsError('Network error') } finally { setLoadingNews(false) }
  }, [])

  const handleSelectTopic = useCallback((selectedTopic: string) => {
    setTopic(selectedTopic)
    setCurrentDraft(null)
    fetchNews(selectedTopic)
  }, [fetchNews])

  const handleGeneratePost = async () => {
    if (mode === 'news' && articles.length === 0) return
    if (mode === 'custom' && !customContent.trim()) return
    setDrafting(true)
    setDraftError(null)
    try {
      const body = mode === 'custom'
        ? { customContent: customContent.trim(), topic: 'Custom' }
        : { articles, topic }
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setDraftError(data.error || 'Failed to generate post'); return }
      setCurrentDraft({ id: data.draft_id, variants: data.variants })
    } catch { setDraftError('Network error') } finally { setDrafting(false) }
  }

  const handleRegenerate = async () => {
    if (!currentDraft) return
    if (mode === 'news' && articles.length === 0) return
    if (mode === 'custom' && !customContent.trim()) return
    setDrafting(true)
    setDraftError(null)
    try {
      const body = mode === 'custom'
        ? { customContent: customContent.trim(), topic: 'Custom' }
        : { articles, topic }
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setDraftError(data.error || 'Failed'); return }
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

      {mode === 'news' && (
        <TopicSelector topics={TOPICS} selectedTopic={topic} onSelect={handleSelectTopic} />
      )}

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
                placeholder={"Paste anything — article text, a URL, project notes, or raw ideas you want to post about..."}
                className="w-full px-0 py-2 bg-transparent border-b border-glass-border text-text text-sm font-sans leading-relaxed placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors resize-none"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-muted">Latest</p>
                <button
                  onClick={() => fetchNews(topic, true)}
                  disabled={loadingNews}
                  className="text-[10px] font-sans uppercase tracking-[0.1em] text-muted hover:text-accent transition-colors disabled:opacity-40"
                >
                  {loadingNews ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {newsError && (
                <div className="border border-red/30 p-3 mb-4 rounded">
                  <span className="text-xs font-sans text-red">{newsError}</span>
                </div>
              )}

              {loadingNews && articles.length === 0 ? (
                <div className="space-y-0">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 border-b border-border animate-pulse bg-surface/30" />
                  ))}
                </div>
              ) : (
                <div>
                  {articles.map((article) => (
                    <NewsCard key={article.url} article={article} />
                  ))}
                </div>
              )}

              {!loadingNews && articles.length === 0 && !newsError && (
                <p className="text-xs font-sans text-muted py-8 text-center">Select a topic to load news</p>
              )}
            </>
          )}

          <button
            onClick={handleGeneratePost}
            disabled={drafting || (mode === 'news' ? loadingNews || articles.length === 0 : !customContent.trim())}
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
            <PostVariants variants={currentDraft.variants} draftId={currentDraft.id} onRegenerate={handleRegenerate} />
          ) : (
            <div className="panel border-dashed flex flex-col items-center justify-center py-24 text-center">
              <Zap size={28} className="text-muted mb-4 opacity-40" />
              <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-muted">Ready to draft</p>
              <p className="text-sm text-muted mt-2 max-w-xs">Select a topic and generate a post</p>
            </div>
          )}
        </div>
      </div>

      <DraftHistory onSelectDraft={(draft: PostDraft) => setCurrentDraft({ id: draft.id, variants: draft.variants })} />
    </div>
  )
}
