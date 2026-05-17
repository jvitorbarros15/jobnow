'use client'

import { useState, useEffect } from 'react'
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

export default function PostVariants({
  variants,
  draftId,
  onRegenerate,
}: PostVariantsProps) {
  const [selectedTone, setSelectedTone] =
    useState<PostVariant['tone']>('founder_take')
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
    try {
      await onRegenerate()
    } finally {
      setRegenerating(false)
    }
  }

  const charCount = selectedVariant?.content.length || 0
  const isOverLimit = charCount > 1300

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {variants.map((variant) => (
          <button
            key={variant.tone}
            onClick={() => setSelectedTone(variant.tone)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTone === variant.tone
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted hover:text-foreground'
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
            rows={12}
            className="w-full bg-surface border border-border rounded-lg p-4 text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
          />

          <div className="flex items-center justify-between">
            <div
              className={`text-xs font-medium ${
                isOverLimit ? 'text-red-400' : 'text-muted'
              }`}
            >
              {charCount} / 1300
              {isOverLimit && ' (over limit)'}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={regenerating}
                className="px-4 py-2 bg-accent hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-white rounded-lg flex items-center gap-2"
              >
                <Copy size={16} />
                {copied ? 'Copied ✓' : 'Copy'}
              </button>

              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-4 py-2 border border-border hover:border-accent text-muted hover:text-accent transition-colors text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {regenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RotateCcw size={16} />
                )}
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
