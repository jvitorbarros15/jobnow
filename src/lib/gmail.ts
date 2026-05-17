import { google } from 'googleapis'
import { createServerClient } from './supabase/server'

export async function getValidGmailTokens(userId: string) {
  const supabase = await createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('gmail_access_token, gmail_refresh_token, gmail_token_expiry')
    .eq('id', userId)
    .single()

  if (!profile?.gmail_refresh_token) return null

  // Check if token expired
  if (
    profile.gmail_token_expiry &&
    new Date(profile.gmail_token_expiry) < new Date()
  ) {
    try {
      // Refresh token
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      )
      oauth2Client.setCredentials({
        refresh_token: profile.gmail_refresh_token,
      })
      const { credentials } = await oauth2Client.refreshAccessToken()

      // Update in DB
      await supabase
        .from('profiles')
        .update({
          gmail_access_token: credentials.access_token,
          gmail_token_expiry: new Date(credentials.expiry_date || 0),
        })
        .eq('id', userId)

      return credentials.access_token
    } catch (error) {
      console.error('Failed to refresh Gmail token:', error)
      return null
    }
  }

  return profile.gmail_access_token
}
