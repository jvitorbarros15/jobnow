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

const VALID_STATUSES = ['applied', 'interview_scheduled', 'interview_completed', 'offer', 'rejected', 'ghosted', 'follow_up_needed']
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

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

    const company = body.company?.trim()
    const role = body.role?.trim()
    if (!company || !role) {
      return NextResponse.json(
        { error: 'Company and role are required' },
        { status: 400 }
      )
    }

    const status = body.status || 'applied'
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    if (body.date && !DATE_REGEX.test(body.date)) {
      return NextResponse.json(
        { error: 'Invalid date format, use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: user.id,
        company: company,
        role: role,
        status: status,
        date: body.date || new Date().toISOString().split('T')[0],
        notes: body.notes || null,
        gmail_thread_url: body.gmail_thread_url || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }

    return NextResponse.json(data as JobApplication, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}
