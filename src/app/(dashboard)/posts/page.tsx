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
  const [currentDraft, setCurrentDraft] = useState<{
    id: string
    variants: PostVariant[]
  } | null>(null)

  const fetchNews = useCallback(async (selectedTopic: string, force = false) => {
    setLoadingNews(true)
    setNewsError(null)
    try {
      const params = new URLSearchParams({
        topic: selectedTopic,
        ...(force && { force: 'true' }),
      })
      const res = await fetch(`/api/news/fetch?${params}`)
      const data = await res.json()

      if (!res.ok) {
        setNewsError(data.error || 'Failed to fetch news')
        return
      }

      setArticles(data.articles || [])
    } catch (error) {
      setNewsError('Network error — failed to fetch news')
      console.error(error)
    } finally {
      setLoadingNews(false)
    }
  }, [])

  const handleSelectTopic = useCallback(
    (selectedTopic: string) => {
      setTopic(selectedTopic)
      setCurrentDraft(null)
      fetchNews(selectedTopic)
    },
    [fetchNews]
  )

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

      if (!res.ok) {
        setDraftError(data.error || 'Failed to generate post')
        return
      }

      setCurrentDraft({
        id: data.draft_id,
        variants: data.variants,
      })
    } catch (error) {
      setDraftError('Network error — failed to generate post')
      console.error(error)
    } finally {
      setDrafting(false)
    }
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

      if (!res.ok) {
        setDraftError(data.error || 'Failed to regenerate post')
        return
      }

      setCurrentDraft({
        id: data.draft_id,
        variants: data.variants,
      })
    } catch (error) {
      setDraftError('Network error — failed to regenerate post')
      console.error(error)
    } finally {
      setDrafting(false)
    }
  }

  const handleSelectDraft = (draft: PostDraft) => {
    setCurrentDraft({
      id: draft.id,
      variants: draft.variants,
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">LinkedIn Posts</h1>
        <p className="text-muted">Generate engaging posts from tech news</p>
      </div>

      {/* Topic Selector */}
      <TopicSelector
        topics={TOPICS}
        selectedTopic={topic}
        onSelect={handleSelectTopic}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column — News Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest News</h2>
            <button
              onClick={() => fetchNews(topic, true)}
              disabled={loadingNews}
              className="text-xs text-muted hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingNews ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {newsError && (
            <div className="bg-surface border border-red/40 rounded-lg p-4 flex items-start justify-between">
              <span className="text-sm text-red-400">{newsError}</span>
              <button
                onClick={() => fetchNews(topic, true)}
                className="text-xs text-red-400 hover:text-red-300 whitespace-nowrap ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {loadingNews && articles.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-lg p-4 h-24 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <NewsCard key={article.url} article={article} />
              ))}
            </div>
          )}

          {!loadingNews && articles.length === 0 && !newsError && (
            <div className="bg-surface border border-border rounded-lg p-6 text-center text-muted">
              <p className="text-sm">No articles found. Try refreshing.</p>
            </div>
          )}

          <button
            onClick={handleGeneratePost}
            disabled={loadingNews || drafting || articles.length === 0}
            className="w-full px-6 py-3 bg-accent hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-white rounded-lg flex items-center justify-center gap-2"
          >
            {drafting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Zap size={18} />
                Generate Post
              </>
            )}
          </button>
        </div>

        {/* Right Column — Post Editor */}
        <div className="lg:col-span-3 space-y-4">
          {draftError && (
            <div className="bg-surface border border-red/40 rounded-lg p-4">
              <span className="text-sm text-red-400">{draftError}</span>
            </div>
          )}

          {currentDraft ? (
            <PostVariants
              variants={currentDraft.variants}
              draftId={currentDraft.id}
              onRegenerate={handleRegenerate}
            />
          ) : (
            <div className="bg-surface border border-accent/30 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center h-96">
              <Zap size={40} className="text-accent mb-4 opacity-80" />
              <h3 className="text-lg font-semibold mb-2">Ready to draft?</h3>
              <p className="text-muted text-sm max-w-xs">
                Select a topic and click "Generate Post" to create AI-powered variants
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Draft History */}
      <DraftHistory onSelectDraft={handleSelectDraft} />
    </div>
  )
}
