'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { AgentSearchResult } from '@/types/jobs'

interface AgentSearchContextType {
  result: AgentSearchResult | null
  loading: boolean
  error: string | null
  startSearch: () => Promise<void>
  clearSearch: () => void
  fetchLatestResult: () => Promise<void>
}

const AgentSearchContext = createContext<AgentSearchContextType | undefined>(undefined)

export function AgentSearchProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<AgentSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchLatestResult = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs/agent-search')
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
        if (data.result.status === 'complete') {
          setLoading(false)
          if (pollInterval) clearInterval(pollInterval)
        }
      }
    } catch (err) {
      console.error('Failed to fetch agent search result:', err)
    }
  }, [pollInterval])

  const startSearch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/jobs/agent-search', { method: 'POST' })
      if (!res.ok) throw new Error('Search failed')

      // Start polling immediately
      const newPollInterval = setInterval(() => {
        fetchLatestResult()
      }, 5000)

      setPollInterval(newPollInterval)
      localStorage.setItem('agentSearchActive', 'true')

      // Initial fetch
      await fetchLatestResult()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
      setLoading(false)
      localStorage.removeItem('agentSearchActive')
    }
  }, [fetchLatestResult])

  const clearSearch = useCallback(() => {
    setResult(null)
    setLoading(false)
    setError(null)
    if (pollInterval) clearInterval(pollInterval)
    localStorage.removeItem('agentSearchActive')
  }, [pollInterval])

  // Resume polling if search was in progress
  useEffect(() => {
    const isSearchActive = localStorage.getItem('agentSearchActive') === 'true'
    if (isSearchActive && !loading) {
      setLoading(true)
      const newPollInterval = setInterval(() => {
        fetchLatestResult()
      }, 5000)
      setPollInterval(newPollInterval)
      fetchLatestResult()
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [])

  return (
    <AgentSearchContext.Provider value={{ result, loading, error, startSearch, clearSearch, fetchLatestResult }}>
      {children}
    </AgentSearchContext.Provider>
  )
}

export function useAgentSearch() {
  const context = useContext(AgentSearchContext)
  if (!context) {
    throw new Error('useAgentSearch must be used within AgentSearchProvider')
  }
  return context
}
