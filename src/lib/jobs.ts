import axios from 'axios'
import { anthropic } from './anthropic'
import { JobResult } from '@/types/jobs'

let indeedWarned = false
let ziprecruiterWarned = false

async function fetchIndeed(query: string, location: string): Promise<JobResult[]> {
  const publisherId = process.env.INDEED_PUBLISHER_ID
  if (!publisherId) {
    if (!indeedWarned) {
      console.warn('INDEED_PUBLISHER_ID is not set, skipping Indeed search')
      indeedWarned = true
    }
    return []
  }

  try {
    const response = await axios.get('https://api.indeed.com/ads/apisearch', {
      params: {
        publisher: publisherId,
        q: query,
        l: location,
        radius: 25,
        sort: 'date',
        format: 'json',
        v: 2,
        limit: 10,
      },
    })

    const results = response.data.results || []
    return results.map((job: any) => ({
      id: job.jobkey,
      title: job.jobtitle,
      company: job.company,
      location: job.formattedLocation,
      salary: job.formattedRelativeTime ?? null,
      source: 'Indeed' as const,
      url: job.url,
      posted_at: new Date().toISOString(),
      description: job.snippet || '',
      ats_keywords: [],
      remote:
        query.toLowerCase().includes('remote') || location === 'Remote',
    }))
  } catch (error) {
    console.error('Error fetching Indeed jobs:', error)
    return []
  }
}

async function fetchZipRecruiter(
  query: string,
  location: string,
): Promise<JobResult[]> {
  const apiKey = process.env.ZIPRECRUITER_API_KEY
  if (!apiKey) {
    if (!ziprecruiterWarned) {
      console.warn('ZIPRECRUITER_API_KEY is not set, skipping ZipRecruiter search')
      ziprecruiterWarned = true
    }
    return []
  }

  try {
    const response = await axios.get('https://api.ziprecruiter.com/jobs/v1', {
      params: {
        api_key: apiKey,
        search: query,
        location: location,
        radius_miles: 25,
        jobs_per_page: 10,
      },
    })

    const jobs = response.data.jobs || []
    return jobs.map((job: any) => ({
      id: job.id,
      title: job.name,
      company: job.hiring_company?.name || 'Unknown',
      location: job.location?.display_name || '',
      salary: job.salary_interval ?? null,
      source: 'ZipRecruiter' as const,
      url: job.url,
      posted_at: job.posted_time_friendly || new Date().toISOString(),
      description: job.job_description || '',
      ats_keywords: [],
      remote: query.toLowerCase().includes('remote') || location === 'Remote',
    }))
  } catch (error) {
    console.error('Error fetching ZipRecruiter jobs:', error)
    return []
  }
}

export async function extractAtsKeywords(description: string): Promise<string[]> {
  if (!description || description.trim().length === 0) {
    return []
  }

  try {
    const truncatedDescription = description.substring(0, 2000)

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system:
        'Extract 10-15 ATS keywords from this job description as a JSON array of strings. Return ONLY the JSON array, no explanation.',
      messages: [
        {
          role: 'user',
          content: truncatedDescription,
        },
      ],
    })

    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return []
    }

    const parsed = JSON.parse(textContent.text)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (error) {
    console.error('Error extracting ATS keywords:', error)
    return []
  }
}

export async function searchJobs(
  query: string,
  location: string,
  remote?: boolean,
): Promise<JobResult[]> {
  const [indeedResult, zipRecruiterResult] = await Promise.allSettled([
    fetchIndeed(query, location),
    fetchZipRecruiter(query, location),
  ])

  const jobs: JobResult[] = []

  if (indeedResult.status === 'fulfilled') {
    jobs.push(...indeedResult.value)
  }
  if (zipRecruiterResult.status === 'fulfilled') {
    jobs.push(...zipRecruiterResult.value)
  }

  const seen = new Set<string>()
  const deduplicated: JobResult[] = []

  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}+${job.company.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(job)
    }
  }

  const keywordExtractions = await Promise.allSettled(
    deduplicated.map((job) => extractAtsKeywords(job.description)),
  )

  const final: JobResult[] = []
  for (let i = 0; i < deduplicated.length; i++) {
    const job = deduplicated[i]
    const extraction = keywordExtractions[i]

    if (extraction.status === 'fulfilled') {
      job.ats_keywords = extraction.value
    } else {
      job.ats_keywords = []
    }

    final.push(job)
  }

  return final
}
