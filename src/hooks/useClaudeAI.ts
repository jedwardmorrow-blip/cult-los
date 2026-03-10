import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type ClaudeActionType =
  | 'query'
  | 'health_summary'
  | 'meeting_prep'
  | 'smart_todos'
  | 'anomaly_check'

export interface ClaudeAIResponse {
  response: string
  source: 'claude' | 'algorithmic' | 'algorithmic_fallback'
  model?: string
  usage?: { input_tokens: number; output_tokens: number }
}

interface UseClaudeAIReturn {
  ask: (action: ClaudeActionType, query?: string) => Promise<ClaudeAIResponse | null>
  loading: boolean
  error: string | null
  lastResponse: ClaudeAIResponse | null
  clearResponse: () => void
}

export function useClaudeAI(): UseClaudeAIReturn {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<ClaudeAIResponse | null>(null)

  const ask = useCallback(async (action: ClaudeActionType, query?: string): Promise<ClaudeAIResponse | null> => {
    if (!user?.id) {
      setError('Not authenticated')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('claude-ai-query', {
        body: { action, query },
      })

      if (fnError) {
        setError(fnError.message || 'Failed to get AI response')
        setLoading(false)
        return null
      }

      const result = data as ClaudeAIResponse
      setLastResponse(result)
      setLoading(false)
      return result
    } catch (err: any) {
      setError(err.message || 'Unexpected error')
      setLoading(false)
      return null
    }
  }, [user?.id])

  const clearResponse = useCallback(() => {
    setLastResponse(null)
    setError(null)
  }, [])

  return { ask, loading, error, lastResponse, clearResponse }
}
