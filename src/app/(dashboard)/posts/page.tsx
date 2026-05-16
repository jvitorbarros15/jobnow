'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'

const TOPICS = ['AI / LLMs', 'Blockchain / Web3', 'Onchain AI', 'Startup / Founder', 'Developer Tools']

export default function PostsPage() {
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">LinkedIn Posts</h1>
        <p className="text-muted">Generate engaging posts from tech news</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedTopic === topic
                ? 'bg-accent text-white'
                : 'bg-surface border border-border text-muted hover:border-accent/50'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Latest News</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-lg overflow-hidden hover:border-accent/50 transition-colors">
              <div className="h-40 bg-border/50 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-border/50 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-border/50 rounded w-1/2 animate-pulse" />
                <div className="pt-2 border-t border-border/50 flex gap-2 text-xs text-muted">
                  <span className="h-3 bg-border/50 rounded w-20 animate-pulse" />
                  <span className="h-3 bg-border/50 rounded w-20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-accent/30 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center">
        <Zap size={40} className="text-accent mb-4 opacity-80" />
        <h3 className="text-xl font-semibold mb-2">Ready to generate?</h3>
        <p className="text-muted mb-6 max-w-md">
          Click below to generate an AI-powered LinkedIn post based on the latest news in your selected topic
        </p>
        <button className="px-8 py-3 bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 font-medium text-white rounded-lg flex items-center gap-2">
          <Zap size={20} />
          Generate Post
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Drafts</h3>
        <div className="bg-surface border border-border rounded-lg p-8 flex flex-col items-center justify-center text-center min-h-64">
          <p className="text-muted">No drafts yet. Generate your first post above!</p>
        </div>
      </div>
    </div>
  )
}
