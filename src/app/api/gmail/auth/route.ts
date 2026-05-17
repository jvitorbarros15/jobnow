import { google } from 'googleapis'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors from Google
  if (error) {
    const message = errorDescription || error
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent(
        `Gmail access denied: ${message}`
      )}`
    )
  }

  if (!code) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent(
        'Missing authorization code'
      )}`
    )
  }

  try {
    // Get user session
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect(
        `/onboarding?step=2&error=${encodeURIComponent('User not authenticated')}`
      )
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('No access or refresh token in response')
    }

    // Store tokens in Supabase
    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 60 * 60 * 1000) // Default 1 hour if missing

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_token_expiry: expiryDate,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    // Redirect to next onboarding step
    redirect('/onboarding?step=3')
  } catch (error) {
    console.error('Gmail OAuth exchange error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to exchange authorization code'
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent(
        `Gmail authentication failed: ${message}`
      )}`
    )
  }
}
