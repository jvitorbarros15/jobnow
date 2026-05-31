import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { JobApplication } from '@/types/tracker'

interface CreateApplicationBody {
  company: string
  role: string
  status: string
  date: string
  notes: string
  gmail_thread_url: string | null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreateApplicationBody = await req.json()

    if (!body.company || !body.role) {
      return NextResponse.json(
        { error: 'Company and role are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: user.id,
        company: body.company,
        role: body.role,
        status: body.status || 'applied',
        date: body.date || new Date().toISOString().split('T')[0],
        notes: body.notes || null,
        gmail_thread_url: body.gmail_thread_url || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data as JobApplication, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create application: ${message}` },
      { status: 500 }
    )
  }
}
