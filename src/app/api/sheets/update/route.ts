import { createServerClient } from '@/lib/supabase/server'
import { getSheetsClient, STATUS_COLORS } from '@/lib/sheets'
import { NextRequest, NextResponse } from 'next/server'
import type { JobApplication } from '@/types/tracker'

function toRow(app: JobApplication): string[] {
  return [
    app.company,
    app.role,
    app.status,
    app.date ?? '',
    app.recruiter_email ?? '',
    app.interview_datetime ?? '',
    app.interview_location ?? '',
    app.calendar_event_id ?? '',
    app.next_action ?? '',
  ]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('sheets_spreadsheet_id')
      .eq('id', user.id)
      .single()

    const spreadsheetId = profile?.sheets_spreadsheet_id
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'No sheet found. Please create a sheet first in onboarding.' },
        { status: 400 }
      )
    }

    const sheets = await getSheetsClient(user.id)
    if (!sheets) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect Gmail first.' },
        { status: 400 }
      )
    }

    const { applications }: { applications: JobApplication[] } = await request.json()
    if (!Array.isArray(applications) || applications.length === 0) {
      return NextResponse.json({ updated: 0, appended: 0, errors: [] })
    }

    // Read existing rows to detect duplicates by gmail_thread_id stored in a hidden col or by company+role
    // Strategy: append all as new rows, then deduplicate by re-reading.
    // Simpler: read current data, find existing rows by matching company+role, update in place.
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:I',
    })

    const existingRows = existing.data.values ?? []

    // Build a map: company|role -> row index (1-based, offset by 2 for header)
    const rowMap = new Map<string, number>()
    existingRows.forEach((row, i) => {
      const key = `${row[0]}|${row[1]}`
      rowMap.set(key, i + 2)
    })

    const toUpdate: { range: string; values: string[][] }[] = []
    const toAppend: string[][] = []

    for (const app of applications) {
      const key = `${app.company}|${app.role}`
      const row = toRow(app)
      if (rowMap.has(key)) {
        const rowNum = rowMap.get(key)!
        toUpdate.push({ range: `Sheet1!A${rowNum}:I${rowNum}`, values: [row] })
      } else {
        toAppend.push(row)
      }
    }

    const errors: string[] = []

    if (toUpdate.length > 0) {
      try {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: toUpdate,
          },
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Batch update failed'
        errors.push(msg)
        console.error('Sheets batchUpdate error:', e)
      }
    }

    if (toAppend.length > 0) {
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Sheet1!A1',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: toAppend },
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Append failed'
        errors.push(msg)
        console.error('Sheets append error:', e)
      }
    }

    // Apply conditional formatting for status column (col C = index 2)
    const sheetId = 0 // default first sheet
    const formatRequests = Object.entries(STATUS_COLORS).map(([status, color]) => ({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: 1, startColumnIndex: 2, endColumnIndex: 3 }],
          booleanRule: {
            condition: {
              type: 'TEXT_EQ',
              values: [{ userEnteredValue: status }],
            },
            format: {
              backgroundColor: color,
            },
          },
        },
        index: 0,
      },
    }))

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: formatRequests },
      })
    } catch (e) {
      console.error('Conditional format error:', e)
      // Non-fatal — formatting failure should not block data sync
    }

    return NextResponse.json({
      updated: toUpdate.length,
      appended: toAppend.length,
      errors,
    })
  } catch (error) {
    console.error('Update sheet error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update sheet' },
      { status: 500 }
    )
  }
}
