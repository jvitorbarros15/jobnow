import axios from 'axios'
import { NewsArticle } from '@/types/posts'

const TOPIC_QUERIES: Record<
  string,
  { newsapi: string; hn: string[]; useCrypto: boolean }
> = {
  'AI / LLMs': {
    newsapi: 'artificial intelligence OR LLM OR GPT OR Claude OR Gemini',
    hn: ['AI', 'LLM', 'GPT', 'model', 'inference', 'Gemini', 'Claude'],
    useCrypto: false,
  },
  'Blockchain / Web3': {
    newsapi: 'blockchain OR web3 OR ethereum OR solidity OR Base network',
    hn: ['blockchain', 'web3', 'crypto', 'ethereum', 'defi', 'solidity'],
    useCrypto: true,
  },
  'Onchain AI': {
    newsapi:
      'onchain AI OR decentralized AI OR AI provenance OR verifiable AI',
    hn: ['onchain', 'verifiable', 'AI'],
    useCrypto: true,
  },
  'Startup / Founder': {
    newsapi:
      'startup funding OR founder OR Y Combinator OR seed round OR Series A',
    hn: ['startup', 'YC', 'Y Combinator', 'raised', 'launch', 'founder'],
    useCrypto: false,
  },
  'Developer Tools': {
    newsapi: 'developer tools OR devtools OR SDK OR open source',
    hn: ['Show HN', 'open source', 'v1.0', 'launch', 'SDK', 'CLI'],
    useCrypto: false,
  },
}

async function fetchNewsAPI(topic: string): Promise<NewsArticle[]> {
  try {
    const config = TOPIC_QUERIES[topic] || TOPIC_QUERIES['AI / LLMs']
    const apiKey = process.env.NEWS_API_KEY

    if (!apiKey) {
      return []
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: config.newsapi,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 5,
        apiKey,
      },
    })

    return (response.data.articles || []).map(
      (article: {
        title: string
        url: string
        publishedAt: string
        description?: string
      }) => ({
        title: article.title,
        url: article.url,
        source: 'NewsAPI' as const,
        publishedAt: article.publishedAt,
        snippet: article.description,
      })
    )
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error)
    return []
  }
}

async function fetchHackerNews(keywords: string[]): Promise<NewsArticle[]> {
  try {
    const topStoriesResponse = await axios.get(
      'https://hacker-news.firebaseio.com/v2/topstories.json'
    )
    const topStories: number[] = topStoriesResponse.data || []
    const storiesToFetch = topStories.slice(0, 30)

    const storyPromises = storiesToFetch.map((id) =>
      axios
        .get(`https://hacker-news.firebaseio.com/v2/item/${id}.json`)
        .then((res) => res.data)
        .catch(() => null)
    )

    const results = await Promise.allSettled(storyPromises)
    const stories = results
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value
        }
        return null
      })
      .filter(Boolean)

    const filtered = stories.filter((story) => {
      if (!story.title) return false
      const title = story.title.toLowerCase()
      return keywords.some((keyword) => title.includes(keyword.toLowerCase()))
    })

    return filtered.slice(0, 4).map((story) => ({
      title: story.title,
      url: `https://news.ycombinator.com/item?id=${story.id}`,
      source: 'HackerNews' as const,
      publishedAt: new Date(story.time * 1000).toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching from HackerNews:', error)
    return []
  }
}

async function fetchCryptoPanic(topic: string): Promise<NewsArticle[]> {
  try {
    const config = TOPIC_QUERIES[topic] || TOPIC_QUERIES['AI / LLMs']

    if (!config.useCrypto) {
      return []
    }

    const apiKey = process.env.CRYPTOPANIC_API_KEY

    if (!apiKey) {
      return []
    }

    const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: {
        auth_token: apiKey,
        filter: 'rising',
        kind: 'news',
      },
    })

    return (response.data.results || []).slice(0, 3).map(
      (post: {
        title: string
        link: string
        published_at: string
        excerpt?: string
      }) => ({
        title: post.title,
        url: post.link,
        source: 'CryptoPanic' as const,
        publishedAt: post.published_at,
        snippet: post.excerpt,
      })
    )
  } catch (error) {
    console.error('Error fetching from CryptoPanic:', error)
    return []
  }
}

export async function fetchNewsByTopic(
  topic: string
): Promise<NewsArticle[]> {
  const config = TOPIC_QUERIES[topic] || TOPIC_QUERIES['AI / LLMs']

  const results = await Promise.allSettled([
    fetchNewsAPI(topic),
    fetchHackerNews(config.hn),
    fetchCryptoPanic(topic),
  ])

  const articles: NewsArticle[] = []

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      articles.push(...result.value)
    }
  })

  const uniqueByUrl = new Map<string, NewsArticle>()
  articles.forEach((article) => {
    if (!uniqueByUrl.has(article.url)) {
      uniqueByUrl.set(article.url, article)
    }
  })

  return Array.from(uniqueByUrl.values()).slice(0, 10)
}
