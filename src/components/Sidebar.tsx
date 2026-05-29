'use client'

import { LogOut, Inbox, PenTool, Search, Mail, House } from 'lucide-react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import NavLink from './NavLink'

interface SidebarProps {
  userEmail?: string
  gmailConnected?: boolean
}

export default function Sidebar({ userEmail, gmailConnected }: SidebarProps) {
  const navItems = [
    { href: '/home',    label: 'Home',    icon: House },
    { href: '/tracker', label: 'Tracker', icon: Inbox },
    { href: '/posts',   label: 'Posts',   icon: PenTool },
    { href: '/jobs',    label: 'Jobs',    icon: Search },
  ]

  const getInitials = (email?: string) => {
    if (!email) return 'JV'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return email[0].toUpperCase()
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  const handleConnectGmail = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
        scopes: 'gmail.readonly calendar.events spreadsheets',
      },
    })
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 bg-sidebar z-40 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="w-7 h-7 bg-accent rounded flex items-center justify-center mb-8 flex-shrink-0">
        <span className="font-display text-[11px] font-bold text-white tracking-tight">JN</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-0.5 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={gmailConnected ? undefined : handleConnectGmail}
          title={gmailConnected ? 'Gmail connected' : 'Connect Gmail'}
          className="relative p-2.5 text-[#4a4743] hover:text-[#c8c4be] transition-colors duration-150 disabled:cursor-default cursor-pointer"
          disabled={gmailConnected}
        >
          <Mail size={14} strokeWidth={1.5} />
          <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${gmailConnected ? 'bg-green' : 'bg-accent'}`} />
        </button>

        <div
          className="w-6 h-6 rounded-full bg-[#252220] border border-[#352f2a] flex items-center justify-center text-[9px] font-semibold text-[#c8c4be] font-sans"
          title={userEmail}
        >
          {getInitials(userEmail)}
        </div>

        <button
          onClick={handleSignOut}
          title="Sign out"
          className="p-2.5 text-[#4a4743] hover:text-[#c8c4be] transition-colors duration-150 cursor-pointer"
        >
          <LogOut size={14} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  )
}
