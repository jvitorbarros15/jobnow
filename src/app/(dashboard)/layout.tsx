import { createServerClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-background text-white">
      <Sidebar userEmail={user.email} />
      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
