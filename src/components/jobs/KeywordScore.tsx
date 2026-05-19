'use client'

import { AlertTriangle } from 'lucide-react'

interface KeywordScoreProps {
  score: number
  matched: string[]
  missing: string[]
}

export default function KeywordScore({ score, matched, missing }: KeywordScoreProps) {
  const color =
    score >= 70
      ? { ring: 'stroke-green-400', text: 'text-green-400' }
      : score >= 50
      ? { ring: 'stroke-amber-400', text: 'text-amber-400' }
      : { ring: 'stroke-red-400', text: 'text-red-400' }

  const circumference = 2 * Math.PI * 28
  const dash = (score / 100) * circumference

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className={color.ring}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${color.text}`}>{score}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">ATS Match Score</p>
          <p className="text-xs text-muted">
            {matched.length} of {matched.length + missing.length} keywords matched
          </p>
        </div>
      </div>

      {matched.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted mb-1.5">Matched keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {matched.map((kw) => (
              <span
                key={kw}
                className="px-2 py-0.5 rounded text-xs bg-green-500/15 text-green-400 border border-green-500/25"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} className="text-red-400" />
            Missing skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((kw) => (
              <span
                key={kw}
                className="px-2 py-0.5 rounded text-xs bg-red-500/15 text-red-400 border border-red-500/25"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
