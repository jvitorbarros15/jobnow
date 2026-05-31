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
  const [topic, setTopic] = useState(TOPICS[0])
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
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
    if (articles.length === 0) return
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles, topic }),
      })
      const data = await res.json()
      if (!res.ok) { setDraftError(data.error || 'Failed to generate post'); return }
      setCurrentDraft({ id: data.draft_id, variants: data.variants })
    } catch { setDraftError('Network error') } finally { setDrafting(false) }
  }

  const handleRegenerate = async () => {
    if (!currentDraft || articles.length === 0) return
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles, topic }),
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

      <TopicSelector topics={TOPICS} selectedTopic={topic} onSelect={handleSelectTopic} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* News feed */}
        <div className="lg:col-span-2 space-y-0">
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

          <button
            onClick={handleGeneratePost}
            disabled={loadingNews || drafting || articles.length === 0}
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
