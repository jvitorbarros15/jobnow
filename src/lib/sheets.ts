import { google } from 'googleapis'
import { getValidGmailTokens } from './gmail'

export async function getSheetsClient(userId: string) {
  const accessToken = await getValidGmailTokens(userId)
  if (!accessToken) return null

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2Client.setCredentials({ access_token: accessToken })

  return google.sheets({ version: 'v4', auth: oauth2Client })
}

export const SHEET_HEADERS = [
  'Company',
  'Role',
  'Status',
  'Date',
  'Recruiter Email',
  'Interview Date',
  'Interview Location',
  'Calendar',
  'Next Action',
]

export const STATUS_COLORS: Record<string, { red: number; green: number; blue: number }> = {
  offer: { red: 0.133, green: 0.773, blue: 0.369 },
  rejected: { red: 0.937, green: 0.267, blue: 0.267 },
  interview_scheduled: { red: 0.961, green: 0.62, blue: 0.043 },
}
