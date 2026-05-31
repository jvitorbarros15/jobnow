'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

interface JobSearchFormProps {
  onSearch: (query: string, location: string, remote: boolean) => void
  loading: boolean
}

export default function JobSearchForm({ onSearch, loading }: JobSearchFormProps) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch(query, location, remote)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel p-6 space-y-4"
    >
      <h3 className="font-semibold text-text">Search Jobs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Job Title / Keywords"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/[0.05] border border-glass-border text-text focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-colors placeholder:text-muted/50"
        />
        <input
          type="text"
          placeholder="Remote, New York, etc."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/[0.05] border border-glass-border text-text focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-colors placeholder:text-muted/50"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={remote}
          onChange={(e) => setRemote(e.target.checked)}
          className="w-4 h-4 rounded bg-white/[0.05] border border-glass-border checked:bg-accent checked:border-accent cursor-pointer"
        />
        <span className="text-sm text-text">Remote positions only</span>
      </label>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="btn-primary w-full py-2 px-4 text-sm"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
