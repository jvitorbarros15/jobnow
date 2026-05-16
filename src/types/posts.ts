export interface NewsArticle {
  title: string
  url: string
  source: 'NewsAPI' | 'HackerNews' | 'CryptoPanic'
}

export interface PostVariant {
  tone: 'founder_take' | 'builder_update' | 'hot_take'
  content: string
}

export interface PostDraft {
  id: string
  user_id: string
  topic: string
  topic_preset: string | null
  source_articles: NewsArticle[]
  variants: PostVariant[]
  selected_variant: number | null
  final_content: string | null
  published: boolean
  created_at: string
}
