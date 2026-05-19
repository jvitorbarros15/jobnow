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
      <pre
        className="text-xs overflow-x-auto max-h-96 p-4 rounded-lg leading-relaxed"
        style={{
          backgroundColor: '#0a0a0f',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {latex}
      </pre>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border text-muted hover:border-accent/50 hover:text-white transition-colors"
        >
          <Copy size={14} />
          {copied ? 'Copied ✓' : 'Copy LaTeX'}
        </button>
        <a
          href={overleafUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-600 hover:bg-green-500 text-white transition-colors"
        >
          <ExternalLink size={14} />
          Open in Overleaf
        </a>
      </div>
    </div>
  )
}
