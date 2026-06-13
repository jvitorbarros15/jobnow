'use client'

interface KeywordScoreProps {
  score: number
  matched: string[]
  missing: string[]
}

export default function KeywordScore({ score, matched = [], missing = [] }: KeywordScoreProps) {
  const color = score >= 70 ? 'text-green' : score >= 50 ? 'text-accent' : 'text-red'

  return (
    <div className="space-y-4 border-b border-border pb-4">
      <div className="flex items-baseline gap-3">
        <span className={`font-display text-[3.5rem] font-bold leading-none tabular-nums ${color}`}>
          {score}
        </span>
        <span className="text-muted text-lg font-mono">%</span>
        <div className="ml-1">
          <p className="text-[10px] font-sans uppercase tracking-[0.12em] text-muted">ATS match</p>
          <p className="text-xs text-muted">{matched.length} of {matched.length + missing.length} keywords</p>
        </div>
      </div>

      {matched.length > 0 && (
        <div>
          <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-green mb-2">Matched</p>
          <div className="flex flex-wrap gap-1.5">
            {matched.map((kw) => (
              <span key={kw} className="flex items-center gap-2 px-2 py-1 bg-white/[0.03] rounded text-muted text-xs text-green border border-green/25">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div>
          <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-red mb-2">Missing</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((kw) => (
              <span key={kw} className="flex items-center gap-2 px-2 py-1 bg-white/[0.03] rounded text-muted text-xs text-red border border-red/25">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
