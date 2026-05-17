import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { v4 as uuid } from 'uuid'
import { createServerClient } from '@/lib/supabase/server'
import { getValidGmailTokens } from '@/lib/gmail'
import { anthropic } from '@/lib/anthropic'

const GMAIL_QUERY =
  'subject:(application OR interview OR offer OR rejection OR "next steps" OR "moving forward" OR "not moving forward" OR "your application" OR "position" OR "opportunity" OR "hiring" OR "recruiter") newer_than:30d -from:noreply@linkedin.com -from:jobs-noreply@linkedin.com -category:promotions'

function extractEmailBody(payload: any): string {
  if (!payload) return ''

  const decode = (data: string) =>
    Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')

  if (payload.body?.data) {
    return decode(payload.body.data)
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decode(part.body.data)
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decode(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      }
    }
    for (const part of payload.parts) {
      const nested = extractEmailBody(part)
      if (nested) return nested
    }
  }

  return ''
}

function getHeader(headers: any[], name: string): string {
  return headers?.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || ''
}

async function classifyThread(emailContent: string, subject: string, from: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a job application email classifier. Extract structured data from job-related email threads and return ONLY valid JSON with no explanation or preamble.`,
    messages: [
      {
        role: 'user',
        content: `Classify this job application email thread and return ONLY valid JSON matching this schema exactly:

{
  "company": string | null,
  "role": string | null,
  "status": "applied" | "interviewing" | "interview_scheduled" | "offered" | "rejected" | "ghosted" | "withdrawn" | null,
  "date": string | null,
  "recruiter_name": string | null,
  "recruiter_email": string | null,
  "notes": string | null,
  "next_action": string | null,
  "confidence": number,
  "interview_datetime": string | null,
  "interview_location": string | null
}

Rules:
- confidence: 0-100 score for how certain you are this is a job application email
- date: ISO 8601 format (YYYY-MM-DD) if found, else null
- interview_datetime: ISO 8601 datetime if an interview is scheduled, else null
- interview_location: physical address, video link, or "phone" if applicable, else null
- status "interview_scheduled" only when a specific interview time is confirmed
- If not a job application email, set confidence below 60

From: ${from}
Subject: ${subject}

Email content:
${emailContent.slice(0, 4000)}`,
      },
    ],
  })

  if (message.content[0].type !== 'text') return null
  const text = message.content[0].text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  return JSON.parse(jsonMatch[0])
}

export async function POST(request: NextRequest) {
  const errors: string[] = []
  let synced = 0
  let skipped = 0
  let calendarEventsCreated = 0

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidGmailTokens(user.id)
    if (!accessToken) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    oauth2Client.setCredentials({ access_token: accessToken })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const listRes = await gmail.users.threads.list({
      userId: 'me',
      q: GMAIL_QUERY,
      maxResults: 10,
    })

    const threads = listRes.data.threads || []

    for (const thread of threads) {
      const threadId = thread.id!

      try {
        const { data: existing } = await supabase
          .from('job_applications')
          .select('id')
          .eq('gmail_thread_id', threadId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (existing) {
          skipped++
          continue
        }

        const threadRes = await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'full',
        })

        const messages = threadRes.data.messages || []
        if (!messages.length) {
          skipped++
          continue
        }

        const firstMsg = messages[0]
        const headers = firstMsg.payload?.headers || []
        const subject = getHeader(headers, 'subject')
        const from = getHeader(headers, 'from')

        const bodyParts = messages.map((m) => extractEmailBody(m.payload)).filter(Boolean)
        const emailContent = bodyParts.join('\n\n---\n\n')

        if (!emailContent.trim()) {
          skipped++
          continue
        }

        let result: any
        try {
          result = await classifyThread(emailContent, subject, from)
        } catch (err) {
          errors.push(`Thread ${threadId}: Claude classification failed - ${err}`)
          continue
        }

        if (!result || result.confidence < 60) {
          skipped++
          continue
        }

        const applicationId = uuid()

        const { error: upsertError } = await supabase.from('job_applications').upsert(
          {
            id: applicationId,
            user_id: user.id,
            company: result.company,
            role: result.role,
            status: result.status,
            date: result.date,
            recruiter_name: result.recruiter_name,
            recruiter_email: result.recruiter_email,
            notes: result.notes,
            next_action: result.next_action,
            gmail_thread_id: threadId,
            gmail_thread_url: `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
            confidence: result.confidence,
            interview_datetime: result.interview_datetime,
            interview_location: result.interview_location,
          },
          { onConflict: 'gmail_thread_id' }
        )

        if (upsertError) {
          errors.push(`Thread ${threadId}: DB upsert failed - ${upsertError.message}`)
          continue
        }

        synced++

        if (result.status === 'interview_scheduled' && result.interview_datetime) {
          try {
            const calRes = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/create-event`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
                body: JSON.stringify({
                  company: result.company,
                  role: result.role,
                  interview_datetime: result.interview_datetime,
                  interview_location: result.interview_location,
                  application_id: applicationId,
                  gmail_thread_url: `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
                }),
              }
            )

            if (calRes.ok) {
              const calData = await calRes.json()
              if (calData.calendar_event_id) {
                await supabase
                  .from('job_applications')
                  .update({ calendar_event_id: calData.calendar_event_id })
                  .eq('gmail_thread_id', threadId)
                  .eq('user_id', user.id)
                calendarEventsCreated++
              }
            }
          } catch (err) {
            errors.push(`Thread ${threadId}: Calendar event creation failed - ${err}`)
          }
        }

        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sheets/update`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
              body: JSON.stringify({
                user_id: user.id,
                application: {
                  company: result.company,
                  role: result.role,
                  status: result.status,
                  date: result.date,
                  recruiter_name: result.recruiter_name,
                  recruiter_email: result.recruiter_email,
                  notes: result.notes,
                  gmail_thread_url: `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
                },
              }),
            }
          )
        } catch (err) {
          errors.push(`Thread ${threadId}: Sheets update failed - ${err}`)
        }
      } catch (err) {
        errors.push(`Thread ${threadId}: ${err}`)
        continue
      }
    }

    return NextResponse.json({
      synced,
      skipped,
      calendar_events_created: calendarEventsCreated,
      errors,
    })
  } catch (err) {
    console.error('Gmail sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
