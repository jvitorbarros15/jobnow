'use client'

import { formatDistanceToNow } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import type { NewsArticle } from '@/types/posts'

interface NewsCardProps {
  article: NewsArticle
}

const sourceColors: Record<string, { bg: string; text: string }> = {
  NewsAPI: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  HackerNews: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  CryptoPanic: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
}

export default function NewsCard({ article }: NewsCardProps) {
  const colors = sourceColors[article.source] || sourceColors.NewsAPI
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  })

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-surface border border-border rounded-lg p-4 hover:border-accent/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${colors.bg} ${colors.text} whitespace-nowrap`}
        >
          {article.source}
        </span>
        <ExternalLink
          size={16}
          className="text-muted/50 group-hover:text-accent flex-shrink-0 mt-0.5"
        />
      </div>

      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-accent transition-colors">
        {article.title}
      </h3>

      <p className="text-xs text-muted">{timeAgo}</p>
    </a>
  )
}
