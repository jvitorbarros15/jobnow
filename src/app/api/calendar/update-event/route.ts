import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getValidGmailTokens } from '@/lib/gmail'
import { getCalendarClient, addHours } from '@/lib/calendar'

export async function PATCH(request: NextRequest) {
  try {
    const { application_id, calendar_event_id, interview_datetime } = await request.json()

    if (!application_id || !calendar_event_id || !interview_datetime) {
      return NextResponse.json(
        { error: 'application_id, calendar_event_id, and interview_datetime are required' },
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

    const { data: updatedEvent } = await calendar.events.patch({
      calendarId: 'primary',
      eventId: calendar_event_id,
      requestBody: {
        start: { dateTime: interview_datetime, timeZone: timezone },
        end: { dateTime: endDate.toISOString(), timeZone: timezone },
      },
    })

    return NextResponse.json({
      calendar_event_id: updatedEvent?.id,
      event_url: updatedEvent?.htmlLink,
    })
  } catch (error) {
    console.error('Calendar update-event error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update calendar event'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
