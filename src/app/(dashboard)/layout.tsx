import { createServerClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('gmail_refresh_token')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Profile fetch error:', profileError)
    throw new Error('Failed to load profile')
  }

  const gmailConnected = !!(profile?.gmail_refresh_token)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userEmail={user.email} gmailConnected={gmailConnected} />
      <main className="ml-16 min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">{children}</div>
      </main>
    </div>
  )
}
