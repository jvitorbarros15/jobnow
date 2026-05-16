'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, Inbox, PenTool, Search } from 'lucide-react'
import NavLink from './NavLink'

interface SidebarProps {
  userEmail?: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/tracker', label: 'Tracker', icon: Inbox },
    { href: '/posts', label: 'Posts', icon: PenTool },
    { href: '/jobs', label: 'Jobs', icon: Search },
  ]

  const getInitials = (email?: string) => {
    if (!email) return 'JN'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email[0].toUpperCase()
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface border-r border-border transition-all duration-200 z-40 flex flex-col md:relative ${
        isCollapsed ? 'w-[60px]' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <h1 className="font-serif text-lg font-bold text-white">JobMaker</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-[#1a1a24] rounded transition-colors"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? (
            <Menu size={20} className="text-white" />
          ) : (
            <X size={20} className="text-white" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isCollapsed={isCollapsed}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border space-y-3">
        <div
          className={`flex items-center gap-3 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {getInitials(userEmail)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted truncate">{userEmail || 'user@example.com'}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#1a1a24] text-white text-sm transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Sign out' : ''}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
