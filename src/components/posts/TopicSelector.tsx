'use client'

interface TopicSelectorProps {
  topics: string[]
  selectedTopic: string
  onSelect: (topic: string) => void
}

export default function TopicSelector({
  topics,
  selectedTopic,
  onSelect,
}: TopicSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => onSelect(topic)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
            selectedTopic === topic
              ? 'bg-accent text-white'
              : 'border border-border text-muted hover:border-accent'
          }`}
        >
          {topic}
        </button>
      ))}
    </div>
  )
}
