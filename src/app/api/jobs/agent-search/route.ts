import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ result: data || null })
  } catch (error) {
    console.error('GET /api/jobs/agent-search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
