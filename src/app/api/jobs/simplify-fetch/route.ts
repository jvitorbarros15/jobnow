import { NextRequest, NextResponse } from 'next/server'

interface SimplifyFetchBody {
  url: string
}

interface SimplifyFetchResponse {
  company: string | null
  role: string | null
}

function parseMetaTags(html: string): { title?: string; description?: string } {
  const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/)
  const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/)

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
      const parts = metaTags.title.split(' at ')
      if (parts.length === 2) {
        role = parts[0].trim()
        company = parts[1].trim()
      } else {
        role = metaTags.title
      }
    }

    return NextResponse.json({
      company,
      role,
    } as SimplifyFetchResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Fetch failed: ${message}` },
      { status: 500 }
    )
  }
}
