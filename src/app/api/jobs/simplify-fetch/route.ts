import { NextRequest, NextResponse } from 'next/server'

interface SimplifyFetchBody {
  url: string
}

interface SimplifyFetchResponse {
  company: string | null
  role: string | null
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseMetaTags(html: string): { title?: string; description?: string } {
  const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/)
  const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/)

  return {
    title: titleMatch?.[1] || undefined,
    description: descMatch?.[1] || undefined,
  }
}

function parseJsonLd(html: string): any {
  const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
  if (!jsonLdMatch) return null

  try {
    return JSON.parse(jsonLdMatch[1])
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: SimplifyFetchBody = await req.json()

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate it's a Simplify URL
    if (!body.url.includes('simplify.jobs')) {
      return NextResponse.json(
        { error: 'Only simplify.jobs URLs are supported' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(body.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobTracker/1.0)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Try JSON-LD first
    const jsonLd = parseJsonLd(html)
    if (jsonLd && jsonLd.title && jsonLd.hiringOrganization?.name) {
      return NextResponse.json({
        company: jsonLd.hiringOrganization.name,
        role: jsonLd.title,
      } as SimplifyFetchResponse)
    }

    // Fall back to og: meta tags
    const metaTags = parseMetaTags(html)
    let company: string | null = null
    let role: string | null = null

    if (metaTags.title) {
      const lastAt = metaTags.title.lastIndexOf(' at ')
      if (lastAt > 0) {
        role = decodeHtmlEntities(metaTags.title.slice(0, lastAt).trim())
        company = decodeHtmlEntities(metaTags.title.slice(lastAt + 4).trim())
      } else {
        role = decodeHtmlEntities(metaTags.title)
      }
    }

    return NextResponse.json({
      company,
      role,
    } as SimplifyFetchResponse)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch' },
      { status: 500 }
    )
  }
}
