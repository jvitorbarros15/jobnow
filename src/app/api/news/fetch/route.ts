import { createServerClient } from '@/lib/supabase/server'
import { fetchNewsByTopic } from '@/lib/news'
import { NextResponse } from 'next/server'

const CACHE_DURATION_MS = 30 * 60 * 1000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || 'AI / LLMs'
  const force = searchParams.get('force') === 'true'

  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!force) {
      const { data: cached } = await supabase
        .from('news_cache')
        .select('articles, created_at')
        .eq('user_id', user.id)
        .eq('topic', topic)
        .single()

      if (cached) {
        const cacheAge = Date.now() - new Date(cached.created_at).getTime()
        if (cacheAge < CACHE_DURATION_MS) {
          return NextResponse.json({
            articles: cached.articles,
            cached: true,
            fetched_at: cached.created_at,
          })
        }
      }
    }

    const articles = await fetchNewsByTopic(topic)

    await supabase.from('news_cache').upsert(
      {
        user_id: user.id,
        topic,
        articles,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,topic',
      }
    )

    return NextResponse.json({
      articles,
      cached: false,
      fetched_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in news fetch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
