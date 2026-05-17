import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    const message = errorDescription || error
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, requestUrl))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=No authorization code received', requestUrl))
  }

  try {
    const supabase = await createServerClient()

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl)
      )
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Get user error:', userError)
      return NextResponse.redirect(new URL('/login?error=Failed to get user information', requestUrl))
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError)
      return NextResponse.redirect(new URL('/login?error=Failed to fetch profile', requestUrl))
    }

    if (!profile) {
      return NextResponse.redirect(new URL('/onboarding', requestUrl))
    }

    return NextResponse.redirect(new URL('/tracker', requestUrl))
  } catch (error) {
    console.error('Callback error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, requestUrl))
  }
}
