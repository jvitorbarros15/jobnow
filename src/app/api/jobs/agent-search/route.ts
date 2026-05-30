import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { searchJobs } from '@/lib/jobs'
import type { AgentSearchResult, AgentJobResult, JobResult } from '@/types/jobs'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('agent_job_searches')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ result: data || null })
  } catch (error) {
    console.error('GET /api/jobs/agent-search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let searchId: string | null = null

  try {
    // Load user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('resume_profile')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }

    const resumeProfile = profile?.resume_profile || ''

    // Insert initial record
    const { data: insertedRow, error: insertError } = await supabase
      .from('agent_job_searches')
      .insert({
        user_id: user.id,
        status: 'running',
        results: [],
        summary: '',
        sources_searched: 0,
        completed_at: null,
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create search record' }, { status: 500 })
    }

    if (!insertedRow?.id) {
      throw new Error('Failed to create search record: missing ID')
    }
    searchId = insertedRow.id

    // Run parallel job searches
    const [remoteResults, sfResults] = await Promise.allSettled([
      searchJobs('software engineer blockchain web3 AI', '', true),
      searchJobs('software engineer', 'San Francisco', false),
    ])

    const jobs: JobResult[] = []

    if (remoteResults.status === 'fulfilled') {
      jobs.push(...remoteResults.value)
    }

    if (sfResults.status === 'fulfilled') {
      jobs.push(...sfResults.value)
    }

    // Deduplicate by title + company
    const seen = new Set<string>()
    const deduplicated: JobResult[] = []

    for (const job of jobs) {
      const key = `${(job.title || '').toLowerCase()}+${(job.company || '').toLowerCase()}`
      if (!seen.has(key)) {
        seen.add(key)
        deduplicated.push(job)
      }
    }

    const topJobs = deduplicated.slice(0, 30)

    if (topJobs.length === 0) {
      if (searchId) {
        await supabase
          .from('agent_job_searches')
          .update({ status: 'failed', completed_at: new Date().toISOString() })
          .eq('id', searchId)
      }
      return NextResponse.json(
        { error: 'No jobs found matching your criteria. Try expanding your search.' },
        { status: 400 }
      )
    }

    // Call Claude for ranking
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const jobsForClaude = topJobs.map((j) => ({
      title: j.title,
      company: j.company,
      location: j.location,
      remote: j.remote,
      url: j.url,
      source: j.source,
      description: j.description?.substring(0, 1000) || '',
    }))

    const userMessage = `Analyze these ${topJobs.length} job listings for a CS student graduating in 2026, specializing in Web3/blockchain, AI, and full-stack engineering, on a student visa needing H-1B or O-1 sponsorship.

User Resume Profile:
${resumeProfile || '(No profile provided)'}

Jobs to rank:
${JSON.stringify(jobsForClaude, null, 2)}

For each job, provide: fit_score (1-10), sponsorship_status (confirmed/likely/unknown/no), fit_summary (1 sentence), priority (high/medium/low), action_items (2-3 concrete steps).

Return ONLY valid JSON with exactly this structure:
{
  "results": [
    {
      "id": "job-index-0",
      "title": "...",
      "company": "...",
      "location": "...",
      "remote": true/false,
      "url": "...",
      "source": "...",
      "fit_score": 8,
      "sponsorship_status": "likely",
      "fit_summary": "...",
      "priority": "high",
      "action_items": ["...", "...", "..."]
    }
  ],
  "summary": "Overall market snapshot and key takeaways",
  "sources_searched": ${topJobs.length}
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system:
        'You are a job advisor analyzing job listings for a CS student graduating in 2026, specializing in Web3/blockchain, AI, and full-stack engineering, on a student visa needing H-1B or O-1 sponsorship. Score each job 1-10, determine sponsorship_status (confirmed/likely/unknown/no), write a 1-sentence fit_summary, assign priority (high/medium/low), list 2-3 concrete action_items. Return only the top 5 jobs. Output JSON only, no explanation.',
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    // Extract JSON from response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    let claudeResult
    try {
      claudeResult = JSON.parse(textContent.text)
    } catch {
      console.error('Failed to parse Claude response:', textContent.text)
      throw new Error('Invalid JSON from Claude')
    }

    // Validate Claude response before storing
    const results = Array.isArray(claudeResult.results) ? claudeResult.results : []
    const summary = typeof claudeResult.summary === 'string' ? claudeResult.summary : ''
    const sourcesSearched = typeof claudeResult.sources_searched === 'number' ? claudeResult.sources_searched : topJobs.length

    // Update record with results
    const { data: updatedRow, error: updateError } = await supabase
      .from('agent_job_searches')
      .update({
        status: 'complete',
        results,
        summary,
        sources_searched: sourcesSearched,
        completed_at: new Date().toISOString(),
      })
      .eq('id', searchId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
    }

    return NextResponse.json({ result: updatedRow }, { status: 200 })
  } catch (error) {
    console.error('POST /api/jobs/agent-search error:', error)

    // Mark as failed if we have a search ID
    if (searchId) {
      try {
        await supabase
          .from('agent_job_searches')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', searchId)
      } catch (markError) {
        console.error('Failed to mark search as failed:', markError)
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
