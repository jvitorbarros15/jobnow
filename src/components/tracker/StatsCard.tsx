import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number
}

export default function StatsCard({ icon: Icon, label, value }: StatsCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 hover:border-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-accent">{value}</p>
        </div>
        <Icon size={24} className="text-muted/50" />
      </div>
    </div>
  )
}
