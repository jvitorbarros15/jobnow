'use client'

import { useState } from 'react'
import { Copy, ExternalLink, Sparkles, ClipboardCheck } from 'lucide-react'

interface JobMeta {
  title: string
  company: string
  description: string
}

interface LatexOutputProps {
  latex: string
  onCopy: () => void
  jobMeta?: JobMeta
}

export default function LatexOutput({ latex, onCopy, jobMeta }: LatexOutputProps) {
  const [copied, setCopied] = useState(false)
  const [reviewCopied, setReviewCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(latex)
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleReviewCopy() {
    const prompt = [
      'Analyze my resume against this job description. Give me:',
      '1. Match score out of 100',
      '2. Top 5 keywords',
      '3. Top 3 red flags a hiring manager would notice in 10 seconds',
      '',
      jobMeta ? `Job: ${jobMeta.title} at ${jobMeta.company}` : '',
      jobMeta ? `\nJob Description:\n${jobMeta.description}` : '',
      '',
      'Resume (LaTeX):',
      latex,
    ].join('\n')

    await navigator.clipboard.writeText(prompt)
    setReviewCopied(true)
    setTimeout(() => setReviewCopied(false), 3000)
  }

  const overleafUrl = `https://www.overleaf.com/docs?snip=${encodeURIComponent(latex)}`

  return (
    <div className="space-y-3">
      <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-muted">LaTeX output</p>
      <pre
        className="font-mono text-xs overflow-x-auto max-h-80 p-4 leading-relaxed bg-black/20 border border-glass-border rounded text-text"
      >
        {latex}
      </pre>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCopy}
          className="btn-ghost px-3 py-2 text-xs"
        >
          <Copy size={12} />
          {copied ? 'Copied' : 'Copy LaTeX'}
        </button>
        <a
          href={overleafUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary px-4 py-2 text-xs"
        >
          <ExternalLink size={12} />
          Open in Overleaf
        </a>
      </div>

      <div className="pt-2 border-t border-glass-border">
        <button
          onClick={handleReviewCopy}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-sans border rounded transition-all ${
            reviewCopied
              ? 'border-green/40 bg-green/10 text-green'
              : 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 hover:border-accent/50'
          }`}
        >
          {reviewCopied ? (
            <>
              <ClipboardCheck size={13} />
              Prompt copied — paste into Claude Code chat
            </>
          ) : (
            <>
              <Sparkles size={13} />
              Review &amp; Improve with Claude
            </>
          )}
        </button>
        {reviewCopied && (
          <p className="text-[10px] text-muted text-center mt-1.5">
            Type your message in Claude Code — the agent will score, flag red flags, and rewrite
          </p>
        )}
      </div>
    </div>
  )
}
