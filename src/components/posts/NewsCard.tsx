'use client'

import { formatDistanceToNow } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import type { NewsArticle } from '@/types/posts'

const sourceColors: Record<string, string> = {
  NewsAPI: 'text-[#60a5fa]',
  HackerNews: 'text-accent',
  CryptoPanic: 'text-[#c084fc]',
}

export default function NewsCard({ article }: { article: NewsArticle }) {
  const color = sourceColors[article.source] || 'text-muted'
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-border py-4 hover:border-accent/40 transition-colors relative pl-3"
    >
      <span className="absolute left-0 top-0 bottom-0 w-px bg-transparent group-hover:bg-accent transition-colors" />
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[9px] font-mono font-medium uppercase tracking-[0.15em] ${color}`}>
          {article.source}
        </span>
        <span className="text-[9px] font-mono text-muted">{timeAgo}</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm text-[#1c1a18] line-clamp-2 leading-snug group-hover:text-accent transition-colors">
          {article.title}
        </h3>
        <ExternalLink size={12} className="text-muted flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  )
}
