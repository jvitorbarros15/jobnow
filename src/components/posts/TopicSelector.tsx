'use client'

interface TopicSelectorProps {
  topics: string[]
  selectedTopic: string
  onSelect: (topic: string) => void
}

export default function TopicSelector({ topics, selectedTopic, onSelect }: TopicSelectorProps) {
  return (
    <div className="flex gap-0 border-b border-border overflow-x-auto">
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => onSelect(topic)}
          className={`px-4 py-2.5 text-xs font-sans font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
            selectedTopic === topic
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-[#1c1a18]'
          }`}
        >
          {topic}
        </button>
      ))}
    </div>
  )
}
