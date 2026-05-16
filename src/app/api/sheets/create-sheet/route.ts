import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const spreadsheetId = `test-sheet-${Date.now()}`
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    return NextResponse.json({
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl,
    })
  } catch (error) {
    console.error('Create sheet error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sheet' },
      { status: 500 }
    )
  }
}
