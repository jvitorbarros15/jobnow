'use client'

import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number
  delay?: number
}

function useCountUp(target: number, delay = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (target === 0) return setCount(0)
      const duration = 750
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(eased * target))
        if (progress >= 1) clearInterval(interval)
      }, 16)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay])
  return count
}

export default function StatsCard({ icon: Icon, label, value, delay = 0 }: StatsCardProps) {
  const displayValue = useCountUp(value, delay)

  return (
    <div
      className="panel panel-hover p-5 flex items-center gap-4 opacity-0"
      style={{ animation: `fadeInUp 0.4s ease ${delay}ms forwards` }}
    >
      <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-accent" />
      </div>
      <div>
        <p className="font-display text-3xl font-bold text-text leading-none tabular-nums">
          {displayValue}
        </p>
        <p className="text-[10px] font-sans text-muted uppercase tracking-[0.15em] mt-1.5">
          {label}
        </p>
      </div>
    </div>
  )
}
