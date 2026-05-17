import { createServerClient } from '@/lib/supabase/server'
import { getSheetsClient, SHEET_HEADERS } from '@/lib/sheets'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sheets = await getSheetsClient(user.id)
    if (!sheets) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect Gmail first.' },
        { status: 400 }
      )
    }

    const title = `Job Tracker — ${new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}`

    const sheet = await sheets.spreadsheets.create({
      requestBody: { properties: { title } },
    })

    const spreadsheetId = sheet.data.spreadsheetId!

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [SHEET_HEADERS] },
    })

    await supabase
      .from('profiles')
      .update({ sheets_spreadsheet_id: spreadsheetId })
      .eq('id', user.id)

    return NextResponse.json({
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    })
  } catch (error) {
    console.error('Create sheet error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sheet' },
      { status: 500 }
    )
  }
}
