'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface NavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  isCollapsed: boolean
  isActive: boolean
}

export default function NavLink({
  href,
  label,
  icon: Icon,
  isCollapsed,
  isActive,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 relative group ${
        isActive
          ? 'bg-accent text-white font-semibold'
          : 'text-white hover:bg-[#1a1a24]'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : ''}
    >
      <Icon size={20} />
      {!isCollapsed && <span>{label}</span>}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a24] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </Link>
  )
}
