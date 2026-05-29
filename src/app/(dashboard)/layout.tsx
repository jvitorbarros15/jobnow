import { createServerClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('gmail_refresh_token')
    .eq('id', user.id)
    .single()

  const gmailConnected = !!profile?.gmail_refresh_token

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userEmail={user.email} gmailConnected={gmailConnected} />
      <main className="flex-1 ml-14 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
