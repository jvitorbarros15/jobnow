'use client'

import { Mail, Calendar, Award, AlertCircle } from 'lucide-react'

export default function TrackerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Job Tracker</h1>
        <p className="text-muted">Monitor your job applications and interviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Mail} label="Applications" value="0" />
        <StatCard icon={Calendar} label="Interviews Scheduled" value="0" />
        <StatCard icon={Award} label="Offers" value="0" />
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 flex flex-col items-center justify-center min-h-96">
        <button
          disabled
          className="mb-8 px-6 py-3 bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white rounded-lg flex items-center gap-2"
          title="Connect your Gmail in onboarding first"
        >
          <Mail size={20} />
          Sync Gmail
        </button>
        <div className="flex gap-2 mb-4 text-amber">
          <AlertCircle size={20} />
          <p className="text-sm">Connect your Gmail in onboarding first</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Mail size={48} className="text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No applications synced yet</h3>
          <p className="text-muted text-sm max-w-md">
            Connect your Gmail to auto-sync job applications from your inbox
          </p>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <h4 className="text-sm font-semibold text-muted mb-4 uppercase">Preview</h4>
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-muted mb-3">
              <div>Company</div>
              <div>Role</div>
              <div>Status</div>
              <div>Date</div>
              <div>Action</div>
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-4 py-3 border-t border-border/50 items-center"
              >
                <div className="h-4 bg-border/50 rounded w-24 animate-pulse" />
                <div className="h-4 bg-border/50 rounded w-20 animate-pulse" />
                <div className="h-4 bg-border/50 rounded w-16 animate-pulse" />
                <div className="h-4 bg-border/50 rounded w-16 animate-pulse" />
                <div className="h-4 bg-border/50 rounded w-12 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
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
