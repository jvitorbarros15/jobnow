import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { searchJobs } from '@/lib/jobs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const location = searchParams.get('location') || ''
  const remote = searchParams.get('remote') === 'true'

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const jobs = await searchJobs(query, location, remote)
    return NextResponse.json({ jobs, total: jobs.length })
  } catch (error) {
    console.error('Job search error:', error)
    return NextResponse.json({ error: 'Search failed', jobs: [], total: 0 }, { status: 500 })
  }
}
