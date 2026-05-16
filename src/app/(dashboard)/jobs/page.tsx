'use client'

import { useState } from 'react'
import { Search, MapPin, FileText } from 'lucide-react'

export default function JobsPage() {
  const [formData, setFormData] = useState({
    query: '',
    location: '',
    remote: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Jobs & Resume</h1>
        <p className="text-muted">Find roles and generate tailored resumes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold mb-4">Search Jobs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="query"
                placeholder="Job Title / Keywords"
                value={formData.query}
                onChange={handleChange}
                className="px-4 py-2 rounded-lg bg-background border border-border focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                className="px-4 py-2 rounded-lg bg-background border border-border focus:border-accent focus:outline-none transition-colors placeholder-muted/50"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="remote"
                checked={formData.remote}
                onChange={handleChange}
                className="w-4 h-4 rounded bg-background border border-border checked:bg-accent checked:border-accent cursor-pointer"
              />
              <span className="text-sm">Remote positions only</span>
            </label>
            <button className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 font-medium text-white flex items-center justify-center gap-2">
              <Search size={18} />
              Search
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Featured Opportunities</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-border/50 flex-shrink-0 animate-pulse" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="h-4 bg-border/50 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-border/50 rounded w-1/2 animate-pulse" />
                      <div className="flex gap-4 pt-2 text-xs text-muted">
                        <div className="h-3 bg-border/50 rounded w-24 animate-pulse" />
                        <div className="h-3 bg-border/50 rounded w-24 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-right text-xs flex-shrink-0">
                      <div className="h-3 bg-border/50 rounded w-20 animate-pulse mb-2" />
                      <div className="h-3 bg-accent/20 border border-accent/30 rounded px-2 py-1 text-accent w-16 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-lg p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-accent" />
              <h3 className="text-lg font-semibold">Resume Builder</h3>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-8">
              <FileText size={40} className="text-muted/30 mb-3" />
              <p className="text-muted text-sm mb-4">No saved jobs yet</p>
              <p className="text-xs text-muted/50 mb-6">
                Save a job to auto-generate a tailored resume
              </p>
              <button className="px-4 py-2 border border-border text-sm rounded-lg hover:border-accent/50 hover:text-accent transition-colors">
                Browse jobs above
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
