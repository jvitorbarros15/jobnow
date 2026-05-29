'use client'

import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'

interface LatexOutputProps {
  latex: string
  onCopy: () => void
}

export default function LatexOutput({ latex, onCopy }: LatexOutputProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(latex)
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  const overleafUrl = `https://www.overleaf.com/docs?snip=${encodeURIComponent(latex)}`

  return (
    <div className="space-y-3">
      <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-muted">LaTeX output</p>
      <pre
        className="font-mono text-xs overflow-x-auto max-h-80 p-4 leading-relaxed"
        style={{ backgroundColor: '#0f1013', color: '#f0a500', border: '1px solid #2c2f38' }}
      >
        {latex}
      </pre>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-muted hover:text-[#1c1a18] hover:border-border/80 text-xs font-sans transition-colors"
        >
          <Copy size={12} />
          {copied ? 'Copied' : 'Copy LaTeX'}
        </button>
        <a
          href={overleafUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-black text-xs font-semibold font-sans transition-opacity hover:opacity-90"
        >
          <ExternalLink size={12} />
          Open in Overleaf
        </a>
      </div>
    </div>
  )
}
