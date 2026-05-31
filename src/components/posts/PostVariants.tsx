'use client'

import { useState } from 'react'
import { Copy, RotateCcw, Loader2 } from 'lucide-react'
import type { PostVariant } from '@/types/posts'

interface PostVariantsProps {
  variants: PostVariant[]
  draftId: string
  onRegenerate: () => Promise<void>
}

const toneLabels: Record<string, string> = {
  founder_take: 'Founder Take',
  builder_update: 'Builder Update',
  hot_take: 'Hot Take',
}

export default function PostVariants({ variants, draftId, onRegenerate }: PostVariantsProps) {
  const [selectedTone, setSelectedTone] = useState<PostVariant['tone']>('founder_take')
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const selectedVariant = variants.find((v) => v.tone === selectedTone)

  async function handleCopy() {
    if (!selectedVariant) return
    await navigator.clipboard.writeText(selectedVariant.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try { await onRegenerate() } finally { setRegenerating(false) }
  }

  const charCount = selectedVariant?.content.length || 0
  const isOverLimit = charCount > 1300

  return (
    <div className="space-y-4">
      <div className="flex gap-0 border-b border-border">
        {variants.map((variant) => (
          <button
            key={variant.tone}
            onClick={() => setSelectedTone(variant.tone)}
            className={`px-4 py-2.5 text-xs font-sans font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              selectedTone === variant.tone
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-[#1c1a18]'
            }`}
          >
            {toneLabels[variant.tone]}
          </button>
        ))}
      </div>

      {selectedVariant && (
        <div className="space-y-3">
          <textarea
            value={selectedVariant.content}
            readOnly
            rows={14}
            className="w-full bg-white/[0.02] border border-glass-border rounded p-4 text-sm font-sans text-text leading-relaxed resize-none focus:outline-none focus:border-accent/50 transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className={`font-mono text-xs ${isOverLimit ? 'text-red' : 'text-muted'}`}>
              {charCount} / 1300{isOverLimit && ' — over limit'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="btn-ghost px-3 py-2 text-xs"
              >
                {regenerating ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Regenerate
              </button>
              <button
                onClick={handleCopy}
                disabled={regenerating}
                className="btn-primary px-4 py-2 text-xs"
              >
                <Copy size={12} />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
