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
    <aside className="group/side fixed left-0 top-0 h-screen w-16 hover:w-56 z-40 flex flex-col py-4 px-3 bg-sidebar/80 backdrop-blur-xl border-r border-glass-border transition-[width] duration-200 ease-out overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-3 h-9 px-1 mb-6 flex-shrink-0">
        <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(124,92,255,0.45)]">
          <span className="font-display text-sm font-bold text-[#0b0b12] tracking-tight">JN</span>
        </div>
        <span className="font-display text-base font-semibold text-text whitespace-nowrap opacity-0 group-hover/side:opacity-100 transition-opacity duration-200">
          JobNow
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-glass-border pt-3">
        <button
          onClick={gmailConnected ? undefined : handleConnectGmail}
          disabled={gmailConnected}
          aria-label={gmailConnected ? 'Gmail connected' : 'Connect Gmail'}
          className="relative flex items-center gap-3 h-10 rounded-[10px] px-3 text-muted hover:text-text hover:bg-white/[0.04] transition-colors duration-200 disabled:cursor-default cursor-pointer"
        >
          <Mail size={18} strokeWidth={1.75} className="flex-shrink-0" />
          <span className={`absolute top-2.5 left-7 w-1.5 h-1.5 rounded-full ${gmailConnected ? 'bg-green' : 'bg-amber'}`} />
          <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover/side:opacity-100 transition-opacity duration-200">
            {gmailConnected ? 'Gmail linked' : 'Connect Gmail'}
          </span>
        </button>

        <div className="flex items-center gap-3 h-10 px-3">
          <div
            className="w-7 h-7 rounded-full bg-surface-2 border border-glass-border flex items-center justify-center text-[10px] font-semibold text-text font-sans flex-shrink-0"
            title={userEmail}
          >
            {getInitials(userEmail)}
          </div>
          <span className="text-xs text-muted truncate whitespace-nowrap opacity-0 group-hover/side:opacity-100 transition-opacity duration-200">
            {userEmail}
          </span>
        </div>

        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="flex items-center gap-3 h-10 rounded-[10px] px-3 text-muted hover:text-red hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer"
        >
          <LogOut size={18} strokeWidth={1.75} className="flex-shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover/side:opacity-100 transition-opacity duration-200">
            Sign out
          </span>
        </button>
      </div>
    </aside>
  )
}
