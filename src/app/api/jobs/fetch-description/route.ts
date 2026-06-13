import { NextResponse } from 'next/server'

function extractMeta(html: string, property: string): string {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'))
  return match?.[1]?.trim() ?? ''
}

function extractJsonLd(html: string): { title?: string; company?: string; description?: string } {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const match of matches) {
    try {
      const data = JSON.parse(match[1])
      const job = Array.isArray(data) ? data.find((d) => d['@type'] === 'JobPosting') : data['@type'] === 'JobPosting' ? data : null
      if (job) {
        return {
          title: job.title ?? '',
          company: job.hiringOrganization?.name ?? '',
          description: job.description ?? '',
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }
  return {}
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{3,}/g, '\n\n')
    .trim()
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json() as { url: string }

    let parsed: URL
    try { parsed = new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const ALLOWED_HOSTS = new Set([
      'lever.co', 'jobs.lever.co',
      'greenhouse.io', 'boards.greenhouse.io',
      'linkedin.com', 'www.linkedin.com',
      'indeed.com', 'www.indeed.com',
      'ziprecruiter.com', 'www.ziprecruiter.com',
      'wellfound.com', 'angel.co',
      'workday.com', 'myworkdayjobs.com',
      'careers.google.com', 'jobs.ashbyhq.com',
    ])
    const ALLOWED_SUFFIXES = [
      '.myworkdayjobs.com',
      '.greenhouse.io',
      '.lever.co',
      '.ashbyhq.com',
    ]
    const hostname = parsed.hostname
    const stripped = hostname.replace(/^www\./, '')
    if (
      !ALLOWED_HOSTS.has(hostname) &&
      !ALLOWED_HOSTS.has(stripped) &&
      !ALLOWED_SUFFIXES.some((s) => hostname.endsWith(s))
    ) {
      return NextResponse.json({ error: 'URL host not permitted' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 })
    }

    const html = await res.text()

    const jsonLd = extractJsonLd(html)
    const title = jsonLd.title || extractMeta(html, 'og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s*[-|].*$/, '').trim() || ''
    const company = jsonLd.company || extractMeta(html, 'og:site_name') || ''
    const description = jsonLd.description
      ? stripHtml(jsonLd.description).slice(0, 8000)
      : stripHtml(html).slice(0, 8000)

    return NextResponse.json({ title, company, description })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to fetch job description: ${msg}` }, { status: 500 })
  }
}
