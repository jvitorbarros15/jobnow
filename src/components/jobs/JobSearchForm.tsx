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
      className="bg-surface border border-border rounded-lg p-6 space-y-4"
    >
      <h3 className="font-semibold">Search Jobs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Job Title / Keywords"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-4 py-2 rounded-lg bg-surface border border-border text-white focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
        />
        <input
          type="text"
          placeholder="Remote, New York, etc."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="px-4 py-2 rounded-lg bg-surface border border-border text-white focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={remote}
          onChange={(e) => setRemote(e.target.checked)}
          className="w-4 h-4 rounded bg-surface border border-border checked:bg-accent checked:border-accent cursor-pointer"
        />
        <span className="text-sm">Remote positions only</span>
      </label>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="w-full py-2 px-4 rounded-lg bg-accent hover:opacity-90 transition-opacity font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
