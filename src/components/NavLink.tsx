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
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`group/nav relative flex items-center gap-3 h-10 rounded-[10px] px-3 transition-colors duration-200 cursor-pointer ${
        active ? 'text-text bg-white/[0.06]' : 'text-muted hover:text-text hover:bg-white/[0.04]'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-accent shadow-[0_0_12px_rgba(124,92,255,0.8)]" />
      )}
      <Icon size={18} strokeWidth={1.75} className="flex-shrink-0" />
      <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover/side:opacity-100 transition-opacity duration-200">
        {label}
      </span>
    </Link>
  )
}
