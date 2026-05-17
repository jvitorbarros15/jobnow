import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getValidGmailTokens } from '@/lib/gmail'
import { getCalendarClient, addHours } from '@/lib/calendar'

export async function POST(request: NextRequest) {
  try {
    const { application_id, company, role, interview_datetime, interview_location, recruiter_name } =
      await request.json()

    if (!application_id || !company || !role || !interview_datetime) {
      return NextResponse.json(
        { error: 'application_id, company, role, and interview_datetime are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidGmailTokens(user.id)
    if (!accessToken) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()

    const timezone = profile?.timezone ?? 'UTC'

    const calendar = getCalendarClient(accessToken)

    const startDate = new Date(interview_datetime)
    const endDate = addHours(startDate, 1)

    const descriptionLines = [
      `Role: ${role}`,
      `Company: ${company}`,
      recruiter_name ? `Recruiter: ${recruiter_name}` : null,
      'Source: JobMaker auto-detected from email',
    ].filter(Boolean) as string[]

    const event = {
      summary: `Interview — ${role} at ${company}`,
      description: descriptionLines.join('\n'),
      location: interview_location || undefined,
      start: {
        dateTime: interview_datetime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timezone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
      colorId: '5',
    }

    const { data: createdEvent } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })

    if (!createdEvent?.id) {
      throw new Error('Calendar event created but no ID returned')
    }

    await supabase
      .from('job_applications')
      .update({ calendar_event_id: createdEvent.id })
      .eq('id', application_id)

    return NextResponse.json({
      calendar_event_id: createdEvent.id,
      event_url: createdEvent.htmlLink,
    })
  } catch (error) {
    console.error('Calendar create-event error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}
