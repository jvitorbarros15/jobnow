import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getValidGmailTokens } from '@/lib/gmail'
import { getCalendarClient } from '@/lib/calendar'

export async function DELETE(request: NextRequest) {
  try {
    const { application_id, calendar_event_id } = await request.json()

    if (!application_id || !calendar_event_id) {
      return NextResponse.json(
        { error: 'application_id and calendar_event_id are required' },
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

    const calendar = getCalendarClient(accessToken)

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: calendar_event_id,
      })
    } catch (deleteError) {
      const msg = deleteError instanceof Error ? deleteError.message : ''
      if (!msg.toLowerCase().includes('not found') && !msg.includes('410')) {
        throw deleteError
      }
    }

    await supabase
      .from('job_applications')
      .update({ calendar_event_id: null })
      .eq('id', application_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar delete-event error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}
