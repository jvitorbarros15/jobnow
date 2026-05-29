'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

interface NavLinkProps {
  href: string
  label: string
  icon: LucideIcon
}

export default function NavLink({ href, label, icon: Icon }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      title={label}
      className={`relative group w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer ${
        isActive
          ? 'text-white bg-[#252220]'
          : 'text-[#4a4743] hover:text-[#c8c4be] hover:bg-[#1e1c1a]'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent rounded-r-full" />
      )}
      <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />

      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#f9f8f7] border border-border text-[#171412] text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 rounded-lg shadow-md">
        {label}
      </span>
    </Link>
  )
}
